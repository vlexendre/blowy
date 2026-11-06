/** Quartiers, lieux partenaires, liste d'attente, semaines (spec-v5 §1, §2.1–2.3). */

export const NEIGHBORHOOD_STATUSES = ['WAITLIST', 'LIVE', 'PAUSED', 'CLOSED'] as const;
export type NeighborhoodStatus = (typeof NEIGHBORHOOD_STATUSES)[number];

/** Transitions autorisées (action staff `ops` ; `WAITLIST → LIVE` sous le seuil = step-up admin). */
export const NEIGHBORHOOD_TRANSITIONS: Readonly<Record<NeighborhoodStatus, readonly NeighborhoodStatus[]>> = {
  WAITLIST: ['LIVE', 'CLOSED'],
  LIVE: ['PAUSED', 'CLOSED'],
  PAUSED: ['LIVE', 'CLOSED'],
  CLOSED: [],
};

export const VENUE_STATUSES = ['ACTIVE', 'PAUSED', 'ARCHIVED'] as const;
export type VenueStatus = (typeof VENUE_STATUSES)[number];

export const VENUE_ACCESSIBILITY_TAGS = ['STEP_FREE', 'QUIET', 'ACCESSIBLE_TOILETS', 'SEATING'] as const;
export type VenueAccessibilityTag = (typeof VENUE_ACCESSIBILITY_TAGS)[number];

/** Jour ISO (1 = lundi … 7 = dimanche) d'un créneau type. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Semaine ISO dans le fuseau du quartier, ex. `2026-W46`. Toutes les règles « une par semaine »
 * utilisent cette clé (le calcul depuis un instant + fuseau vit dans `@blowy/pet-engine` time).
 */
export type WeekKey = string;
export const WEEK_KEY_PATTERN = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;
export const isWeekKey = (s: string): s is WeekKey => WEEK_KEY_PATTERN.test(s);

/** Formate une semaine ISO (année ISO, numéro 1–53). */
export const formatWeekKey = (isoYear: number, isoWeek: number): WeekKey => `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;

/** Écran « pas de sortie » : deux usages distincts (§2.2). Aucune position individuelle. */
export const WAITLIST_SITUATIONS = ['NEIGHBORHOOD_NOT_LAUNCHED', 'NOT_PLACED_THIS_WEEK'] as const;
export type WaitlistSituation = (typeof WAITLIST_SITUATIONS)[number];
