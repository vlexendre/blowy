/**
 * Sélection d'un lot : jusqu'à 3 propositions = 2 meilleures priorités + 1 découverte
 * compatible (score ≥ seuil, hors des deux premières, choisie de façon déterministe seedée).
 * Ne fabrique jamais de candidat : si le vivier est vide, le lot est vide (état d'attente).
 */
import type { Tuning } from '@blowy/tuning';
import type { ExclusionReason, MatchProfile, PairFacts, ScoreBreakdown } from '../types.js';
import { firstExclusion } from '../filters/index.js';
import { scoreVision } from '../score/index.js';
import { exposureAdjustment, type ExposureStats } from './exposure.js';

export interface CandidateInput {
  profile: MatchProfile;
  facts: PairFacts;
  exposure: ExposureStats;
}

export interface RankedCandidate {
  userId: string;
  petId: string;
  breakdown: ScoreBreakdown;
  /** Score affiché (inchangé par l'équité). */
  visionScore: number;
  priority: number;
  slot: 'STRONG' | 'DISCOVERY';
}

export interface BatchResult {
  proposals: RankedCandidate[];
  /** Diagnostics d'exclusion (rôle autorisé uniquement). */
  excluded: Array<{ userId: string; reason: ExclusionReason }>;
  /** Vrai nombre de candidats admissibles (jamais gonflé). */
  eligibleCount: number;
  state: 'OK' | 'EMPTY_ZONE';
}

/** Hachage FNV-1a 32 bits pour un départage déterministe. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function selectBatch(viewer: MatchProfile, candidates: readonly CandidateInput[], seed: string, t: Tuning): BatchResult {
  const excluded: BatchResult['excluded'] = [];
  const ranked: Array<Omit<RankedCandidate, 'slot'>> = [];
  for (const c of candidates) {
    const reason = firstExclusion({ a: viewer, b: c.profile, facts: c.facts, tuning: t });
    if (reason) {
      excluded.push({ userId: c.profile.userId, reason });
      continue;
    }
    const breakdown = scoreVision(viewer, c.profile, c.facts.distanceKm, t);
    ranked.push({ userId: c.profile.userId, petId: c.profile.petId, breakdown, visionScore: breakdown.score, priority: breakdown.score + exposureAdjustment(c.exposure, t) });
  }
  const tie = (id: string): number => fnv1a(`${seed}|${viewer.userId}|${id}`);
  ranked.sort((x, y) => y.priority - x.priority || tie(x.userId) - tie(y.userId));
  const b = t.matching.batch;
  const strong = ranked.slice(0, b.strong).map((r) => ({ ...r, slot: 'STRONG' as const }));
  const pool = ranked.slice(b.strong).filter((r) => r.visionScore >= b.discoveryMinScore);
  const discovery = [...pool].sort((x, y) => tie(`d:${x.userId}`) - tie(`d:${y.userId}`)).slice(0, b.discovery).map((r) => ({ ...r, slot: 'DISCOVERY' as const }));
  // Vivier insuffisant pour une découverte : compléter par les priorités suivantes, sans inventer.
  const filler = discovery.length < b.discovery ? ranked.slice(b.strong, b.strong + (b.discovery - discovery.length)).filter((r) => !discovery.some((d) => d.userId === r.userId)).map((r) => ({ ...r, slot: 'STRONG' as const })) : [];
  const proposals = [...strong, ...discovery, ...filler].slice(0, b.size);
  return { proposals, excluded, eligibleCount: ranked.length, state: ranked.length === 0 ? 'EMPTY_ZONE' : 'OK' };
}
