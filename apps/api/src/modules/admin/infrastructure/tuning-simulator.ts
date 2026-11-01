/**
 * Simulateur 60 jours. `@blowy/pet-engine` n'exporte pas `simulate` dans son API publique
 * (src/simulate exclu du build — demande à B dans handoff F). Strategy : l'adapter est
 * « indisponible » tant que l'export n'existe pas ; aucun résultat n'est fabriqué.
 */
import * as engine from '@blowy/pet-engine';
import type { TuningSimulator } from '../application/ports/admin.ports.js';

type SimulateFn = (o: { relationships: number; days: number; seed: string; tuning?: unknown }) => unknown;

export function createTuningSimulator(): TuningSimulator {
  const fn = (engine as unknown as { simulate?: SimulateFn }).simulate;
  if (typeof fn !== 'function') {
    return {
      available: false,
      reason: '@blowy/pet-engine n’exporte pas encore `simulate` (src/simulate hors build) — simulateur indisponible',
      run: async () => {
        throw new Error('simulateur indisponible');
      },
    };
  }
  return {
    available: true,
    reason: null,
    run: async (tuning, opts) => fn({ ...opts, tuning }) as Record<string, unknown>,
  };
}
