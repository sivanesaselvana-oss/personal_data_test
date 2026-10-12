import { BaseComponent } from './BaseComponent';
import { CreateServiceRequestPage } from '../pages/CreateServiceRequestPage';

/**
 * "Share Request Form" popup opened from Manage Requests > Share Form.
 * The popup has no dialog role, so it is scoped as the innermost container
 * holding both its heading and its "Send Email" button.
 */
export class ShareRequestFormPopup extends BaseComponent {
  private readonly heading = this.page.getByRole('heading', { name: 'Share Request Form', level: 2 });
  private readonly container = this.page
    .locator('div')
    .filter({ has: this.heading })
    .filter({ has: this.page.getByRole('button', { name: 'Send Email' }) })
    .last();
  private readonly shareLinkLabel = this.container.getByText('Share Link', { exact: true });
  private readonly copyButton = this.container.getByRole('button', { name: /^(Copy|Copied!)$/ });
  // The link is rendered as <span title="<url>"> next to the Copy button.
  private readonly shareLinkText = this.container.locator('span[title]').filter({ hasText: /^https?:\/\// });
  private readonly toast = this.page.getByRole('status');

  async waitForLoaded(): Promise<void> {
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async isDisplayed(): Promise<boolean> {
    return this.heading.isVisible();
  }

  async isShareLinkFieldVisible(): Promise<boolean> {
    return this.shareLinkLabel.isVisible();
  }

  async getShareLink(): Promise<string> {
    await this.shareLinkText.waitFor({ state: 'visible' });
    return (await this.shareLinkText.textContent())?.trim() ?? '';
  }

  async isCopyButtonVisible(): Promise<boolean> {
    return this.copyButton.isVisible();
  }

  async clickCopy(): Promise<void> {
    await this.copyButton.click();
  }

  async getCopyButtonLabel(): Promise<string> {
    return (await this.copyButton.textContent())?.trim() ?? '';
  }

  /** Text of the toast shown after copying, e.g. "Link copied to clipboard!". */
  async getToastMessage(): Promise<string> {
    await this.toast.first().waitFor({ state: 'visible', timeout: 5_000 });
    return (await this.toast.first().textContent())?.trim() ?? '';
  }

  /** Opens a new tab in the same browser session, pastes the URL into it and returns the form page. */
  async openLinkInNewTab(url: string): Promise<CreateServiceRequestPage> {
    const newTab = await this.page.context().newPage();
    await newTab.goto(url);
    const createRequestPage = new CreateServiceRequestPage(newTab);
    await createRequestPage.waitForLoaded();
    return createRequestPage;
  }

  /** Requires clipboard-read permission (granted for the chromium project). */
  async readClipboardText(): Promise<string> {
    return this.page.evaluate(() => navigator.clipboard.readText());
  }
}
