import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 60000,
  expect: { timeout: 15000 }, reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.APP_ORIGIN || 'http://127.0.0.1:4173', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run preview', url: process.env.APP_ORIGIN || 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 15000 },
});
