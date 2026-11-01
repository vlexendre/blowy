/**
 * Filtres durs réciproques : liste de prédicats `CandidateFilter` composables. Chaque filtre
 * renvoie null (passe) ou un motif d'exclusion (diagnostic admin, jamais montré au candidat).
 * Les limites « mentir / juger / retard » ne créent aucun filtre (aucun critère mesurable défini).
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

export const FILTERS: readonly CandidateFilter[] = [
  (i) => (i.a.userId === i.b.userId ? 'SELF' : null),
  both((s, _o, i) => (!s.eligibility.adult || s.age < i.tuning.matching.minAge ? 'NOT_ADULT' : null)),
  both((s) => (!s.eligibility.verified ? 'NOT_VERIFIED' : null)),
  both((s) => (!s.eligibility.active ? 'INACTIVE_ACCOUNT' : null)),
  both((s, _o, i) => (s.eligibility.lastActiveDaysAgo >= i.tuning.matching.inactiveAfterDays ? 'STALE_ACTIVITY' : null)),
  both((s) => (s.eligibility.exclusive ? 'EXCLUSIVE' : null)),
  both((s) => (!s.eligibility.hasFreeSlot ? 'NO_SLOT' : null)),
  both((s, o) => (o.age < s.preferences.minAge || o.age > s.preferences.maxAge ? 'AGE_PREFERENCE' : null)),
  // Préférence de genre obligatoire non satisfaisable sans deviner (UNDISCLOSED) → exclusion.
  both((s, o) => (s.preferences.genders.length > 0 && !s.preferences.genders.includes(o.gender) ? 'GENDER_PREFERENCE' : null)),
  both((s, _o, i) => (i.facts.distanceKm > s.preferences.maxDistanceKm ? 'DISTANCE' : null)),
  both((s, o) => (INTENTION_COMPATIBLE[s.intention].includes(o.intention) ? null : 'INTENTION')),
  both((s, o, i) => (s.vision.limit === 'GHOSTER' && o.reliability < i.tuning.matching.ghosterLimitMinReliability ? 'LIMIT_GHOSTER' : null)),
  (i) => (i.facts.blockedOrReported ? 'BLOCKED_OR_REPORTED' : null),
  (i) => (i.facts.metBefore ? 'MET_BEFORE' : null),
  (i) => (i.facts.pendingProposals.some((n) => n >= i.tuning.matching.maxPendingProposals) ? 'PROPOSAL_QUOTA' : null),
];

export function firstExclusion(i: FilterInput, filters: readonly CandidateFilter[] = FILTERS): ExclusionReason | null {
  for (const f of filters) {
    const r = f(i);
    if (r) return r;
  }
  return null;
}

/** Composition : un filtre qui échoue si l'un des filtres donnés échoue. */
export const allOf = (...filters: CandidateFilter[]): CandidateFilter => (i) => firstExclusion(i, filters);
