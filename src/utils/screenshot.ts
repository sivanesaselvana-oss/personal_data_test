import { Page, TestInfo } from '@playwright/test';

function toFileName(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

/**
 * Saves a full-page screenshot of every open tab into the test's output folder
 * and attaches them to the HTML report (a step may fail in a tab it opened).
 * Never throws — a failed capture must not hide the original test failure.
 */
export async function captureFailureScreenshot(page: Page, testInfo: TestInfo, label: string): Promise<void> {
  const tabs = page.context().pages().filter((tab) => !tab.isClosed());
  for (const [index, tab] of tabs.entries()) {
    const suffix = tabs.length > 1 ? ` (tab ${index + 1})` : '';
    // Truncate the step label before adding the tab suffix so tabs never share a file name.
    const filePath = testInfo.outputPath('step-failures', `${toFileName(label)}${suffix ? `_${toFileName(suffix)}` : ""}.png`);
    try {
      await tab.screenshot({ path: filePath, fullPage: true });
      await testInfo.attach(`Failed step screenshot - ${label}${suffix}`, { path: filePath, contentType: 'image/png' });
    } catch (error) {
      console.warn(`Could not capture screenshot for "${label}${suffix}": ${(error as Error).message}`);
    }
  }
}
