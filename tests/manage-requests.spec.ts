import { test, expect } from '../src/fixtures/pageFixtures';
import type { StepRunner } from '../src/fixtures/pageFixtures';
import type { LoginPage } from '../src/pages/LoginPage';
import type { ServiceRequestData, TestData } from '../src/testdata';
import { reportValue } from '../src/utils/report';
import { appDateTimeToIso, ddMmYyyyToIso, to24HourTime } from '../src/utils/date';

type FlowContext = {
  loginPage: LoginPage;
  credentials: { readonly username: string; readonly password: string };
  testData: TestData;
  serviceRequestData: ServiceRequestData;
  appUrl: (pathname: string) => string;
  browserName: string;
  step: StepRunner;
};

/**
 * Steps shared by both tests: SSO login → Manage Requests → Share Form → copy link → submit the public
 * form in a new tab → back to Manage Requests → find the newly created request. Each action is its own
 * report step. Returns what the tests continue from, plus the job numbers that existed before submitting.
 */
async function submitServiceRequestViaShareLink({ loginPage, credentials, testData, serviceRequestData, appUrl, browserName, step }: FlowContext) {
  const shareForm = testData.manageRequests.shareForm;

  await step('Navigate to the FSM login page', async () => {
    await loginPage.open(testData.login.pagePath);
    expect(await loginPage.isSsoLoginButtonVisible()).toBe(true);
  });

  const ssoPage = await step('Click on the "Login with SSO" button', async () => {
    const page = await loginPage.clickLoginWithSso();
    expect(page.getUrl()).toMatch(new RegExp(testData.login.ssoUrlPattern));
    return page;
  });

  await step('Enter username and password from .env.uat', async () => {
    await ssoPage.enterUsername(credentials.username);
    await ssoPage.enterPassword(credentials.password);
    expect(await ssoPage.getUsernameValue()).toBe(credentials.username);
  });

  const jobsPage = await step('Click on the Login button', () => ssoPage.clickLogin());

  const existingJobNumbers = await step(`Verify the user is redirected to ${appUrl(testData.jobs.pagePath)} and note the existing jobs`, async () => {
    expect(jobsPage.getUrl()).toBe(appUrl(testData.jobs.pagePath));
    return jobsPage.getJobNumbers();
  });

  await step('Verify the "Manage Requests" menu is displayed in the left-side panel', async () => {
    expect(await jobsPage.sideMenu.isManageRequestsMenuVisible()).toBe(true);
  });

  const manageRequestsPage = await step('Click the "Manage Requests" menu', () => jobsPage.sideMenu.clickManageRequests());

  const existingReqNumbers = await step('Verify the Manage Requests page is opened and note the existing requests', async () => {
    expect(manageRequestsPage.getUrl()).toBe(appUrl(testData.manageRequests.pagePath));
    expect(await manageRequestsPage.isHeadingVisible()).toBe(true);
    return manageRequestsPage.getRequestNumbers();
  });

  await step('Verify the "Share Form" button is displayed on the Manage Requests page', async () => {
    expect(await manageRequestsPage.isShareFormButtonVisible()).toBe(true);
  });

  const sharePopup = await step('Click the "Share Form" button', () => manageRequestsPage.clickShareForm());

  await step('Verify the "Share Request Form" popup is displayed', async () => {
    expect(await sharePopup.isDisplayed()).toBe(true);
  });

  const shareLink = await step('Verify a share link is present in the "Share Link" field', async () => {
    expect(await sharePopup.isShareLinkFieldVisible()).toBe(true);
    const link = await sharePopup.getShareLink();
    expect(link).toContain(appUrl(shareForm.shareLinkPath));
    return link;
  });

  await step('Click the "Copy" link in the "Share Link" field', async () => {
    expect(await sharePopup.isCopyButtonVisible()).toBe(true);
    await sharePopup.clickCopy();
  });

  const copiedUrl = await step('Verify the share link is copied', async () => {
    expect(await sharePopup.getToastMessage()).toBe(shareForm.copiedToastMessage);
    expect(await sharePopup.getCopyButtonLabel()).toBe(shareForm.copiedButtonLabel);
    // Clipboard read permission can only be granted in Chromium; elsewhere use the displayed link.
    if (browserName !== 'chromium') {
      return shareLink;
    }
    const clipboardText = await sharePopup.readClipboardText();
    expect(clipboardText).toBe(shareLink);
    return clipboardText;
  });

  const createRequestPage = await step('Open a new tab and paste the copied URL', async () => {
    const page = await sharePopup.openLinkInNewTab(copiedUrl);
    expect(page.getOpenTabCount()).toBe(2);
    expect(page.getUrl()).toBe(copiedUrl);
    return page;
  });

  await step('Verify the heading "Create Service Request" is displayed', async () => {
    expect(await createRequestPage.isHeadingVisible()).toBe(true);
    expect(await createRequestPage.getHeadingText()).toBe(testData.createServiceRequest.heading);
  });

  await step('Fill in all mandatory fields and User Name from the service request test data', async () => {
    await createRequestPage.fillFormFields(serviceRequestData);
    expect(await createRequestPage.getFormFieldValues()).toEqual({
      customerName: serviceRequestData.customerName,
      userName: serviceRequestData.userName,
      emailId: serviceRequestData.emailId,
      phoneNumber: serviceRequestData.phoneNumber,
      serviceAddress: serviceRequestData.serviceAddress,
      serviceType: serviceRequestData.serviceType,
      serviceRequest: serviceRequestData.serviceRequest,
      equipmentType: serviceRequestData.equipmentType,
      serviceDescription: serviceRequestData.serviceDescription,
      preferredDate: ddMmYyyyToIso(serviceRequestData.preferredDate),
      preferredTime: serviceRequestData.preferredTime.replace(/^0(\d)/, '$1'),
    });
  });

  await step('Click the "Validate Address" button', async () => {
    await createRequestPage.clickValidateAddress();
    expect(await createRequestPage.isAddressValidated()).toBe(true);
  });

  await step('Click the "Submit" button', async () => {
    await createRequestPage.clickSubmit();
  });

  await step('Verify the service request is submitted successfully', async () => {
    const confirmation = testData.createServiceRequest.submitConfirmation;
    expect(await createRequestPage.isSubmissionConfirmationVisible(confirmation.title)).toBe(true);
    expect(await createRequestPage.isConfirmationMessageVisible(confirmation.message)).toBe(true);
    expect(await createRequestPage.isFormDisplayed()).toBe(false);
  });

  const requestListPage = await step(`Navigate to ${appUrl(testData.manageRequests.pagePath)}`, async () => {
    const page = await createRequestPage.navigateToManageRequests(testData.manageRequests.pagePath);
    expect(page.getUrl()).toBe(appUrl(testData.manageRequests.pagePath));
    expect(await page.isHeadingVisible()).toBe(true);
    return page;
  });

  const reqNumber = await step('Verify the new request (REQ number) is created, refreshing the page until it appears', async () => {
    const newRequest = testData.manageRequests.newRequest;
    const { row, refreshes } = await requestListPage.waitForNewRequest(
      {
        customer: serviceRequestData.customerName,
        description: serviceRequestData.serviceDescription,
        location: serviceRequestData.serviceAddress,
        preferredDate: serviceRequestData.preferredDate,
      },
      existingReqNumbers,
      { maxRefreshes: newRequest.maxRefreshes, intervalMs: newRequest.refreshIntervalMs },
    );

    expect(row, `New request for "${serviceRequestData.customerName}" is listed (checked ${refreshes + 1} time(s))`).not.toBeNull();
    expect(row!.reqNumber).toMatch(new RegExp(newRequest.reqNumberPattern));
    // Auto-assignment can schedule a request within seconds, so it may already be past "New".
    expect(newRequest.allowedInitialStatuses).toContain(row!.status);
    await reportValue('Created Request ID', row!.reqNumber, `found after ${refreshes} refresh(es)`);
    return row!.reqNumber;
  });

  return { requestListPage, reqNumber, existingJobNumbers };
}

test.describe('FSM Manage Requests - share form and submit service request', { tag: ['@manageRequests', '@smoke'] }, () => {
  // Both tests submit a request with the same serviceRequest.json data and identify "their" request as the
  // new one matching that data, so they must not run at the same time. 'default' runs them one after the
  // other in one worker without skipping the second when the first fails (unlike 'serial').
  test.describe.configure({ mode: 'default' });

  // Skipped on request; change test.skip back to test to run it again.
  test.skip('TC_MANAGE_REQ_01: Admin shares the request form link and a customer submits a service request through it', async ({ loginPage, credentials, testData, serviceRequestData, appUrl, browserName, step }) => {
    // Long end-to-end flow on a slow UAT, plus waiting (with refreshes) for the new request and job.
    test.setTimeout(420_000);

    const { requestListPage, reqNumber } = await submitServiceRequestViaShareLink({
      loginPage, credentials, testData, serviceRequestData, appUrl, browserName, step,
    });

    const requestDetailsPage = await step('Click the newly created Request ID', async () => {
      const page = await requestListPage.clickRequestNumber(reqNumber);
      expect(await page.isRequestNumberDisplayed()).toBe(true);
      return page;
    });

    const jobId = await step('Verify a Job ID is created in the Job List section and print it', async () => {
      const jobCreation = testData.manageRequests.jobCreation;
      const { jobId: createdJobId, refreshes } = await requestDetailsPage.waitForJobId({
        maxRefreshes: jobCreation.maxRefreshes,
        intervalMs: jobCreation.refreshIntervalMs,
      });
      expect(
        createdJobId,
        `Job ID is created for ${reqNumber} (checked ${refreshes + 1} time(s); a missing job usually means no technician was free for ${serviceRequestData.preferredDate} ${serviceRequestData.preferredTime})`,
      ).not.toBeNull();
      expect(createdJobId).toMatch(new RegExp(jobCreation.jobIdPattern));
      await reportValue('Created Job ID', createdJobId!, `for ${reqNumber}, found after ${refreshes} re-open(s)`);
      return createdJobId!;
    });

    const jobListPage = await step(`Navigate to ${appUrl(testData.jobs.pagePath)}`, async () => {
      const page = await requestDetailsPage.navigateToJobs(testData.jobs.pagePath);
      expect(page.getUrl()).toBe(appUrl(testData.jobs.pagePath));
      return page;
    });

    await step(`Search for the created Job ID (${jobId}) on the Jobs page`, async () => {
      await jobListPage.searchJob(jobId);
      const jobRow = await jobListPage.findJob(jobId);
      expect(jobRow, `${jobId} is listed on the Jobs page`).not.toBeNull();
      expect(jobRow!.description).toBe(serviceRequestData.serviceDescription);
      expect(jobRow!.location).toBe(serviceRequestData.serviceAddress);
    });

    const jobDetailsPage = await step('Click the Job ID', () => jobListPage.clickJobNumber(jobId));

    await step('Verify the job details match the service request test data', async () => {
      const details = await jobDetailsPage.getJobDetails();
      expect({
        jobNumber: details.jobNumber,
        customerName: details.customerName,
        emailId: details.customerEmail,
        phoneNumber: details.customerPhone.replace(/\D/g, ''),
        serviceAddress: details.customerLocation,
        serviceType: details.serviceType,
        serviceRequest: details.serviceRequest,
        equipmentType: details.equipmentType,
        serviceDescription: details.jobDescription,
        preferredDateTime: appDateTimeToIso(details.scheduledOn),
      }).toEqual({
        jobNumber: jobId,
        customerName: serviceRequestData.customerName,
        emailId: serviceRequestData.emailId,
        phoneNumber: serviceRequestData.phoneNumber,
        serviceAddress: serviceRequestData.serviceAddress,
        serviceType: serviceRequestData.serviceType,
        serviceRequest: serviceRequestData.serviceRequest,
        equipmentType: serviceRequestData.equipmentType,
        serviceDescription: serviceRequestData.serviceDescription,
        preferredDateTime: `${ddMmYyyyToIso(serviceRequestData.preferredDate)} ${to24HourTime(serviceRequestData.preferredTime)}`,
      });
    });
  });

  test('TC_MANAGE_REQ_02: Admin creates a job manually from a submitted service request and logs out', async ({ loginPage, credentials, testData, serviceRequestData, createJobData, appUrl, browserName, step }) => {
    test.setTimeout(480_000);

    const { requestListPage, reqNumber, existingJobNumbers } = await submitServiceRequestViaShareLink({
      loginPage, credentials, testData, serviceRequestData, appUrl, browserName, step,
    });

    const createJobPanel = await step(`In the Actions column, click the "+" (Create Job) icon of the new request ${reqNumber}`, async () => {
      const firstReqNumber = (await requestListPage.getRequestNumbers())[0];
      // The new request is normally the first row; another UAT user's newer request can push it down.
      await reportValue('First row Request ID', firstReqNumber, firstReqNumber === reqNumber ? 'the new request' : `new request ${reqNumber} is not first`);
      const panel = await requestListPage.clickCreateJob(reqNumber);
      expect(await panel.isDisplayed()).toBe(true);
      expect(await panel.getRequestSummary()).toContain(reqNumber);
      return panel;
    });

    await step('Check the User Name (fill it if empty) and update the schedule date and time', async () => {
      await createJobPanel.enterUserName(serviceRequestData.userName);
      await createJobPanel.updateSchedule(createJobData.scheduleDate, createJobData.scheduleTime);
      const values = await createJobPanel.getValues();
      expect(values.userName).toBe(serviceRequestData.userName);
      expect(ddMmYyyyToIso(values.scheduleDate)).toBe(ddMmYyyyToIso(createJobData.scheduleDate));
      expect(to24HourTime(values.startTime)).toBe(to24HourTime(createJobData.scheduleTime));
    });

    await step('Enter the job description in the "Job Description" field', async () => {
      await createJobPanel.enterJobDescription(createJobData.jobDescription);
      expect((await createJobPanel.getValues()).jobDescription).toBe(createJobData.jobDescription);
    });

    await step('Enter the activity name and estimated time', async () => {
      await createJobPanel.enterActivity(createJobData.activityName, createJobData.estimatedTimeMins);
      const values = await createJobPanel.getValues();
      expect(values.activityName).toBe(createJobData.activityName);
      expect(values.estimatedTimeMins).toBe(createJobData.estimatedTimeMins);
    });

    await step('Enter the troubleshooting details in the "Troubleshoot Notes" field', async () => {
      await createJobPanel.enterTroubleshootNotes(createJobData.troubleshootNotes);
      expect((await createJobPanel.getValues()).troubleshootNotes).toBe(createJobData.troubleshootNotes);
    });

    await step('Click the "Create" button to create the job', async () => {
      const message = await createJobPanel.clickCreate();
      if (message) {
        await reportValue('Create Job message', message);
      }
      expect(await createJobPanel.isDisplayed()).toBe(false);
    });

    const jobListPage = await step(`Navigate to ${appUrl(testData.jobs.pagePath)}`, async () => {
      const page = await requestListPage.navigateToJobs(testData.jobs.pagePath);
      expect(page.getUrl()).toBe(appUrl(testData.jobs.pagePath));
      return page;
    });

    const jobId = await step('Verify the latest job has been created and its Job ID is displayed', async () => {
      const jobCreation = testData.manageRequests.jobCreation;
      const { row, refreshes } = await jobListPage.waitForNewJob(
        { description: createJobData.jobDescription, location: serviceRequestData.serviceAddress },
        existingJobNumbers,
        { maxRefreshes: jobCreation.maxRefreshes, intervalMs: jobCreation.refreshIntervalMs },
      );
      expect(row, `New job "${createJobData.jobDescription}" is listed (checked ${refreshes + 1} time(s))`).not.toBeNull();
      expect(row!.jobNumber).toMatch(new RegExp(jobCreation.jobIdPattern));
      expect(appDateTimeToIso(row!.scheduledDate)).toBe(
        `${ddMmYyyyToIso(createJobData.scheduleDate)} ${to24HourTime(createJobData.scheduleTime)}`,
      );
      await reportValue('Created Job ID', row!.jobNumber, `for ${reqNumber}, found after ${refreshes} refresh(es)`);
      return row!.jobNumber;
    });

    const jobDetailsPage = await step('Click the newly created Job ID', () => jobListPage.clickJobNumber(jobId));

    await step('Verify the opened job\'s ID matches the newly created Job ID', async () => {
      expect(await jobDetailsPage.getJobNumber()).toBe(jobId);
      expect(jobDetailsPage.getUrl()).toBe(appUrl(`${testData.jobs.pagePath}/${jobId}`));
    });

    await step('Log out of the application', async () => {
      const page = await jobDetailsPage.userMenu.logout();
      expect(page.getUrl()).toBe(appUrl(testData.login.pagePath));
      expect(await page.isSsoLoginButtonVisible()).toBe(true);
    });
  });
});
