import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://www.saucedemo.com',
    // SauceDemo usa el atributo data-test en lugar de data-testid.
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1920, height: 1080 } },
    },
  ],
});
