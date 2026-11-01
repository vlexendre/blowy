import { defineConfig } from 'vitest/config';

// Logique pure uniquement (file hors ligne, réducteurs, sélecteurs, i18n) : pas de rendu RN.
// Les tests *.integration.test.ts (API réelle) sont exclus : `pnpm test:api`.
export default defineConfig({ test: { include: ['src/**/*.test.ts'], exclude: ['src/**/*.integration.test.ts', '**/node_modules/**'], environment: 'node' } });
