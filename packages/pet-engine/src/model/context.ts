import type { Tuning } from '@blowy/tuning';

export const ENGINE_VERSION = 'engine-2026.11.0';

/** Contexte explicite de chaque réduction : aucune horloge ni aléa implicite. */
export interface EngineContext {
  now: number;
  /** Graine serveur persistée (jamais choisie par le client). */
  seed: string;
  engineVersion: string;
  tuning: Tuning;
}
