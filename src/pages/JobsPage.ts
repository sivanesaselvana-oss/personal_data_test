import { BasePage } from './BasePage';
import { JobDetailsPage } from './JobDetailsPage';
import { SideMenu } from '../components/SideMenu';
import { env } from '../config/env';
import type { RefreshOptions } from './ManageRequestsPage';

/** One row of the Job Management table. */
export type JobRow = {
  jobNumber: string;
  scheduledDate: string;
  status: string;
  description: string;
  location: string;
  technician: string;
  account: string;
  creationDate: string;
};

/** Jobs screen (/jobs) — the landing page after a successful SSO login. */
export class JobsPage extends BasePage {
  readonly sideMenu = new SideMenu(this.page);

  private readonly heading = this.page.getByRole('heading', { name: 'Job Management', level: 2 });
  private readonly tableRows = this.page.locator('table tbody tr');
  private readonly searchInput = this.page.getByPlaceholder('Search jobs...');

  /** Waits until the SSO callback completes and the app has left /login and /callback. */
  async waitForLoaded(timeout = 60_000): Promise<void> {
    const appHost = new URL(env.baseUrl).hostname;
    await this.page.waitForURL(
      (url) =>
        url.hostname === appHost &&
        !url.pathname.startsWith('/login') &&
        !url.pathname.startsWith('/callback'),
      { timeout },
    );
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Opens the Jobs list by URL in this tab (requires a logged-in session). */
  async open(path: string): Promise<this> {
    await this.page.goto(path);
    await this.waitForLoaded();
    await this.waitForVisible(this.heading, 60_000);
    return this;
  }

  /** Rows load a few seconds after the page; returns [] if the list stays empty. */
  async getJobRows(): Promise<JobRow[]> {
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 60_000 }).catch(() => undefined);
    const rows: JobRow[] = [];
    for (const row of await this.tableRows.all()) {
      const cells = (await row.locator('td').allInnerTexts()).map((text) => text.replace(/\s+/g, ' ').trim());
      const [jobNumber, scheduledDate, status, description, location, technician, account, , creationDate] = cells;
      rows.push({ jobNumber, scheduledDate, status, description, location, technician, account, creationDate });
    }
    return rows;
  }

  /** Types the job number into "Search jobs..." and waits for the list to filter down to it. */
  async searchJob(jobNumber: string): Promise<void> {
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 60_000 }).catch(() => undefined);
    await this.searchInput.fill(jobNumber);
    await this.tableRows
      .first()
      .locator('td:first-child')
      .getByText(jobNumber, { exact: true })
      .waitFor({ state: 'visible', timeout: 15_000 })
      .catch(() => undefined);
  }

  async getJobNumbers(): Promise<string[]> {
    return (await this.getJobRows()).map((row) => row.jobNumber);
  }

  /**
   * Finds a job created during the test: not in `existingJobNumbers` and matching `match` exactly.
   * While it is missing, reloads the page up to `maxRefreshes` times, `intervalMs` apart.
   * Among several matches, returns the first row (the list is sorted newest first).
   */
  async waitForNewJob(
    match: Pick<JobRow, 'description' | 'location'>,
    existingJobNumbers: string[],
    { maxRefreshes, intervalMs }: RefreshOptions,
  ): Promise<{ row: JobRow | null; refreshes: number }> {
    const known = new Set(existingJobNumbers);
    for (let refreshes = 0; ; refreshes++) {
      const row =
        (await this.getJobRows()).find(
          (job) => !known.has(job.jobNumber) && job.description === match.description && job.location === match.location,
        ) ?? null;
      if (row || refreshes >= maxRefreshes) {
        return { row, refreshes };
      }
      await this.page.waitForTimeout(intervalMs);
      await this.reload();
      await this.waitForVisible(this.heading, 60_000);
    }
  }

  async findJob(jobNumber: string): Promise<JobRow | null> {
    return (await this.getJobRows()).find((row) => row.jobNumber === jobNumber) ?? null;
  }

  async clickJobNumber(jobNumber: string): Promise<JobDetailsPage> {
    // The job number's inner span is the clickable element; keep the hover-expanding side menu out of the way.
    await this.page.mouse.move(1000, 500);
    await this.tableRows.locator('td:first-child').getByText(jobNumber, { exact: true }).click();
    const jobDetailsPage = new JobDetailsPage(this.page, jobNumber);
    await jobDetailsPage.waitForLoaded();
    return jobDetailsPage;
  }
}
