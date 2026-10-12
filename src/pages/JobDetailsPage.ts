import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { UserMenu } from '../components/UserMenu';

/** Values shown on the job details page, as displayed. */
export type JobDetails = {
  jobNumber: string;
  status: string;
  scheduledOn: string;
  jobDescription: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerLocation: string;
  serviceRequest: string;
  serviceType: string;
  equipmentType: string;
  landmark: string;
};

/** Job details (/jobs/<JOB number>). Each field is rendered as <label>Name</label> followed by its value. */
export class JobDetailsPage extends BasePage {
  readonly userMenu = new UserMenu(this.page);
  private readonly serviceDetailsHeading = this.page.getByRole('heading', { name: 'Service Details', level: 3 });
  private readonly customerInfoCard = this.page.locator('#customer-info-card');

  constructor(page: Page, private readonly jobNumber: string) {
    super(page);
  }

  // A getter (not a field) because it depends on a constructor argument.
  private get heading() {
    return this.page.getByRole('heading', { name: this.jobNumber, level: 2 });
  }

  async waitForLoaded(): Promise<void> {
    await this.page.waitForURL(`**/jobs/${this.jobNumber}`, { timeout: 30_000 });
    await this.waitForVisible(this.heading, 60_000);
    await this.waitForVisible(this.serviceDetailsHeading, 60_000);
  }

  async getJobNumber(): Promise<string> {
    return (await this.heading.textContent())?.trim() ?? '';
  }

  /** Value element directly after the field's label, e.g. <label>Customer Name</label><p>salman</p>. */
  private async valueOf(label: string): Promise<string> {
    const value = this.page.locator(`label:text-is("${label}") + *`).first();
    return ((await value.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /** Phone is only shown in the Customer Info card, formatted like "(760) 181-6978". */
  private async customerPhone(): Promise<string> {
    const spans = await this.customerInfoCard.locator('span').allTextContents();
    return spans.map((text) => text.trim()).find((text) => /\d{3}.*\d{4}/.test(text)) ?? '';
  }

  async getJobDetails(): Promise<JobDetails> {
    return {
      jobNumber: await this.getJobNumber(),
      status: await this.valueOf('Status'),
      scheduledOn: await this.valueOf('Scheduled on'),
      jobDescription: await this.valueOf('Job Description'),
      customerName: await this.valueOf('Customer Name'),
      customerEmail: await this.valueOf('Customer Email'),
      customerPhone: await this.customerPhone(),
      customerLocation: await this.valueOf('Customer Location'),
      serviceRequest: await this.valueOf('Service Request'),
      serviceType: await this.valueOf('Service Type'),
      equipmentType: await this.valueOf('Equipment Type'),
      landmark: await this.valueOf('Landmark (Address)'),
    };
  }
}
