import { defineConfig } from 'vitest/config';

// Intégration réelle contre l'API locale (lancée séparément) : `pnpm test:api`.
export default defineConfig({ test: { include: ['src/**/*.integration.test.ts'], environment: 'node', fileParallelism: false, testTimeout: 20_000 } });
