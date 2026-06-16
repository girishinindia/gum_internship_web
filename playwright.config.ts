import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config (6.2). Staging by default via env:
 *   E2E_BASE_URL=https://staging.gum.example npx playwright test
 * Locally: API on :4000 (seeded), web on :3000.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // Mobile variants for catalog + classroom specs (different layout, not scaled)
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
});
