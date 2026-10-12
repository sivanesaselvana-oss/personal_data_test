import { test } from '@playwright/test';

/**
 * Records a value produced during a test (e.g. a created REQ or JOB number) everywhere it is easy to find:
 * - as a step titled "<label>: <value>" in the HTML report's step tree (inside the current step),
 * - as a text attachment and a test annotation (top of the test in the HTML report),
 * - on the console.
 */
export async function reportValue(label: string, value: string, details?: string): Promise<void> {
  const text = details ? `${value} (${details})` : value;
  await test.step(`${label}: ${text}`, async () => {
    await test.info().attach(label, { body: value, contentType: 'text/plain' });
  });
  test.info().annotations.push({ type: label, description: text });
  console.log(`${label}: ${text}`);
}
