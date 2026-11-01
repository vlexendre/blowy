import { defineConfig, devices } from '@playwright/test';

/**
 * E2E admin : l'API (port 3998 par défaut) et l'app (3001) doivent tourner (voir docs/admin/e2e.md).
 * E2E_BASE_URL pour cibler un autre hôte.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3001', locale: 'fr-FR', trace: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
