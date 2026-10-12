import dotenv from 'dotenv';
import path from 'path';

// Select the env file with TEST_ENV (defaults to uat) -> loads .env.<TEST_ENV>
export const TEST_ENV = process.env.TEST_ENV ?? 'uat';
dotenv.config({ path: path.resolve(__dirname, '../../', `.env.${TEST_ENV}`), quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable "${name}" in .env.${TEST_ENV}`);
  }
  return value;
}

export const env = {
  baseUrl: process.env.FSM_BASE_URL ?? 'https://fsmuat-web.onebillsoftware.net',
  /** Absolute app URL for a path, e.g. urlFor('/jobs') -> https://<fsm-host>/jobs */
  urlFor(pathname: string): string {
    return new URL(pathname, this.baseUrl).href;
  },
  get username(): string {
    return required('FSM_USERNAME');
  },
  get password(): string {
    return required('FSM_PASSWORD');
  },
};
