/**
 * S'occuper de son minimoa. Le besoin principal est la **sociabilité** (V7) : elle monte quand la personne
 * sort, voit du monde, salue, écrit, s'écrit chaque jour avec un lien ou tient une habitude tournée vers les autres,
 * et descend seule. Trois petits besoins (faim, énergie, humeur) se comblent avec les quatre gestes.
 * Tous vont de 0 (à plat) à 100 (comblé). Un minimoa négligé boude — il ne meurt jamais. Les soins jouent sur son
 * humeur et son caractère, jamais sur l'accès aux gens : le plafond de présentations du jour ne dépend que de la
 * sociabilité (sortir, écrire, répondre, saluer la font monter), avec au moins une présentation par jour ; le nombre
 * réel dépend des personnes compatibles autour (seuil de vision, `MATCH_RADIUS_KM`) et des amis d'amis.
 * Moteur pur : le temps écoulé est passé en paramètre, rattrapé à la lecture.
 */
import type { PetEventKind } from './gauges';

/** Les trois petits besoins, comblés par les gestes (`CARE_ACTIONS`). La sociabilité n'en fait pas partie. */
export const NEED_KEYS = ['hunger', 'energy', 'mood'] as const;
export type NeedKey = (typeof NEED_KEYS)[number];
/** Besoins du minimoa : la sociabilité (principale) et les trois petits besoins. */
export type Needs = Record<NeedKey, number> & { sociability: number };

export const START_NEEDS: Needs = { sociability: 80, hunger: 80, energy: 80, mood: 80 };

/** Points perdus par heure. Un minimoa comblé met environ une journée et demie à tomber à plat. */
export const NEED_DECAY_PER_HOUR: Record<NeedKey, number> = { hunger: 3.5, energy: 2.5, mood: 2.5 };
/**
 * Sociabilité perdue par heure : 36 points par jour, donc une sortie par jour la maintient.
 * Multiple de 0,5 : l'usure enregistrée par pas de 2 h reste un nombre entier de points.
 */
export const SOCIABILITY_DECAY_PER_HOUR = 1.5;

const clamp = (v: number): number => Math.max(0, Math.min(100, Math.round(v)));

export function decayNeeds(needs: Needs, hours: number): Needs {
  if (hours <= 0) return needs;
  const out = { ...needs };
  for (const k of NEED_KEYS) out[k] = clamp(needs[k] - NEED_DECAY_PER_HOUR[k] * hours);
  out.sociability = clamp(needs.sociability - SOCIABILITY_DECAY_PER_HOUR * hours);
  return out;
}

/** Ajoute (ou retire) des points de sociabilité, bornés de 0 à 100. */
export function raiseSociability(needs: Needs, points: number): Needs {
  if (points === 0) return needs;
  return { ...needs, sociability: clamp(needs.sociability + points) };
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

export function canCare(needs: Record<NeedKey, number>, action: CareAction): boolean {
  if (action === 'play' && needs.energy < PLAY_MIN_ENERGY) return false;
  return needs[CARE_EFFECTS[action].fills] < NEED_FULL;
}

export function applyCare<N extends Record<NeedKey, number>>(needs: N, action: CareAction): N {
  const out: N = { ...needs };
  const effect = CARE_EFFECTS[action].needs;
  for (const k of NEED_KEYS) out[k] = clamp(needs[k] + (effect[k] ?? 0));
  return out;
}

/** État des trois petits besoins, de 0 à 100 : le plus bas pèse double. */
export function careLevel(needs: Record<NeedKey, number>): number {
  const values = NEED_KEYS.map((k) => needs[k]);
  const low = Math.min(...values);
  return Math.round((values.reduce((a, b) => a + b, 0) + low) / (values.length + 1));
}

/** Poids de la sociabilité dans la forme (V7 : 60 % sociabilité, 40 % les trois petits besoins). */
export const SOCIABILITY_WEIGHT = 0.6;

/** Forme générale, de 0 à 100 : 60 % sociabilité + 40 % des trois petits besoins. */
export function wellbeing(needs: Needs): number {
  return Math.round(SOCIABILITY_WEIGHT * needs.sociability + (1 - SOCIABILITY_WEIGHT) * careLevel(needs));
}

export const SHAPES = ['en_forme', 'bof', 'boude'] as const;
export type Shape = (typeof SHAPES)[number];
export const shapeOf = (needs: Needs): Shape => {
  const w = wellbeing(needs);
  return w >= 60 ? 'en_forme' : w >= 30 ? 'bof' : 'boude';
};

/**
 * Présentations du jour, selon la sociabilité seule (sortir, voir du monde, écrire, tenir une habitude avec d'autres).
 * Les petits besoins (faim, énergie, humeur) n'y jouent pas : un minimoa mal nourri ou qui boude présente quand même.
 */
export const ENCOUNTER_QUOTA = { high: 20, mid: 8, low: 3 } as const;
/** Plancher : au moins une présentation par jour quand quelqu'un de compatible existe, quoi qu'il arrive au minimoa. */
export const MIN_DAILY_INTRODUCTIONS = 1;
/** Au-dessus de ce niveau de sociabilité, le quota est plein. */
export const SOCIABILITY_HIGH = 60;

/** Nombre de personnes que le minimoa peut présenter aujourd'hui (avant le bonus de Minimoa+). */
export function encounterQuota(needs: Pick<Needs, 'sociability'>): number {
  const s = needs.sociability;
  const q = s >= SOCIABILITY_HIGH ? ENCOUNTER_QUOTA.high : s >= SOCIABILITY_LOW ? ENCOUNTER_QUOTA.mid : ENCOUNTER_QUOTA.low;
  return Math.max(MIN_DAILY_INTRODUCTIONS, q);
}

/** Sous ce seuil, le minimoa « a besoin de sortir » (notification, une par jour au plus). */
export const SOCIABILITY_LOW = 35;
export const needsOut = (needs: Pick<Needs, 'sociability'>): boolean => needs.sociability < SOCIABILITY_LOW;

/** Petit besoin le plus urgent, ou null si tout va bien (la sociabilité se lit avec `needsOut`). */
export function urgentNeed(needs: Record<NeedKey, number>): NeedKey | null {
  let worst: NeedKey | null = null;
  for (const k of NEED_KEYS) if (needs[k] < 40 && (worst === null || needs[k] < needs[worst])) worst = k;
  return worst;
}
