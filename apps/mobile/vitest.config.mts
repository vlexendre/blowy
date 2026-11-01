import { defineConfig } from 'vitest/config';

// Logique pure uniquement (file hors ligne, réducteurs, sélecteurs, i18n) : pas de rendu RN.
export default defineConfig({ test: { include: ['src/**/*.test.ts'], environment: 'node' } });
