/**
 * S'occuper de son pet : trois besoins de 0 (à plat) à 100 (comblé) qui baissent avec le temps.
 * Un pet négligé boude — il ne meurt jamais — et ne fait plus de rencontres.
 * Moteur pur : le temps écoulé est passé en paramètre, rattrapé à la lecture.
 */
import type { PetEventKind } from './gauges';

export const NEED_KEYS = ['hunger', 'energy', 'mood'] as const;
export type NeedKey = (typeof NEED_KEYS)[number];
export type Needs = Record<NeedKey, number>;

export const START_NEEDS: Needs = { hunger: 80, energy: 80, mood: 80 };

/** Points perdus par heure. Un pet comblé met environ une journée et demie à tomber à plat. */
export const NEED_DECAY_PER_HOUR: Needs = { hunger: 3.5, energy: 2.5, mood: 2.5 };

const clamp = (v: number): number => Math.max(0, Math.min(100, Math.round(v)));

export function decayNeeds(needs: Needs, hours: number): Needs {
  if (hours <= 0) return needs;
  const out = { ...needs };
  for (const k of NEED_KEYS) out[k] = clamp(needs[k] - NEED_DECAY_PER_HOUR[k] * hours);
  return out;
}

export const CARE_ACTIONS = ['feed', 'play', 'nap', 'cuddle'] as const;
export type CareAction = (typeof CARE_ACTIONS)[number];

interface CareEffect {
  needs: Partial<Needs>;
  /** Événement de caractère associé (son effet sur les jauges est défini dans gauges.ts). */
  event: PetEventKind;
  /** Besoin que ce geste comble : au-dessus du seuil, le pet n'en veut plus. */
  fills: NeedKey;
}

export const CARE_EFFECTS: Record<CareAction, CareEffect> = {
  feed: { needs: { hunger: 40 }, event: 'care_feed', fills: 'hunger' },
  play: { needs: { mood: 30, energy: -10 }, event: 'care_play', fills: 'mood' },
  nap: { needs: { energy: 45 }, event: 'care_nap', fills: 'energy' },
  cuddle: { needs: { mood: 15 }, event: 'care_cuddle', fills: 'mood' },
};

/** Au-dessus de ce niveau, le pet refuse (« il n'a plus faim »). */
export const NEED_FULL = 92;
/** Jouer demande un minimum d'énergie. */
export const PLAY_MIN_ENERGY = 15;

export function canCare(needs: Needs, action: CareAction): boolean {
  if (action === 'play' && needs.energy < PLAY_MIN_ENERGY) return false;
  return needs[CARE_EFFECTS[action].fills] < NEED_FULL;
}

export function applyCare(needs: Needs, action: CareAction): Needs {
  const out = { ...needs };
  const effect = CARE_EFFECTS[action].needs;
  for (const k of NEED_KEYS) out[k] = clamp(needs[k] + (effect[k] ?? 0));
  return out;
}

/** Forme générale, de 0 à 100 : le besoin le plus bas pèse double. */
export function wellbeing(needs: Needs): number {
  const values = NEED_KEYS.map((k) => needs[k]);
  const low = Math.min(...values);
  return Math.round((values.reduce((a, b) => a + b, 0) + low) / (values.length + 1));
}

export const SHAPES = ['en_forme', 'bof', 'boude'] as const;
export type Shape = (typeof SHAPES)[number];
export const shapeOf = (needs: Needs): Shape => {
  const w = wellbeing(needs);
  return w >= 60 ? 'en_forme' : w >= 30 ? 'bof' : 'boude';
};

/** Conséquence sur les rencontres : un pet en forme croise plus de monde, un pet qui boude ne sort plus. */
export const ENCOUNTER_QUOTA: Record<Shape, number> = { en_forme: 20, bof: 6, boude: 0 };

/** Besoin le plus urgent, ou null si tout va bien. */
export function urgentNeed(needs: Needs): NeedKey | null {
  let worst: NeedKey | null = null;
  for (const k of NEED_KEYS) if (needs[k] < 40 && (worst === null || needs[k] < needs[worst])) worst = k;
  return worst;
}
