/**
 * Lot quotidien de la voie Duo (spec-v5 §2.12, mode DUO des filtres §4.2) — pur et déterministe :
 * paires réciproquement compatibles (`duoLaneCompatible` : romance réciproque, ou amitié réciproque
 * respectant « qui je veux rencontrer » et les tranches d'âge), jamais une paire bloquée/signalée,
 * déjà liée ou déjà proposée récemment ; score de vision symétrique ; attribution gloutonne dans la
 * limite de la capacité de chacun. Ne fabrique jamais de candidat.
 */
import { pairKey } from '@blowy/domain';
import type { MatchProfile } from '@blowy/matching';
import { duoLaneCompatible, groupPairScore, groupScoringTuning, type SeeksProfile } from '@blowy/matching/groups';
import type { Tuning } from '@blowy/tuning';

export interface LaneCandidate {
  userId: string;
  petId: string;
  seeks: SeeksProfile & { age: number; groupAge: { min: number; max: number } };
  profile: MatchProfile;
  /** Nouvelles propositions possibles pour ce lot (≥ 0). */
  capacity: number;
}

export interface LanePair {
  a: LaneCandidate;
  b: LaneCandidate;
  score: number;
}

const ageOk = (s: LaneCandidate['seeks'], o: LaneCandidate['seeks']) => o.age >= s.groupAge.min && o.age <= s.groupAge.max;

/** Compatibilité voie Duo, âges compris dans les deux sens (aussi pour l'amitié). */
export const laneCompatible = (a: LaneCandidate, b: LaneCandidate): boolean => a.userId !== b.userId && ageOk(a.seeks, b.seeks) && ageOk(b.seeks, a.seeks) && duoLaneCompatible(a.seeks, b.seeks);

function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function selectLanePairs(candidates: readonly LaneCandidate[], excluded: ReadonlySet<string>, seed: string, t: Tuning): LanePair[] {
  const tStar = groupScoringTuning(t);
  const sorted = [...candidates].sort((x, y) => (x.userId < y.userId ? -1 : 1));
  const all: LanePair[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]!;
      const b = sorted[j]!;
      if (a.capacity <= 0 || b.capacity <= 0 || excluded.has(pairKey(a.userId, b.userId)) || !laneCompatible(a, b)) continue;
      all.push({ a, b, score: Math.max(0, Math.min(100, groupPairScore(a.profile, b.profile, tStar))) });
    }
  }
  all.sort((x, y) => y.score - x.score || fnv(`${seed}|${pairKey(x.a.userId, x.b.userId)}`) - fnv(`${seed}|${pairKey(y.a.userId, y.b.userId)}`));
  const left = new Map(sorted.map((c) => [c.userId, c.capacity]));
  const out: LanePair[] = [];
  for (const p of all) {
    if ((left.get(p.a.userId) ?? 0) <= 0 || (left.get(p.b.userId) ?? 0) <= 0) continue;
    left.set(p.a.userId, left.get(p.a.userId)! - 1);
    left.set(p.b.userId, left.get(p.b.userId)! - 1);
    out.push(p);
  }
  return out;
}
