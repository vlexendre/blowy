/**
 * Suite « parcours » (agent QA H-parcours) : histoires multi-utilisateurs de bout en bout contre
 * l'API réelle (graphe Nest complet, HTTP sur port éphémère, Socket.IO /v1/ws), base dédiée
 * `blowy_journeys` recréée à chaque exécution. Lancement : `pnpm --filter @blowy/api test:journeys`.
 */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(here, '../..'),
  test: {
    name: 'journeys',
    include: ['test/journeys/**/*.journey.ts'],
    environment: 'node',
    // Une seule base partagée et une horloge par fichier : exécution séquentielle, fichier par fichier.
    fileParallelism: false,
    // Chaque étape (`it`) est un pas de l'histoire : ordre strict, pas de mélange.
    sequence: { shuffle: false, concurrent: false },
    testTimeout: 60_000,
    hookTimeout: 180_000,
    globalSetup: ['test/journeys/support/global-setup.ts'],
  },
});
