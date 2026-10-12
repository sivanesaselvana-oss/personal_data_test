import { BasePage } from './BasePage';
import { JobsPage } from './JobsPage';

/**
 * OneBill identity-provider login form (1b_oauth_login.jsp).
 * Its labels are not associated with the inputs, so getByLabel cannot be
 * used — the stable element ids are used instead.
 */
export class SsoLoginPage extends BasePage {
  private readonly usernameInput = this.page.locator('#j_username');
  private readonly passwordInput = this.page.locator('#j_password');
  private readonly loginButton = this.page.getByRole('button', { name: 'Login', exact: true });
  private readonly forgotPasswordLink = this.page.getByRole('link', { name: 'Forgot Password?' });

  async waitForLoaded(): Promise<void> {
    await this.waitForVisible(this.usernameInput);
  }

  async isUsernameFieldVisible(): Promise<boolean> {
    return this.isDisplayed(this.usernameInput);
  }

  async isPasswordFieldVisible(): Promise<boolean> {
    return this.isDisplayed(this.passwordInput);
  }

  async isLoginButtonVisible(): Promise<boolean> {
    return this.isDisplayed(this.loginButton);
  }

  async isForgotPasswordLinkVisible(): Promise<boolean> {
    return this.isDisplayed(this.forgotPasswordLink);
  }

  async getPasswordFieldType(): Promise<string | null> {
    return this.passwordInput.getAttribute('type');
  }

  async getUsernameValue(): Promise<string> {
    return this.usernameInput.inputValue();
  }

  async enterUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async clickLogin(): Promise<JobsPage> {
    await this.loginButton.click();
    return this.toJobsPage();
  }

  async submitWithEnterKey(): Promise<JobsPage> {
    await this.passwordInput.press('Enter');
    return this.toJobsPage();
  }

  async login(username: string, password: string): Promise<JobsPage> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    return this.clickLogin();
  }

  private async toJobsPage(): Promise<JobsPage> {
    const jobsPage = new JobsPage(this.page);
    await jobsPage.waitForLoaded();
    return jobsPage;
  }
}
