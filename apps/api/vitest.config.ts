import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'test/unit/**/*.test.ts'],
          exclude: ['**/*.int.test.ts', 'test/integration/**', '**/node_modules/**'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts', 'src/**/*.int.test.ts'],
          environment: 'node',
          // Base partagée : exécution séquentielle (reset contrôlé entre fichiers).
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 120_000,
          globalSetup: ['test/integration/global-setup.ts'],
        },
      },
    ],
  },
});
