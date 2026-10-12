import { BasePage } from './BasePage';
import { ManageRequestsPage } from './ManageRequestsPage';
import { ServiceRequestData } from '../testdata';
import { displayDateToIso } from '../utils/date';
import { DateTimePicker } from '../components/DateTimePicker';

/**
 * Public customer form (/create-request-form?tenant_id=..&account_id=..) opened from the share link.
 * Labels are not linked to their inputs and ids are auto-generated, so fields are located by placeholder.
 */
export class CreateServiceRequestPage extends BasePage {
  private readonly heading = this.page.getByRole('heading', { name: 'Create Service Request', level: 1 });
  private readonly customerNameInput = this.page.getByPlaceholder('Full name');
  private readonly userNameInput = this.page.getByPlaceholder('User name');
  private readonly emailInput = this.page.getByPlaceholder('email@example.com');
  private readonly phoneInput = this.page.getByPlaceholder('(000) 000-0000');
  private readonly serviceAddressInput = this.page.getByPlaceholder('Street address');
  private readonly validateAddressButton = this.page.getByRole('button', { name: 'Validate Address' });
  private readonly validatedAddressButton = this.page.getByRole('button', { name: 'Validated' });
  private readonly serviceTypeDropdown = this.page.locator('input[id$="-service-type"]');
  private readonly serviceRequestInput = this.page.getByPlaceholder('Enter service request');
  private readonly equipmentTypeDropdown = this.page.getByPlaceholder('Equipment Type');
  private readonly serviceDescriptionInput = this.page.getByPlaceholder('Enter service description...');
  // UAT has switched this field between MM/DD/YYYY and DD-MM-YYYY; the id suffix is stable across both.
  private readonly preferredDateInput = this.page.locator('input[id$="-date"]');
  // The time picker trigger has no accessible name of its own; it sits beside the clock icon.
  private readonly preferredTimeButton = this.page.locator('div:has(> img[alt="Clock"]) > button');
  private readonly dateTimePicker = new DateTimePicker(this.page);
  private readonly submitButton = this.page.getByRole('button', { name: 'Submit', exact: true });

  async waitForLoaded(): Promise<void> {
    await this.page.waitForURL('**/create-request-form**', { timeout: 30_000 });
    await this.waitForVisible(this.heading, 30_000);
  }

  async isHeadingVisible(): Promise<boolean> {
    return this.isDisplayed(this.heading);
  }

  async getHeadingText(): Promise<string> {
    return (await this.heading.textContent())?.trim() ?? '';
  }

  async enterCustomerName(value: string): Promise<void> {
    await this.customerNameInput.fill(value);
  }

  async enterUserName(value: string): Promise<void> {
    await this.userNameInput.fill(value);
  }

  async enterEmail(value: string): Promise<void> {
    await this.emailInput.fill(value);
  }

  async enterPhoneNumber(value: string): Promise<void> {
    await this.phoneInput.fill(value);
  }

  async enterServiceAddress(value: string): Promise<void> {
    await this.serviceAddressInput.fill(value);
  }

  async selectServiceType(value: string): Promise<void> {
    await this.serviceTypeDropdown.click();
    await this.page.getByRole('button', { name: value, exact: true }).click();
  }

  async enterServiceRequest(value: string): Promise<void> {
    await this.serviceRequestInput.fill(value);
  }

  async selectEquipmentType(value: string): Promise<void> {
    await this.equipmentTypeDropdown.click();
    await this.page.getByRole('button', { name: value, exact: true }).click();
  }

  async enterServiceDescription(value: string): Promise<void> {
    await this.serviceDescriptionInput.fill(value);
  }

  /** @param ddMmYyyy date in test-data format DD-MM-YYYY */
  async selectPreferredDate(ddMmYyyy: string): Promise<void> {
    await this.dateTimePicker.selectDate(this.preferredDateInput, ddMmYyyy);
  }

  /** @param hhMm time in 24h "HH:MM" */
  async selectPreferredTime(hhMm: string): Promise<void> {
    await this.dateTimePicker.selectTime(this.preferredTimeButton, hhMm);
  }

  /** Fills every mandatory (*) field plus User Name. Optional Landmark is left empty. */
  async fillFormFields(data: ServiceRequestData): Promise<void> {
    await this.enterCustomerName(data.customerName);
    await this.enterUserName(data.userName);
    await this.enterEmail(data.emailId);
    await this.enterPhoneNumber(data.phoneNumber);
    await this.enterServiceAddress(data.serviceAddress);
    await this.selectServiceType(data.serviceType);
    await this.enterServiceRequest(data.serviceRequest);
    await this.selectEquipmentType(data.equipmentType);
    await this.enterServiceDescription(data.serviceDescription);
    await this.selectPreferredDate(data.preferredDate);
    await this.selectPreferredTime(data.preferredTime);
  }

  async getFormFieldValues(): Promise<Record<string, string>> {
    return {
      customerName: await this.customerNameInput.inputValue(),
      userName: await this.userNameInput.inputValue(),
      emailId: await this.emailInput.inputValue(),
      phoneNumber: await this.phoneInput.inputValue(),
      serviceAddress: await this.serviceAddressInput.inputValue(),
      serviceType: await this.serviceTypeDropdown.inputValue(),
      serviceRequest: await this.serviceRequestInput.inputValue(),
      equipmentType: await this.equipmentTypeDropdown.inputValue(),
      serviceDescription: await this.serviceDescriptionInput.inputValue(),
      preferredDate: await this.getPreferredDateIso(),
      preferredTime: (await this.preferredTimeButton.textContent())?.trim() ?? '',
    };
  }

  /** Selected Preferred Date as ISO YYYY-MM-DD, whichever display format the field uses. */
  async getPreferredDateIso(): Promise<string> {
    const value = await this.preferredDateInput.inputValue();
    const format = (await this.preferredDateInput.getAttribute('placeholder')) ?? '';
    return displayDateToIso(value, format);
  }

  async clickValidateAddress(): Promise<void> {
    await this.validateAddressButton.click();
  }

  async isAddressValidated(): Promise<boolean> {
    await this.validatedAddressButton.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);
    return this.validatedAddressButton.isVisible();
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /** After a successful submit the form is replaced by a confirmation card. */
  async isSubmissionConfirmationVisible(title: string): Promise<boolean> {
    const confirmationTitle = this.page.getByText(title, { exact: true });
    await confirmationTitle.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined);
    return confirmationTitle.isVisible();
  }

  async isConfirmationMessageVisible(message: string): Promise<boolean> {
    return this.page.getByText(message, { exact: true }).isVisible();
  }

  async isFormDisplayed(): Promise<boolean> {
    return this.submitButton.isVisible();
  }

  /** Navigates this tab to Manage Requests by URL; works because the tab shares the admin's login session. */
  async navigateToManageRequests(path: string): Promise<ManageRequestsPage> {
    return new ManageRequestsPage(this.page).open(path);
  }
}
