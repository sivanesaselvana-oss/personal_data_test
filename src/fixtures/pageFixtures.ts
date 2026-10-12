import { test as base } from '@playwright/test';
import { env } from '../config/env';
import { CreateJobData, loadCreateJobData, loadServiceRequestData, loadTestData, ServiceRequestData, TestData } from '../testdata';
import { LoginPage } from '../pages/LoginPage';
import { JobsPage } from '../pages/JobsPage';
import { captureFailureScreenshot } from '../utils/screenshot';

type Credentials = { readonly username: string; readonly password: string };

/** Runs a named report step; on failure captures a screenshot, then re-throws. */
export type StepRunner = <T>(title: string, body: () => Promise<T>) => Promise<T>;

type Fixtures = {
  testData: TestData;
  serviceRequestData: ServiceRequestData;
  createJobData: CreateJobData;
  credentials: Credentials;
  step: StepRunner;
  appUrl: (pathname: string) => string;
  loginPage: LoginPage;
  loggedInJobsPage: JobsPage;
};

export const test = base.extend<Fixtures>({
  testData: async ({}, use) => {
    await use(loadTestData());
  },

  serviceRequestData: async ({}, use) => {
    await use(loadServiceRequestData());
  },

  createJobData: async ({}, use) => {
    await use(loadCreateJobData());
  },

  // Resolved lazily so a missing value fails inside the step that uses it
  // (and gets that step's screenshot) instead of before the test starts.
  credentials: async ({}, use) => {
    await use({
      get username() {
        return env.username;
      },
      get password() {
        return env.password;
      },
    });
  },

  step: async ({ page }, use, testInfo) => {
    let stepNumber = 0;
    await use(async (title, body) => {
      const label = `Step ${++stepNumber} - ${title}`;
      return base.step(label, async () => {
        try {
          return await body();
        } catch (error) {
          await captureFailureScreenshot(page, testInfo, label);
          throw error;
        }
      });
    });
  },

  appUrl: async ({}, use) => {
    await use((pathname) => env.urlFor(pathname));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // Precondition for tests that start behind login: logs in through SSO
  // with the .env credentials and yields the /jobs landing page.
  loggedInJobsPage: async ({ loginPage, testData, credentials }, use) => {
    await loginPage.open(testData.login.pagePath);
    const ssoPage = await loginPage.clickLoginWithSso();
    await use(await ssoPage.login(credentials.username, credentials.password));
  },
});

export { expect } from '@playwright/test';
