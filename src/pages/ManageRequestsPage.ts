import { BasePage } from './BasePage';
import { SideMenu } from '../components/SideMenu';
import { ShareRequestFormPopup } from '../components/ShareRequestFormPopup';
import { appDateToIso } from '../utils/date';
import { RequestDetailsPage } from './RequestDetailsPage';
import { CreateJobPanel } from '../components/CreateJobPanel';
import { JobsPage } from './JobsPage';

/** One row of the Manage Requests table. */
export type ServiceRequestRow = {
  reqNumber: string;
  submitted: string;
  status: string;
  customer: string;
  description: string;
  location: string;
  preferredDate: string;
};

/** Fields used to recognise a request we submitted (all compared exactly). */
export type ServiceRequestMatch = Pick<ServiceRequestRow, 'customer' | 'description' | 'location' | 'preferredDate'>;

export type RefreshOptions = { maxRefreshes: number; intervalMs: number };

/** Manage Requests screen (/request-forms) — list of submitted service requests. */
export class ManageRequestsPage extends BasePage {
  readonly sideMenu = new SideMenu(this.page);

  private readonly heading = this.page.getByRole('heading', { name: 'Manage Requests', level: 2 });
  private readonly shareFormButton = this.page.getByRole('button', { name: 'Share Form' });
  private readonly tableRows = this.page.locator('table tbody tr');

  /** Opens Manage Requests directly by URL in this tab (requires a logged-in session). */
  async open(path: string): Promise<this> {
    await this.page.goto(path);
    await this.waitForLoaded();
    return this;
  }

  async waitForLoaded(): Promise<void> {
    await this.page.waitForURL('**/request-forms', { timeout: 30_000 });
    await this.waitForVisible(this.heading);
  }

  async isHeadingVisible(): Promise<boolean> {
    return this.isDisplayed(this.heading);
  }

  async isShareFormButtonVisible(): Promise<boolean> {
    return this.isDisplayed(this.shareFormButton);
  }

  async clickShareForm(): Promise<ShareRequestFormPopup> {
    await this.shareFormButton.click();
    const popup = new ShareRequestFormPopup(this.page);
    await popup.waitForLoaded();
    return popup;
  }

  async clickRequestNumber(reqNumber: string): Promise<RequestDetailsPage> {
    // The side menu expands on hover and covers the REQ column; move the mouse away first.
    await this.page.mouse.move(1000, 500);
    await this.tableRows.locator('td:first-child').getByText(reqNumber, { exact: true }).click();
    const requestDetailsPage = new RequestDetailsPage(this.page, reqNumber);
    await requestDetailsPage.waitForLoaded();
    return requestDetailsPage;
  }

  /** Navigates this tab to the Jobs list by URL. */
  async navigateToJobs(path: string): Promise<JobsPage> {
    return new JobsPage(this.page).open(path);
  }

  /** Clicks the "+" (Create Job) action in the given request's row and returns the Create Job panel. */
  async clickCreateJob(reqNumber: string): Promise<CreateJobPanel> {
    await this.page.mouse.move(1000, 500); // keep the hover-expanding side menu off the table
    const row = this.tableRows.filter({ has: this.page.getByText(reqNumber, { exact: true }) });
    await row.getByRole('button', { name: 'Create Job' }).click();
    const panel = new CreateJobPanel(this.page);
    await panel.waitForLoaded();
    return panel;
  }

  /** Rows load a few seconds after the page; returns [] if the list stays empty. */
  async getRequestRows(): Promise<ServiceRequestRow[]> {
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined);
    const rows: ServiceRequestRow[] = [];
    for (const row of await this.tableRows.all()) {
      const [reqNumber, submitted, status, customer, description, location, preferredDate] = (
        await row.locator('td').allInnerTexts()
      ).map((text) => text.trim());
      rows.push({ reqNumber, submitted, status, customer, description, location, preferredDate });
    }
    return rows;
  }

  async getRequestNumbers(): Promise<string[]> {
    return (await this.getRequestRows()).map((row) => row.reqNumber);
  }

  /** Finds a row that is not in `existingReqNumbers` and matches `match`, or null. */
  async findNewRequest(match: ServiceRequestMatch, existingReqNumbers: string[]): Promise<ServiceRequestRow | null> {
    const known = new Set(existingReqNumbers);
    const rows = await this.getRequestRows();
    return (
      rows.find(
        (row) =>
          !known.has(row.reqNumber) &&
          row.customer === match.customer &&
          row.description === match.description &&
          row.location === match.location &&
          // The list has shown dates as both DD-MM-YYYY and MM/DD/YYYY; compare as ISO.
          appDateToIso(row.preferredDate) === appDateToIso(match.preferredDate),
      ) ?? null
    );
  }

  /**
   * Looks for the newly created request and, while it is missing, reloads the page
   * (up to `maxRefreshes` times, `intervalMs` apart). Returns the row, or null if it never appeared.
   */
  async waitForNewRequest(
    match: ServiceRequestMatch,
    existingReqNumbers: string[],
    { maxRefreshes, intervalMs }: RefreshOptions,
  ): Promise<{ row: ServiceRequestRow | null; refreshes: number }> {
    for (let refreshes = 0; ; refreshes++) {
      const row = await this.findNewRequest(match, existingReqNumbers);
      if (row || refreshes >= maxRefreshes) {
        return { row, refreshes };
      }
      await this.page.waitForTimeout(intervalMs);
      await this.reload();
      await this.waitForLoaded();
    }
  }
}
