/**
 * Composition des sorties (spec-v5 §4.4, D-013, amendée par concept-v5.1 B.7–B.8, C.10, D.13–D.14).
 * Pure et déterministe : même entrée (à permutation près) → même sortie ; aucun aléa, aucune
 * horloge ; départages par FNV-1a seedé.
 *   1. unités : teams indivisibles (1–3 personnes) ;
 *   2. ordre de priorité : reporté·es d'abord, puis 1ʳᵉ sortie, puis ancienneté de la demande ;
 *   3. glouton par graine et par « classe de créneau » (instant × quartier × activité), en maximisant J ;
 *   4. réparation des non-placés ; 5. échanges d'unités entre groupes voisins ; 6. motifs codés.
 * Une unité est admissible sur une classe si l'instant est dans les disponibilités de chacun, le
 * quartier dans les quartiers acceptables de chacun, l'activité dans les activités de chacun (ou libre).
 * Le paiement n'entre jamais ici (le champ n'existe pas en entrée).
 */
import { pairKey, type UnplacedReason } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import { fnv1a } from '../shared/hash.js';
import { compatibleWith, evaluateGroup } from './objective.js';
import { PairTable } from './pairs.js';
import type { ComposeInput, ComposedGroup, CompositionResult, CompositionStats, OutingCandidate, SlotOffer } from './types.js';

interface Unit {
  idx: number;
  members: number[];
  /** Classes de créneau admissibles pour toute l'unité (triées). */
  classes: string[];
  key: string;
}

interface WorkGroup {
  classKey: string;
  offer: SlotOffer;
  units: Unit[];
  members: number[];
  objective: number;
}

const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const byId = (a: OutingCandidate, b: OutingCandidate) => cmpStr(a.profile.userId, b.profile.userId);

/** Clé de classe : instant (zéro-paddé pour un tri chronologique) × quartier × activité. */
export const slotClassKey = (o: Pick<SlotOffer, 'startsAtMs' | 'neighborhoodId' | 'activity'>): string => `${String(o.startsAtMs).padStart(15, '0')}|${o.neighborhoodId}|${o.activity}`;

/** Une personne peut-elle aller sur cette classe de créneau ? */
export const acceptsSlot = (c: OutingCandidate, o: Pick<SlotOffer, 'startsAtMs' | 'neighborhoodId' | 'activity'>): boolean =>
  c.slotStartsAtMs.includes(o.startsAtMs) && c.neighborhoodIds.includes(o.neighborhoodId) && (c.activities.length === 0 || c.activities.includes(o.activity));

/** Ordre total de priorité (§4.4.2). Payer ou Blowy+ ne change rien : ces données n'existent pas ici. */
export function priorityCompare(seed: string) {
  const tie = (c: OutingCandidate) => fnv1a(`${seed}|${c.profile.userId}`);
  return (a: OutingCandidate, b: OutingCandidate): number =>
    b.priority.missedWeeks - a.priority.missedWeeks ||
    Number(b.priority.firstOuting) - Number(a.priority.firstOuting) ||
    a.priority.requestedAtMs - b.priority.requestedAtMs ||
    tie(a) - tie(b) ||
    cmpStr(a.profile.userId, b.profile.userId);
}

/** Paires internes aux teams (MET_BEFORE et score minimal non appliqués entre elles). */
export function teamPairs(cands: readonly OutingCandidate[]): Set<string> {
  const byTeam = new Map<string, string[]>();
  for (const c of cands) if (c.teamId) byTeam.set(c.teamId, [...(byTeam.get(c.teamId) ?? []), c.profile.userId]);
  const out = new Set<string>();
  for (const ids of byTeam.values()) for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) out.add(pairKey(ids[i]!, ids[j]!));
  return out;
}

interface Prepared {
  t: Tuning;
  cands: OutingCandidate[];
  P: PairTable;
  units: Unit[];
  /** Teams invalides (incompatibles, trop grandes, sans créneau commun) : jamais scindées → non placées. */
  invalidTeamMembers: number[];
  ordered: Unit[];
  offers: SlotOffer[];
  classes: Map<string, SlotOffer>;
}

function prepare(input: ComposeInput): Prepared {
  const t = input.tuning;
  const cands = [...input.candidates].sort(byId);
  const P = new PairTable(cands, input.facts, t, teamPairs(cands));
  const offers = input.slots.map((s) => ({ ...s })).sort((a, b) => cmpStr(slotClassKey(a), slotClassKey(b)) || cmpStr(a.venueSlotId, b.venueSlotId));
  const classes = new Map<string, SlotOffer>();
  for (const o of offers) if (!classes.has(slotClassKey(o))) classes.set(slotClassKey(o), o);

  const groupsOf = new Map<string, number[]>();
  const units: Unit[] = [];
  const invalidTeamMembers: number[] = [];
  cands.forEach((c, i) => {
    if (c.teamId) groupsOf.set(c.teamId, [...(groupsOf.get(c.teamId) ?? []), i]);
    else groupsOf.set(`solo:${c.profile.userId}`, [i]);
  });
  for (const members of [...groupsOf.values()].sort((a, b) => a[0]! - b[0]!)) {
    let ok = members.length <= t.outings.composition.maxTeamSize;
    for (let x = 0; ok && x < members.length; x++) for (let y = x + 1; ok && y < members.length; y++) ok = P.compatible(members[x]!, members[y]!);
    const unitClasses = [...classes.entries()].filter(([, o]) => members.every((m) => acceptsSlot(cands[m]!, o))).map(([k]) => k);
    if (!ok || (members.length > 1 && unitClasses.length === 0)) {
      invalidTeamMembers.push(...members);
      continue;
    }
    units.push({ idx: units.length, members, classes: unitClasses, key: cands[members[0]!]!.profile.userId });
  }
  const cmp = priorityCompare(input.seed);
  const lead = (u: Unit) => u.members.map((m) => cands[m]!).sort(cmp)[0]!;
  const ordered = [...units].sort((a, b) => cmp(lead(a), lead(b)));
  return { t, cands, P, units, invalidTeamMembers, ordered, offers, classes };
}

const remainingOf = (offers: readonly SlotOffer[], classKey: string) => offers.reduce((n, o) => n + (slotClassKey(o) === classKey ? o.remainingOutings : 0), 0);
const takeOffer = (offers: SlotOffer[], classKey: string): SlotOffer | null => {
  const o = offers.find((x) => slotClassKey(x) === classKey && x.remainingOutings > 0);
  if (!o) return null;
  o.remainingOutings--;
  return o;
};

function finish(pr: Prepared, groups: WorkGroup[], placed: Uint8Array, iterations: number, algoVersion: string): CompositionResult {
  const { P, cands, t, units } = pr;
  const minSize = t.outings.minSizeToForm;
  const poolAt = new Map<string, number>();
  for (const u of units) for (const k of u.classes) poolAt.set(k, (poolAt.get(k) ?? 0) + u.members.length);
  const unplaced: CompositionResult['unplaced'] = pr.invalidTeamMembers.map((m) => ({ userId: cands[m]!.profile.userId, reason: 'TEAM_INCOMPATIBLE' as UnplacedReason }));
  for (const u of units) {
    if (placed[u.idx]) continue;
    // aucun créneau proposé ne correspond (disponibilités × quartiers × activités) → NO_SLOT_CAPACITY
    const reason: UnplacedReason =
      u.classes.length === 0 ? 'NO_SLOT_CAPACITY' : u.classes.every((k) => (poolAt.get(k) ?? 0) < minSize) ? 'POOL_TOO_SMALL' : u.classes.every((k) => remainingOf(pr.offers, k) <= 0) ? 'NO_SLOT_CAPACITY' : 'NO_COMPATIBLE_GROUP';
    for (const m of u.members) unplaced.push({ userId: cands[m]!.profile.userId, reason });
  }
  unplaced.sort((a, b) => cmpStr(a.userId, b.userId));
  let sumW = 0;
  let pairs = 0;
  let seekers = 0;
  let covered = 0;
  let imbalanced = 0;
  const out: ComposedGroup[] = groups.map((g) => {
    const ev = evaluateGroup(g.members, P, t);
    sumW += ev.sumW;
    pairs += ev.pairs;
    seekers += ev.romanceSeekers;
    covered += ev.romanceCovered;
    if (ev.genderImbalancePermille > 0) imbalanced++;
    return {
      venueSlotId: g.offer.venueSlotId,
      venueId: g.offer.venueId,
      neighborhoodId: g.offer.neighborhoodId,
      activity: g.offer.activity,
      startsAtMs: g.offer.startsAtMs,
      memberUserIds: g.members.map((m) => cands[m]!.profile.userId).sort(),
      objectiveMilli: ev.objectiveMilli,
      pairMinScore: ev.pairMinScore,
      teamCount: g.units.filter((u) => u.members.length > 1).length,
    };
  });
  const stats: CompositionStats = {
    candidates: cands.length,
    placed: cands.length - unplaced.length,
    groups: out.length,
    meanPairScore: pairs > 0 ? Math.round(sumW / pairs) : 0,
    romanceCoverage: seekers > 0 ? Math.floor((1000 * covered) / seekers) : 0,
    genderImbalancedGroups: imbalanced,
    iterations,
  };
  return { algoVersion, groups: out, unplaced, stats };
}

/** Composition hebdomadaire (quartier lancé). */
export function composeOutings(input: ComposeInput): CompositionResult {
  const pr = prepare(input);
  const { t, P, units, ordered, offers } = pr;
  const comp = t.outings.composition;
  const minSize = t.outings.minSizeToForm;
  const maxSize = Math.min(t.outings.maxSize, comp.targetSize);
  const placed = new Uint8Array(units.length);
  const groups: WorkGroup[] = [];
  const valid = (members: readonly number[]) => members.length >= minSize && members.length <= maxSize && evaluateGroup(members, P, t).romanceOnlyCovered;

  // ---- 3. glouton
  const build = (seedUnit: Unit, classKey: string): { units: Unit[]; members: number[]; objective: number } => {
    const chosen = [seedUnit];
    const members = [...seedUnit.members];
    let pool = units.filter((u) => u !== seedUnit && placed[u.idx] === 0 && u.classes.includes(classKey) && compatibleWith(u.members, members, P));
    while (members.length < maxSize && pool.length > 0) {
      let best: Unit | null = null;
      let bestJ = -Infinity;
      let bestTie = 0;
      for (const u of pool) {
        if (members.length + u.members.length > maxSize) continue;
        const j = evaluateGroup([...members, ...u.members], P, t).objectiveMilli;
        const tie = fnv1a(`${input.seed}|${seedUnit.key}|${u.key}`);
        if (j > bestJ || (j === bestJ && tie < bestTie)) {
          best = u;
          bestJ = j;
          bestTie = tie;
        }
      }
      if (!best) break;
      chosen.push(best);
      members.push(...best.members);
      const added = best;
      pool = pool.filter((u) => u !== added && compatibleWith(u.members, added.members, P));
    }
    return { units: chosen, members, objective: evaluateGroup(members, P, t).objectiveMilli };
  };

  for (const seedUnit of ordered) {
    if (placed[seedUnit.idx]) continue;
    let best: { units: Unit[]; members: number[]; objective: number; classKey: string } | null = null;
    for (const classKey of seedUnit.classes) {
      if (remainingOf(offers, classKey) <= 0) continue;
      const g = build(seedUnit, classKey);
      if (!valid(g.members)) continue;
      if (!best || g.objective > best.objective) best = { ...g, classKey };
    }
    if (!best) continue;
    const offer = takeOffer(offers, best.classKey)!;
    for (const u of best.units) placed[u.idx] = 1;
    groups.push({ classKey: best.classKey, offer, units: best.units, members: best.members, objective: best.objective });
  }

  // ---- 4. réparation
  for (const u of ordered) {
    if (placed[u.idx]) continue;
    let bestG = -1;
    let bestDelta = -Infinity;
    let bestObjective = 0;
    groups.forEach((g, gi) => {
      if (!u.classes.includes(g.classKey) || g.members.length + u.members.length > maxSize) return;
      if (!compatibleWith(u.members, g.members, P)) return;
      const ev = evaluateGroup([...g.members, ...u.members], P, t);
      if (!ev.romanceOnlyCovered) return;
      const delta = ev.objectiveMilli - g.objective;
      if (delta >= -comp.repairToleranceMilli && delta > bestDelta) {
        bestG = gi;
        bestDelta = delta;
        bestObjective = ev.objectiveMilli;
      }
    });
    if (bestG < 0) continue;
    const g = groups[bestG]!;
    g.units.push(u);
    g.members.push(...u.members);
    g.objective = bestObjective;
    placed[u.idx] = 1;
  }

  // ---- 5. amélioration locale : échanges d'unités de même taille entre groupes voisins d'une même classe
  let iterations = 0;
  const byClass = new Map<string, WorkGroup[]>();
  for (const g of groups) byClass.set(g.classKey, [...(byClass.get(g.classKey) ?? []), g]);
  const couples: Array<[WorkGroup, WorkGroup]> = [];
  for (const gs of byClass.values()) {
    for (let k = 0; k + 1 < gs.length; k++) couples.push([gs[k]!, gs[k + 1]!]);
    if (gs.length > 2) couples.push([gs[gs.length - 1]!, gs[0]!]);
  }
  while (iterations < comp.maxSwapIterations && couples.length > 0) {
    let best: { g1: WorkGroup; g2: WorkGroup; u: Unit; v: Unit; j1: number; j2: number; delta: number } | null = null;
    for (const [g1, g2] of couples) {
      for (const u of g1.units) {
        for (const v of g2.units) {
          if (u.members.length !== v.members.length) continue;
          const rest1 = g1.members.filter((m) => !u.members.includes(m));
          const rest2 = g2.members.filter((m) => !v.members.includes(m));
          if (!compatibleWith(v.members, rest1, P) || !compatibleWith(u.members, rest2, P)) continue;
          const e1 = evaluateGroup([...rest1, ...v.members], P, t);
          const e2 = evaluateGroup([...rest2, ...u.members], P, t);
          if (!e1.romanceOnlyCovered || !e2.romanceOnlyCovered) continue;
          const delta = e1.objectiveMilli + e2.objectiveMilli - g1.objective - g2.objective;
          if (delta > 0 && (!best || delta > best.delta)) best = { g1, g2, u, v, j1: e1.objectiveMilli, j2: e2.objectiveMilli, delta };
        }
      }
    }
    iterations++;
    if (!best) break;
    const { g1, g2, u, v } = best;
    g1.units = [...g1.units.filter((x) => x !== u), v];
    g2.units = [...g2.units.filter((x) => x !== v), u];
    g1.members = g1.units.flatMap((x) => x.members);
    g2.members = g2.units.flatMap((x) => x.members);
    g1.objective = best.j1;
    g2.objective = best.j2;
  }
  return finish(pr, groups, placed, iterations, comp.algoVersion);
}

/**
 * Sortie d'amorçage (V5.1 B.7) dans une ville / un quartier fermé : chaque team ayant atteint
 * `seeding.triggerTeamSize` (dans l'ordre de priorité) est associée à UNE autre team
 * (≥ `seeding.minPartnerTeamSize`) maximisant J, mêmes contraintes de paire et de créneau,
 * total ≤ `seeding.maxSize`. Les personnes seules ne sont pas composées ici.
 */
export function composeSeedingOutings(input: ComposeInput): CompositionResult {
  const pr = prepare(input);
  const { t, P, units, ordered, offers } = pr;
  const s = t.outings.seeding;
  const placed = new Uint8Array(units.length);
  for (const u of units) if (u.members.length < s.minPartnerTeamSize) placed[u.idx] = 2; // hors périmètre (non placé)
  const groups: WorkGroup[] = [];
  for (const a of ordered) {
    if (placed[a.idx] || a.members.length < s.triggerTeamSize) continue;
    let best: { b: Unit; classKey: string; objective: number; tie: number } | null = null;
    for (const b of ordered) {
      if (b === a || placed[b.idx] || a.members.length + b.members.length > s.maxSize) continue;
      if (a.members.length + b.members.length < t.outings.minSizeToForm || !compatibleWith(b.members, a.members, P)) continue;
      const members = [...a.members, ...b.members];
      const ev = evaluateGroup(members, P, t);
      if (!ev.romanceOnlyCovered) continue;
      const tie = fnv1a(`${input.seed}|${a.key}|${b.key}`);
      for (const classKey of a.classes) {
        if (!b.classes.includes(classKey) || remainingOf(offers, classKey) <= 0) continue;
        if (!best || ev.objectiveMilli > best.objective || (ev.objectiveMilli === best.objective && tie < best.tie)) best = { b, classKey, objective: ev.objectiveMilli, tie };
        break; // première classe admissible commune (chronologique) pour ce partenaire
      }
    }
    if (!best) continue;
    const offer = takeOffer(offers, best.classKey)!;
    placed[a.idx] = 1;
    placed[best.b.idx] = 1;
    groups.push({ classKey: best.classKey, offer, units: [a, best.b], members: [...a.members, ...best.b.members], objective: best.objective });
  }
  for (const u of units) if (placed[u.idx] === 2) placed[u.idx] = 0;
  return finish(pr, groups, placed, 0, t.outings.composition.algoVersion);
}

/** Graine canonique d'un lot hebdomadaire (§4.1). */
export const compositionSeed = (neighborhoodId: string, weekKey: string, tuningVersion: string): string => `outings|${neighborhoodId}|${weekKey}|${tuningVersion}`;

/** Diagnostic d'une paire (codes seulement, jamais les préférences). */
export function pairExclusion(a: OutingCandidate, b: OutingCandidate, facts: ComposeInput['facts'], t: Tuning) {
  const P = new PairTable([a, b], facts, t, teamPairs([a, b]));
  return P.exclusion(0, 1) ?? (P.compatible(0, 1) ? null : ('MIN_PAIR_SCORE' as const));
}
