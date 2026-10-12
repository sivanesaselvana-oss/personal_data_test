import { BaseComponent } from './BaseComponent';
import { DateTimePicker } from './DateTimePicker';
import { CreateJobData } from '../testdata';

/**
 * "Create Job" side panel opened by a request row's "+" (Create Job) action in Manage Requests.
 * It has no dialog role, so it is scoped as the innermost container holding its heading and Create button.
 * Customer fields are read-only copies of the request; the job fields below are editable.
 */
export class CreateJobPanel extends BaseComponent {
  private readonly heading = this.page.getByRole('heading', { name: 'Create Job', level: 2 });
  private readonly container = this.page
    .locator('div')
    .filter({ has: this.heading })
    .filter({ has: this.page.getByRole('button', { name: 'Create', exact: true }) })
    .last();
  private readonly requestSummary = this.container.getByText(/^Request No\./);
  // Read-only and pre-filled when the request already has a user name; an empty "Enter user name" input otherwise.
  private readonly userNameInput = this.container.locator('div:has(> label:text-matches("^User Name")) input');
  private readonly scheduleDateInput = this.container.getByPlaceholder('Select date');
  // The start-time trigger has no accessible name; it sits beside the clock icon.
  private readonly startTimeButton = this.container.locator('div:has(> img[alt="Clock"]) > button');
  private readonly jobDescriptionInput = this.container.getByPlaceholder('Enter job description...');
  private readonly activityNameInput = this.container.getByPlaceholder('Enter activity name');
  private readonly estimatedTimeInput = this.container.getByPlaceholder('e.g. 30');
  private readonly troubleshootNotesInput = this.container.getByPlaceholder('Enter your troubleshooting notes here...');
  private readonly createButton = this.container.getByRole('button', { name: 'Create', exact: true });
  private readonly dateTimePicker = new DateTimePicker(this.page);
  private readonly toast = this.page.getByRole('status');

  async waitForLoaded(): Promise<void> {
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async isDisplayed(): Promise<boolean> {
    return this.heading.isVisible();
  }

  /** e.g. "Request No. REQ-869439 • Preferred Date & Time 12-10-2026 10:00 AM" */
  async getRequestSummary(): Promise<string> {
    return ((await this.requestSummary.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /** Fills User Name only when the field is editable and empty (it is pre-filled from the request otherwise). */
  async enterUserName(value: string): Promise<void> {
    const readOnly = (await this.userNameInput.getAttribute('readonly')) !== null;
    if (!readOnly && (await this.userNameInput.inputValue()) === '') {
      await this.userNameInput.fill(value);
    }
  }

  /** @param ddMmYyyy DD-MM-YYYY, @param hhMm 24h HH:MM */
  async updateSchedule(ddMmYyyy: string, hhMm: string): Promise<void> {
    await this.dateTimePicker.selectDate(this.scheduleDateInput, ddMmYyyy);
    await this.dateTimePicker.selectTime(this.startTimeButton, hhMm);
  }

  async enterJobDescription(value: string): Promise<void> {
    await this.jobDescriptionInput.fill(value);
  }

  async enterActivity(name: string, estimatedMinutes: string): Promise<void> {
    await this.activityNameInput.fill(name);
    await this.estimatedTimeInput.fill(estimatedMinutes);
  }

  async enterTroubleshootNotes(value: string): Promise<void> {
    await this.troubleshootNotesInput.fill(value);
  }

  async getValues(): Promise<Record<string, string>> {
    return {
      userName: await this.userNameInput.inputValue(),
      scheduleDate: await this.scheduleDateInput.inputValue(),
      startTime: ((await this.startTimeButton.textContent()) ?? '').trim(),
      jobDescription: await this.jobDescriptionInput.inputValue(),
      activityName: await this.activityNameInput.inputValue(),
      estimatedTimeMins: await this.estimatedTimeInput.inputValue(),
      troubleshootNotes: await this.troubleshootNotesInput.inputValue(),
    };
  }

  /** Fills the job fields from test data. User Name is mandatory here and is not copied from the request. */
  async fillJobDetails(data: CreateJobData, userName: string): Promise<void> {
    await this.enterUserName(userName);
    await this.updateSchedule(data.scheduleDate, data.scheduleTime);
    await this.enterJobDescription(data.jobDescription);
    await this.enterActivity(data.activityName, data.estimatedTimeMins);
    await this.enterTroubleshootNotes(data.troubleshootNotes);
  }

  /** Clicks Create and waits for the panel to close. Returns the toast message shown, if any. */
  async clickCreate(): Promise<string> {
    await this.createButton.click();
    await this.heading.waitFor({ state: 'hidden', timeout: 30_000 });
    const toast = this.toast.first();
    await toast.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
    return (await toast.isVisible()) ? ((await toast.textContent()) ?? '').trim() : '';
  }
}
