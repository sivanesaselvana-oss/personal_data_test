import { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async waitForVisible(locator: Locator, timeout = 15_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async isDisplayed(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  getUrl(): string {
    return this.page.url();
  }

  getPathname(): string {
    return new URL(this.page.url()).pathname;
  }

  /** Number of tabs open in this browser context. */
  getOpenTabCount(): number {
    return this.page.context().pages().length;
  }

  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }
}
