import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { JobDetailsPage } from './JobDetailsPage';
import { JobsPage } from './JobsPage';
import type { RefreshOptions } from './ManageRequestsPage';

/** Request Form Details (/request-forms/<REQ number>), opened by clicking a REQ number in Manage Requests. */
export class RequestDetailsPage extends BasePage {
  private readonly heading = this.page.getByRole('heading', { name: /Request Form Details/, level: 2 });
  private readonly backToListingButton = this.page.getByRole('button', { name: 'Back to Listing' });
  private readonly jobListLabel = this.page.getByText('Job List', { exact: true });
  private readonly jobIdButtons = this.page.getByRole('button', { name: /^JOB-\d+$/ });
  private readonly noJobMessage = this.page.getByText('No job created yet', { exact: true });

  constructor(page: Page, private readonly reqNumber: string) {
    super(page);
  }

  async waitForLoaded(): Promise<void> {
    await this.page.waitForURL(`**/request-forms/${this.reqNumber}`, { timeout: 30_000 });
    await this.waitForVisible(this.heading, 60_000);
    // The job list renders after the details; wait until it shows either jobs or the empty message.
    await this.waitForVisible(this.jobListLabel, 60_000);
    await this.jobIdButtons.first().or(this.noJobMessage).waitFor({ state: 'visible', timeout: 60_000 });
  }

  async isRequestNumberDisplayed(): Promise<boolean> {
    return this.page.getByText(this.reqNumber, { exact: true }).first().isVisible();
  }

  async getJobIds(): Promise<string[]> {
    return (await this.jobIdButtons.allTextContents()).map((text) => text.trim());
  }

  /**
   * Returns the first Job ID in the request's Job List. While the list says "No job created yet",
   * re-opens the request (Back to Listing → REQ number) up to `maxRefreshes` times, `intervalMs` apart.
   * (Re-opening is used because loading the details URL directly does not render the page.)
   */
  async waitForJobId({ maxRefreshes, intervalMs }: RefreshOptions): Promise<{ jobId: string | null; refreshes: number }> {
    for (let refreshes = 0; ; refreshes++) {
      const [jobId] = await this.getJobIds();
      if (jobId || refreshes >= maxRefreshes) {
        return { jobId: jobId ?? null, refreshes };
      }
      await this.page.waitForTimeout(intervalMs);
      await this.backToListingButton.click();
      await this.page.waitForURL('**/request-forms', { timeout: 30_000 });
      const reqLink = this.page.locator('table tbody tr td:first-child').getByText(this.reqNumber, { exact: true });
      await reqLink.waitFor({ state: 'visible', timeout: 30_000 });
      await this.page.mouse.move(1000, 500); // keep the hover-expanding side menu from covering the table
      await reqLink.click();
      await this.waitForLoaded();
    }
  }

  /** Navigates this tab to the Jobs list by URL. */
  async navigateToJobs(path: string): Promise<JobsPage> {
    return new JobsPage(this.page).open(path);
  }

  async clickJobId(jobId: string): Promise<JobDetailsPage> {
    await this.page.getByRole('button', { name: jobId, exact: true }).click();
    const jobDetailsPage = new JobDetailsPage(this.page, jobId);
    await jobDetailsPage.waitForLoaded();
    return jobDetailsPage;
  }
}
