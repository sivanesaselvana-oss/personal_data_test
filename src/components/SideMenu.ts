import { BaseComponent } from './BaseComponent';
import { ManageRequestsPage } from '../pages/ManageRequestsPage';

/** Left-side navigation panel shown on every page after login. */
export class SideMenu extends BaseComponent {
  private readonly manageRequestsLink = this.page.getByRole('link', { name: 'Manage Requests', exact: true });

  async isManageRequestsMenuVisible(): Promise<boolean> {
    await this.manageRequestsLink.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);
    return this.manageRequestsLink.isVisible();
  }

  async clickManageRequests(): Promise<ManageRequestsPage> {
    await this.manageRequestsLink.click();
    const manageRequestsPage = new ManageRequestsPage(this.page);
    await manageRequestsPage.waitForLoaded();
    return manageRequestsPage;
  }
}
