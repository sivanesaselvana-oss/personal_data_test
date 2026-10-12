import { test, expect } from '../src/fixtures/pageFixtures';

test.describe('FSM Login - positive scenarios', { tag: ['@login', '@smoke'] }, () => {
  test.beforeEach(async ({ loginPage, testData }) => {
    await loginPage.open(testData.login.pagePath);
  });

  test('TC_LOGIN_01: Login page loads with title, tagline and enabled SSO button', async ({ loginPage, testData, step }) => {
    await step('Verify login page title', async () => {
      expect(await loginPage.getTitle()).toBe(testData.login.pageTitle);
    });

    await step('Verify tagline and SSO button are displayed and enabled', async () => {
      expect(await loginPage.isWorkspaceTaglineVisible()).toBe(true);
      expect(await loginPage.isSsoLoginButtonVisible()).toBe(true);
      expect(await loginPage.isSsoLoginButtonEnabled()).toBe(true);
    });
  });

  test('TC_LOGIN_02: "Login with SSO" redirects to the OneBill SSO login form', async ({ loginPage, testData, step }) => {
    const ssoPage = await step('Click on the "Login with SSO" button', async () => {
      const page = await loginPage.clickLoginWithSso();
      expect(page.getUrl()).toMatch(new RegExp(testData.login.ssoUrlPattern));
      return page;
    });

    await step('Verify SSO form fields, Login button and Forgot Password link', async () => {
      expect(await ssoPage.isUsernameFieldVisible()).toBe(true);
      expect(await ssoPage.isPasswordFieldVisible()).toBe(true);
      expect(await ssoPage.isLoginButtonVisible()).toBe(true);
      expect(await ssoPage.isForgotPasswordLinkVisible()).toBe(true);
    });
  });

  test('TC_LOGIN_03: Password is masked and username retains the entered value', async ({ loginPage, credentials, step }) => {
    const ssoPage = await step('Click on the "Login with SSO" button', () => loginPage.clickLoginWithSso());

    await step('Enter username and password', async () => {
      await ssoPage.enterUsername(credentials.username);
      await ssoPage.enterPassword(credentials.password);
    });

    await step('Verify password is masked and username is retained', async () => {
      expect(await ssoPage.getPasswordFieldType()).toBe('password');
      expect(await ssoPage.getUsernameValue()).toBe(credentials.username);
    });
  });

  test('TC_LOGIN_04: Valid credentials log the user into the FSM application', async ({ loginPage, credentials, testData, step }) => {
    const ssoPage = await step('Click on the "Login with SSO" button', () => loginPage.clickLoginWithSso());

    const homePage = await step('Log in with valid credentials', () =>
      ssoPage.login(credentials.username, credentials.password),
    );

    await step('Verify user lands in the FSM application', async () => {
      expect(homePage.getUrl()).not.toMatch(new RegExp(testData.login.ssoUrlPattern));
      expect(homePage.getPathname()).not.toBe(testData.login.pagePath);
    });
  });

  test('TC_LOGIN_05: Valid credentials submitted with the Enter key log the user in', async ({ loginPage, credentials, testData, step }) => {
    const ssoPage = await step('Click on the "Login with SSO" button', () => loginPage.clickLoginWithSso());

    await step('Enter username and password', async () => {
      await ssoPage.enterUsername(credentials.username);
      await ssoPage.enterPassword(credentials.password);
    });

    const homePage = await step('Submit the form with the Enter key', () => ssoPage.submitWithEnterKey());

    await step('Verify user lands in the FSM application', async () => {
      expect(homePage.getPathname()).not.toBe(testData.login.pagePath);
    });
  });

  test('TC_LOGIN_06: Logged-in session persists after a page reload', async ({ loginPage, credentials, testData, step }) => {
    const ssoPage = await step('Click on the "Login with SSO" button', () => loginPage.clickLoginWithSso());

    const homePage = await step('Log in with valid credentials', () =>
      ssoPage.login(credentials.username, credentials.password),
    );

    await step('Reload the page and verify the session is retained', async () => {
      await homePage.reload();
      expect(homePage.getPathname()).not.toBe(testData.login.pagePath);
    });
  });
});
