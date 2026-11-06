import { defineConfig } from 'vitest/config';

// Tests des fonctions pures et résolveurs de style (aucun rendu React Native ici).
export default defineConfig({ test: { include: ['src/**/*.test.ts'], environment: 'node' } });
