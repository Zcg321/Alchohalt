import { defineConfig, devices } from '@playwright/test';

/**
 * [R7-A3] Playwright config for persona walkthroughs.
 *
 * The personas spec is a screenshot generator more than an assertion
 * harness — it walks 4 fixture user states across every tab + the
 * crisis modal + the having-a-hard-time panel and saves a frame per
 * surface to playwright-screenshots/. CI uploads that directory as a
 * build artifact so reviewers can browse the deltas.
 *
 * Run locally:
 *   npm run dev   # in one terminal
 *   npx playwright test
 * Or one-shot via the auto-started webServer below:
 *   npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  /* [R20-5] Perf specs are opt-in. They run a real network throttle
   * which can be flaky under CI load. Run them locally via:
   *   npx playwright test e2e/perf/
   * The default run skips them. */
  testIgnore: '**/perf/**',
  // The walkthroughs lean on a fresh localStorage state; running them
  // in parallel inside one Playwright workers would race on the page
  // origin's storage. fullyParallel:false keeps tests serial inside the
  // file but a CI matrix can still split files.
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  outputDir: 'playwright-test-output',
  use: {
    baseURL: 'http://localhost:5180',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5180 --host 127.0.0.1',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
