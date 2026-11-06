/**
 * Backfill d'une place libérée avant verrouillage (spec-v5 §4.6) : parmi les demandes UNPLACED
 * admissibles sur le créneau (instant, quartier acceptable, activité), l'unité de taille 1 maximisant J(G ∪ u) sous les mêmes contraintes
 * (membres = places invitées + confirmées). Départage : priorité (§4.4.2), puis FNV-1a seedé.
 */
import { fnv1a } from '../shared/hash.js';
import { acceptsSlot, priorityCompare } from './compose.js';
import { compatibleWith, evaluateGroup } from './objective.js';
import { PairTable } from './pairs.js';
import type { BackfillInput } from './types.js';

export function backfillCandidate(i: BackfillInput): string | null {
  const t = i.tuning;
  const maxSize = Math.min(t.outings.maxSize, t.outings.composition.targetSize);
  const memberIds = new Set(i.outingMembers.map((c) => c.profile.userId));
  if (memberIds.size >= maxSize) return null;
  // Unité de taille 1 : personne seule (une team est indivisible), admissible sur le créneau de la sortie.
  const singles = i.pool.filter((c) => !memberIds.has(c.profile.userId) && c.teamId === null && acceptsSlot(c, i.slot));
  const all = [...i.outingMembers, ...singles];
  const P = new PairTable(all, i.facts, t);
  const members = i.outingMembers.map((_, k) => k);
  const cmp = priorityCompare(i.seed);
  let best: { k: number; j: number } | null = null;
  for (let k = members.length; k < all.length; k++) {
    if (!compatibleWith([k], members, P)) continue;
    const ev = evaluateGroup([...members, k], P, t);
    if (!ev.romanceOnlyCovered || !ev.genderCapOk) continue;
    if (!best || ev.objectiveMilli > best.j) best = { k, j: ev.objectiveMilli };
    else if (ev.objectiveMilli === best.j) {
      const a = all[k]!;
      const b = all[best.k]!;
      const c = cmp(a, b) || fnv1a(`${i.seed}|${a.profile.userId}`) - fnv1a(`${i.seed}|${b.profile.userId}`);
      if (c < 0) best = { k, j: ev.objectiveMilli };
    }
  }
  return best ? all[best.k]!.profile.userId : null;
}
