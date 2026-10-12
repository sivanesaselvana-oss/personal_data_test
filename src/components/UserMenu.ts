import { BaseComponent } from './BaseComponent';
import { LoginPage } from '../pages/LoginPage';

/** Header user menu ("TM Admin" button) shown on every page after login. */
export class UserMenu extends BaseComponent {
  // Matches whichever user is logged in: the menu trigger is the header button with a menu popup.
  private readonly menuButton = this.page.locator('header button[aria-haspopup="menu"]');
  private readonly logoutItem = this.page.getByRole('menuitem', { name: 'Logout' });

  /** Logs out and returns the FSM login page it lands on. */
  async logout(): Promise<LoginPage> {
    await this.menuButton.click();
    await this.logoutItem.click();
    const loginPage = new LoginPage(this.page);
    await loginPage.waitForLoaded();
    return loginPage;
  }
}
