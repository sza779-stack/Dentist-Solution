import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../dental-clinic-backend',
      url: 'http://localhost:399/health',
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev -- --host localhost',
      cwd: '.',
      url: 'http://localhost:5173',
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
