import { defineConfig } from 'vitest/config';

// Tests des fonctions pures uniquement (aucun rendu React Native ici).
export default defineConfig({ test: { include: ['src/**/*.test.ts'], environment: 'node' } });
