---
name: fsm-onebill-automation
description: Conventions for the FSM OneBill Playwright + TypeScript UI automation framework in this repo (Page Object Model, step fixture with failure screenshots, env-driven credentials and test data). Use whenever adding or changing page objects, spec files, fixtures, test data or env config in this project, or when asked to write a test for any FSM screen — even if the user just says "write a test" or "automate this flow".
---

# FSM OneBill automation framework

Playwright + TypeScript, strict Page Object Model. Application under test:
FSM web app (`FSM_BASE_URL`, UAT = https://fsmuat-web.onebillsoftware.net),
which authenticates through OneBill SSO.

## Layout

```
src/
  config/env.ts            loads .env.<TEST_ENV> (default uat); exposes env.baseUrl/username/password
  pages/                   one class per screen, all extend BasePage
    BasePage.ts            shared helpers: waitForVisible, isDisplayed, getTitle, getUrl, getPathname, reload
    LoginPage.ts           FSM /login — "Login with SSO" button
    SsoLoginPage.ts        OneBill IdP form (#j_username, #j_password, Login)
    JobsPage.ts            /jobs — landing page after login; exposes sideMenu; searchJob ("Search jobs..." box filters the list) / getJobRows / findJob / clickJobNumber (the inner span of the job-number cell is the clickable element)
    ManageRequestsPage.ts  /request-forms — heading "Manage Requests"; exposes sideMenu. getRequestRows() reads the table (rows load ~5s after the page); waitForNewRequest(match, existingReqNumbers, {maxRefreshes, intervalMs}) finds a request created during the test, reloading the page while it is missing
    CreateServiceRequestPage.ts  public /create-request-form (no login). Fields by placeholder; dropdown options and time slots are buttons ("9:00", no leading zero); calendar day cells are gridcells named YYYY-MM-DD; success replaces the form with a "Request Submitted Successfully" card
    RequestDetailsPage.ts  /request-forms/<REQ> (open by clicking the REQ number; loading the URL directly does not render). Job List shows JOB-xxxx buttons or "No job created yet"; waitForJobId re-opens the request until a job appears
    JobDetailsPage.ts      /jobs/<JOB>; every field is <label>Name</label> + value (locator "label:text-is(Name) + *"); phone only in #customer-info-card
  components/              reusable UI parts shared by pages (not BasePage subclasses)
    BaseComponent.ts       base for all components — sets this.page via super() so field-initialiser locators are safe (never use a `private readonly page` constructor parameter in a component)
    DateTimePicker.ts      shared calendar (gridcells YYYY-MM-DD, month nav) + time-slot picker used by the public form and Create Job panel
    CreateJobPanel.ts      Manage Requests row "+" (Create Job) panel; User Name is pre-filled read-only when the request has one, an empty mandatory input otherwise
    UserMenu.ts            header user menu → Logout (lands on /login)
    SideMenu.ts            left nav panel; navigating methods return the target page object
    ShareRequestFormPopup.ts  Manage Requests > Share Form popup (no dialog role; scoped by its heading)
  fixtures/pageFixtures.ts test, expect, and fixtures: testData, credentials, step, appUrl, loggedInJobsPage, <page objects>
  testdata/<env>.json      static per-environment data, registered in testdata/index.ts
  testdata/serviceRequest.json   service request form data (dates DD-MM-YYYY), injected via the serviceRequestData fixture
  testdata/createJob.json      manual job data (schedule DD-MM-YYYY + HH:MM, description, activity, est. minutes, troubleshoot notes) via the createJobData fixture
  testdata/ServiceRequestTestData.xlsx  50 unique form rows; regenerate with node scripts/generate-service-request-data.js
  utils/date.ts            DD-MM-YYYY -> ISO / MM/DD/YYYY converters
  utils/screenshot.ts      captureFailureScreenshot(page, testInfo, label)
tests/*.spec.ts            specs — import { test, expect } from '../src/fixtures/pageFixtures'
.env.<env>                 secrets, git-ignored; .env.example is the committed template
```

## Login flow (know this before automating anything behind login)

1. `LoginPage.open('/login')` — the page has **no** credential fields, only "Login with SSO".
2. `clickLoginWithSso()` → returns `SsoLoginPage` on `sandbox.onebillsoftware.com/1b_oauth_login.jsp`.
3. `login(username, password)` (or `enterUsername` / `enterPassword` / `clickLogin` / `submitWithEnterKey`) → returns `JobsPage` once redirected back to the FSM host.
4. After login the app always lands on `/jobs`. Navigate from there through `jobsPage.sideMenu` (e.g. `clickManageRequests()` → `ManageRequestsPage`). The side menu items are links named exactly as shown ("Manage Requests" is plural).
5. Tests that start behind login (not testing login itself) take the `loggedInJobsPage` fixture instead of repeating the SSO steps.

The IdP labels are not linked to their inputs, so `getByLabel` does not work there;
the element ids are the stable locators.

## Rules

**Page objects**
- Extend `BasePage`. Locators are `private readonly` fields; prefer `getByRole` / `getByTestId` / `getByText`, fall back to ids only when the DOM gives nothing accessible (document why in a comment).
- Expose intent-level methods (`clickLoginWithSso`, `isLoginButtonVisible`), never locators.
- No `expect` in page objects. Return booleans/strings/values for the spec to assert.
- A method that navigates returns the next page object and waits for it to load.
- Popups opened by a button are components returned by that button's click method (e.g. `clickShareForm()` → `ShareRequestFormPopup`). Many FSM popups have no `dialog` role — scope them by their heading.
- New tabs: open them through a page-object method using `this.page.context().newPage()` (see `ShareRequestFormPopup.openLinkInNewTab`) and return the new tab's page object.
- Clipboard checks: the chromium project grants clipboard permissions; guard clipboard assertions with `browserName === 'chromium'`.
- Shared UI (side menu, header, modals) goes in `src/components/` and is exposed on the page as a public `readonly` component property.
- Register every new page object as a fixture in `pageFixtures.ts` when specs open it directly.

**Specs**
- No `page.*` calls and no literal URLs, credentials or expected texts — use fixtures (`testData`, `credentials`) and page-object methods.
- Assert full URLs with the `appUrl` fixture plus a path from test data: `expect(jobsPage.getUrl()).toBe(appUrl(testData.jobs.pagePath))`.
- Custom `expect(value, message)` messages become the check's title in the HTML report **even when it passes** — phrase them as what is being checked ("JOB-x is listed on the Jobs page"), never as the failure ("JOB-x is not listed").
- Surface values a test creates (REQ/JOB numbers) with `reportValue(label, value)` from src/utils/report.ts so they show in the step tree, attachments and console.
- Wrap every user-visible action/verification in the `step` fixture:
  ```ts
  const ssoPage = await step('Click on the "Login with SSO" button', () => loginPage.clickLoginWithSso());
  await step('Verify user lands in the FSM application', async () => {
    expect(jobsPage.getPathname()).not.toBe(testData.login.pagePath);
  });
  ```
  `step` numbers steps (`Step 1 - ...`), shows them in the report, and on failure saves a full-page
  screenshot to `test-results/<test>/step-failures/Step_N_-_<title>.png`, attaches it to the HTML
  report, then re-throws. Do not catch errors around `step` — that would hide the failure.
- Tests must be independent and parallel-safe: setup in `beforeEach`, no shared mutable state, no `describe.serial` without a written reason.
- Name tests `TC_<MODULE>_<NN>: <behaviour>` and tag with `{ tag: ['@<module>', '@smoke'?] }`.

**Data and secrets**
- Credentials/URLs only in `.env.<env>` (keys: `FSM_BASE_URL`, `FSM_USERNAME`, `FSM_PASSWORD`). Never use a bare `USERNAME` key — Windows already defines it.
- New env keys: add a getter in `src/config/env.ts` and a blank entry in `.env.example`.
- Static expected values go in `src/testdata/<env>.json`; a new environment needs its JSON registered in `src/testdata/index.ts`.
- Never commit `.env*` (except `.env.example`), `test-results/`, `playwright-report/`, `node_modules/`.

## Screenshots and reports

- Per failed step: `step` fixture (above) — captures **every open tab** (`..._tab_N.png`) because a step can fail in a tab it opened.
- Per failed test: `playwright.config.ts` has `screenshot: 'only-on-failure'`, `video` and `trace: 'retain-on-failure'`.
- Read results: `npm run report` (HTML report with step tree + attachments),
  `npx playwright show-trace test-results/<test>/trace.zip` for replay.

## UAT quirks

- The tenant date format has been switched between DD-MM-YYYY and MM/DD/YYYY during testing — in both the form and the list. Never compare dates as display strings; normalise with `appDateToIso` / `displayDateToIso` (src/utils/date.ts) and locate the date input by its `-date` id, not its placeholder.
- New requests can be auto-scheduled within seconds, so a just-created request may be "New" or "Scheduled" (`manageRequests.newRequest.allowedInitialStatuses`).
- The side menu expands on hover and covers the first table column. Move the mouse away (`page.mouse.move(1000, 500)`) before clicking REQ/JOB numbers.
- Jobs are auto-created only when a technician is free for the preferred date/time. Re-using a slot that already has a job means "No job created yet" — give each run a free slot.
- Customer names repeat across runs. Identify a request you created by REQ numbers captured *before* submitting plus customer/description/location/date — never by name alone.

## Side effects

`TC_MANAGE_REQ_01` submits a real service request to UAT on every run. Exclude it from exploratory runs with `--grep-invert TC_MANAGE_REQ_01`. Its preferred date must be today or later — update `serviceRequest.json` when it passes.

## Commands

```
npm test                                  # all tests, all browsers
npm run test:chromium                     # chromium only
npm run test:smoke                        # @smoke on chromium
npm run test:headed                       # watch the browser
npx playwright test tests/manage-requests.spec.ts --project=chromium
$env:TEST_ENV='qa'; npx playwright test   # PowerShell: run against .env.qa + testdata/qa.json
npm run report
```
Suspected flaky test → `--repeat-each=5` before calling it a product bug.

## Adding a test for a new screen — checklist

1. Inspect the real page (codegen or an aria snapshot) to pick accessible locators.
2. Create `src/pages/<Screen>Page.ts` extending `BasePage`; make the navigating method on the previous page return it.
3. Add expected static values to `src/testdata/<env>.json`.
4. Write `tests/<module>.spec.ts` using `step` for each action, assertions only in the spec.
5. Run it alone and with the full suite on chromium; confirm a forced failure produces the step screenshot.
