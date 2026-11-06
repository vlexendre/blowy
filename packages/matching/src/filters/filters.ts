/**
 * Filtres durs réciproques NOMMÉS (spec-v5 §4.2) : `FILTER_BY_REASON` associe chaque motif à son
 * prédicat ; les listes `FILTERS` (V4 / voie Duo) et `PAIR_FILTERS` (composition de groupe) en sont
 * des sélections ordonnées, sans duplication. Chaque filtre renvoie null (passe) ou son motif
 * (diagnostic staff, jamais montré au candidat). Les limites « mentir / juger / retard » ne créent
 * aucun filtre (aucun critère mesurable défini).
 */
import type { Intention } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import type { ExclusionReason, MatchProfile, PairFacts } from '../types.js';

export interface FilterInput {
  a: MatchProfile;
  b: MatchProfile;
  facts: PairFacts;
  tuning: Tuning;
}

export type CandidateFilter = (i: FilterInput) => ExclusionReason | null;

/** Applique un prédicat unilatéral dans les deux sens (réciprocité écrite une fois). */
const both = (check: (self: MatchProfile, other: MatchProfile, i: FilterInput) => ExclusionReason | null): CandidateFilter => (i) => check(i.a, i.b, i) ?? check(i.b, i.a, i);

/** Matrice d'intentions admissibles (§5.7) : FRIENDS_* commencent en Ami ; pas de « Plus seulement ». */
const INTENTION_COMPATIBLE: Record<Intention, readonly Intention[]> = {
  FRIENDS_ONE: ['FRIENDS_ONE', 'OPEN_TO_MORE', 'LET_IT_HAPPEN'],
  FRIENDS_GROUP: ['FRIENDS_GROUP', 'LET_IT_HAPPEN'],
  OPEN_TO_MORE: ['FRIENDS_ONE', 'OPEN_TO_MORE', 'LET_IT_HAPPEN'],
  LET_IT_HAPPEN: ['FRIENDS_ONE', 'FRIENDS_GROUP', 'OPEN_TO_MORE', 'LET_IT_HAPPEN'],
};

/**
 * Limite GHOSTER : V5 sur le ratio de présences N/M (‰) dès que M ≥ `ghosterLimitMinTotal` ;
 * sans présences connues (V4), sur la fiabilité 0–100.
 */
function failsGhosterLimit(other: MatchProfile, t: Tuning): boolean {
  const att = other.attendance;
  if (att) {
    const total = att.attended + att.noShows;
    return total >= t.matching.ghosterLimitMinTotal && att.attended * 1000 < t.matching.ghosterLimitMinAttendancePermille * total;
  }
  return other.reliability < t.matching.ghosterLimitMinReliability;
}

export const FILTER_BY_REASON: Readonly<Record<ExclusionReason, CandidateFilter>> = {
  SELF: (i) => (i.a.userId === i.b.userId ? 'SELF' : null),
  NOT_ADULT: both((s, _o, i) => (!s.eligibility.adult || s.age < i.tuning.matching.minAge ? 'NOT_ADULT' : null)),
  NOT_VERIFIED: both((s) => (!s.eligibility.verified ? 'NOT_VERIFIED' : null)),
  INACTIVE_ACCOUNT: both((s) => (!s.eligibility.active ? 'INACTIVE_ACCOUNT' : null)),
  STALE_ACTIVITY: both((s, _o, i) => (s.eligibility.lastActiveDaysAgo >= i.tuning.matching.inactiveAfterDays ? 'STALE_ACTIVITY' : null)),
  EXCLUSIVE: both((s) => (s.eligibility.exclusive ? 'EXCLUSIVE' : null)),
  NO_SLOT: both((s) => (!s.eligibility.hasFreeSlot ? 'NO_SLOT' : null)),
  AGE_PREFERENCE: both((s, o) => (o.age < s.preferences.minAge || o.age > s.preferences.maxAge ? 'AGE_PREFERENCE' : null)),
  // Préférence de genre obligatoire non satisfaisable sans deviner (UNDISCLOSED) → exclusion.
  GENDER_PREFERENCE: both((s, o) => (s.preferences.genders.length > 0 && !s.preferences.genders.includes(o.gender) ? 'GENDER_PREFERENCE' : null)),
  // V5 : même règle sur « qui je veux rencontrer » (UNDISCLOSED ne satisfait pas une liste restrictive).
  MEET_GENDER: both((s, o) => (s.meetGenders && s.meetGenders.length > 0 && !s.meetGenders.includes(o.gender) ? 'MEET_GENDER' : null)),
  DISTANCE: both((s, _o, i) => (i.facts.distanceKm > s.preferences.maxDistanceKm ? 'DISTANCE' : null)),
  INTENTION: both((s, o) => (INTENTION_COMPATIBLE[s.intention].includes(o.intention) ? null : 'INTENTION')),
  LIMIT_GHOSTER: both((s, o, i) => (s.vision.limit === 'GHOSTER' && failsGhosterLimit(o, i.tuning) ? 'LIMIT_GHOSTER' : null)),
  BLOCKED_OR_REPORTED: (i) => (i.facts.blockedOrReported ? 'BLOCKED_OR_REPORTED' : null),
  MET_BEFORE: (i) => (i.facts.metBefore ? 'MET_BEFORE' : null),
  KNOWN_CONTACT: (i) => (i.facts.knownContact ? 'KNOWN_CONTACT' : null),
  PROPOSAL_QUOTA: (i) => (i.facts.pendingProposals.some((n) => n >= i.tuning.matching.maxPendingProposals) ? 'PROPOSAL_QUOTA' : null),
};

/** Sélection ordonnée de filtres nommés. */
export const selectFilters = (reasons: readonly ExclusionReason[]): readonly CandidateFilter[] => reasons.map((r) => FILTER_BY_REASON[r]);

/** Filtres V4 / voie Duo (ordre historique conservé : mêmes motifs de diagnostic). */
export const FILTER_REASONS: readonly ExclusionReason[] = [
  'SELF',
  'NOT_ADULT',
  'NOT_VERIFIED',
  'INACTIVE_ACCOUNT',
  'STALE_ACTIVITY',
  'EXCLUSIVE',
  'NO_SLOT',
  'AGE_PREFERENCE',
  'GENDER_PREFERENCE',
  'DISTANCE',
  'INTENTION',
  'LIMIT_GHOSTER',
  'BLOCKED_OR_REPORTED',
  'MET_BEFORE',
  'PROPOSAL_QUOTA',
];
export const FILTERS: readonly CandidateFilter[] = selectFilters(FILTER_REASONS);

/**
 * Filtres de paire de la composition de groupe (§4.2). Pas de distance (tout le monde est dans le
 * quartier), pas d'intention V4, pas de quota de propositions ; `AGE_PREFERENCE` lit `groupAge`.
 */
export const PAIR_FILTER_REASONS: readonly ExclusionReason[] = [
  'SELF',
  'NOT_ADULT',
  'NOT_VERIFIED',
  'INACTIVE_ACCOUNT',
  'AGE_PREFERENCE',
  'MEET_GENDER',
  'BLOCKED_OR_REPORTED',
  'KNOWN_CONTACT',
  'MET_BEFORE',
  'LIMIT_GHOSTER',
];
export const PAIR_FILTERS: readonly CandidateFilter[] = selectFilters(PAIR_FILTER_REASONS);

export function firstExclusion(i: FilterInput, filters: readonly CandidateFilter[] = FILTERS): ExclusionReason | null {
  for (const f of filters) {
    const r = f(i);
    if (r) return r;
  }
  return null;
}

/** Composition : un filtre qui échoue si l'un des filtres donnés échoue. */
export const allOf = (...filters: CandidateFilter[]): CandidateFilter => (i) => firstExclusion(i, filters);
