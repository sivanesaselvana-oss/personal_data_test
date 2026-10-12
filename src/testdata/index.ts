import uat from './uat.json';
import serviceRequest from './serviceRequest.json';
import createJob from './createJob.json';
import { TEST_ENV } from '../config/env';

export type TestData = typeof uat;
export type ServiceRequestData = typeof serviceRequest;
export type CreateJobData = typeof createJob;

const dataByEnv: Record<string, TestData> = { uat };

export function loadTestData(): TestData {
  const data = dataByEnv[TEST_ENV];
  if (!data) {
    throw new Error(`No test data file registered for environment "${TEST_ENV}"`);
  }
  return data;
}

/** Service request form data (src/testdata/serviceRequest.json). Dates are DD-MM-YYYY. */
export function loadServiceRequestData(): ServiceRequestData {
  return { ...serviceRequest };
}

/** Manual Create Job panel data (src/testdata/createJob.json). Dates are DD-MM-YYYY, times 24h HH:MM. */
export function loadCreateJobData(): CreateJobData {
  return { ...createJob };
}
