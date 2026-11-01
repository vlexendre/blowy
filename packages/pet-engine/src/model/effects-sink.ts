import type { EngineEffect } from './effects.js';

/** Collecteur d'effets (passé aux handlers ; aucun effet de bord hors de cette liste). */
export type EffectSink = EngineEffect[];
