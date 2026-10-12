import { BasePage } from './BasePage';
import { SsoLoginPage } from './SsoLoginPage';

/** FSM landing login page (/login) — entry point that hands off to OneBill SSO. */
export class LoginPage extends BasePage {
  private readonly ssoLoginButton = this.page.getByRole('button', { name: 'Login with SSO' });
  private readonly workspaceTagline = this.page.getByText('FSM workspace starts here');

  async open(path: string): Promise<this> {
    await this.page.goto(path);
    await this.waitForVisible(this.ssoLoginButton);
    return this;
  }

  /** For arriving here without open(), e.g. after logout. */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForURL('**/login', { timeout: 30_000 });
    await this.waitForVisible(this.ssoLoginButton, 30_000);
  }

  async isSsoLoginButtonVisible(): Promise<boolean> {
    return this.isDisplayed(this.ssoLoginButton);
  }

  async isSsoLoginButtonEnabled(): Promise<boolean> {
    return this.ssoLoginButton.isEnabled();
  }

  async isWorkspaceTaglineVisible(): Promise<boolean> {
    return this.isDisplayed(this.workspaceTagline);
  }

  async clickLoginWithSso(): Promise<SsoLoginPage> {
    await this.ssoLoginButton.click();
    const ssoPage = new SsoLoginPage(this.page);
    await ssoPage.waitForLoaded();
    return ssoPage;
  }
}
