/** Tests de propriétés de la composition des sorties (spec-v5 §4.7, concept-v5.1 B.7–B.8, C.10, D.13–D.14). */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { pairKey } from '@blowy/domain';
import { DEFAULT_TUNING as T } from '@blowy/tuning';
import { population, prng } from '../simulate/population.js';
import {
  PairTable,
  acceptsSlot,
  backfillCandidate,
  composeOutings,
  composeSeedingOutings,
  duoLaneCompatible,
  evaluateGroup,
  pairExclusion,
  romanceCompatible,
  storyCompatible,
  storyFriendsOnly,
  type CompositionResult,
  type OutingCandidate,
  type SlotOffer,
} from './index.js';

const SEED = 'outings|n-paris-11|2026-W47|tuning-2026.12.0';
type Pop = ReturnType<typeof population>;
const compose = (p: Pop, seed = SEED) => composeOutings({ candidates: p.candidates, facts: p.facts, slots: p.slots, seed, tuning: T });
const noFacts = () => ({ blockedPairs: new Set<string>(), metPairs: new Set<string>() });

/** Mélange déterministe (Fisher–Yates seedé). */
function shuffled<X>(xs: readonly X[], seed: string): X[] {
  const r = prng(seed);
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function checkInvariants(p: Pop, r: CompositionResult, sizes: [number, number] = [4, T.outings.composition.targetSize]): void {
  const byId = new Map(p.candidates.map((c) => [c.profile.userId, c]));
  const groupOf = new Map<string, number>();
  const perSlot = new Map<string, number>();
  r.groups.forEach((g, gi) => {
    expect(g.memberUserIds.length).toBeGreaterThanOrEqual(sizes[0]);
    expect(g.memberUserIds.length).toBeLessThanOrEqual(sizes[1]);
    perSlot.set(g.venueSlotId, (perSlot.get(g.venueSlotId) ?? 0) + 1);
    const offer = p.slots.find((s) => s.venueSlotId === g.venueSlotId)!;
    expect([g.startsAtMs, g.neighborhoodId, g.activity]).toEqual([offer.startsAtMs, offer.neighborhoodId, offer.activity]);
    const members = g.memberUserIds.map((id) => byId.get(id)!);
    for (const m of members) {
      expect(groupOf.has(m.profile.userId)).toBe(false);
      groupOf.set(m.profile.userId, gi);
      // disponibilité, quartier acceptable, activité
      expect(acceptsSlot(m, offer)).toBe(true);
      // romance seulement : toujours couvert
      if (m.seeks.romance && !m.seeks.friends) expect(members.some((o) => o !== m && romanceCompatible({ ...m, gender: m.profile.gender }, { ...o, gender: o.profile.gender }))).toBe(true);
    }
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i]!;
        const b = members[j]!;
        const key = pairKey(a.profile.userId, b.profile.userId);
        expect(p.facts.blockedPairs.has(key)).toBe(false);
        const sameTeam = a.teamId !== null && a.teamId === b.teamId;
        if (!sameTeam) {
          expect(p.facts.metPairs.has(key)).toBe(false);
          // filtres réciproques (âge souhaité, meetGenders, …) et score minimal
          expect(pairExclusion(a, b, p.facts, T)).toBeNull();
        }
        if (sameTeam) continue; // une team a choisi de venir ensemble (seul le blocage s'applique)
        expect(a.meetGenders.length === 0 || a.meetGenders.includes(b.profile.gender)).toBe(true);
        expect(b.meetGenders.length === 0 || b.meetGenders.includes(a.profile.gender)).toBe(true);
        expect(b.profile.age).toBeGreaterThanOrEqual(a.groupAge.min);
        expect(b.profile.age).toBeLessThanOrEqual(a.groupAge.max);
      }
    }
    // V5.2 B : un booléen par membre, et seulement ça ; vrai ssi « histoire » et < seuil compatibles (hors team)
    expect(Object.keys(g.friendsOnly).sort()).toEqual([...g.memberUserIds].sort());
    expect(Object.values(g.friendsOnly).every((f) => typeof f === 'boolean')).toBe(true);
    const story = storyFriendsOnly(members.map(storyMember), T);
    for (const m of members) {
      const n = members.filter((o) => o !== m && !(m.teamId !== null && o.teamId === m.teamId) && storyCompatible(seeksOf(m), seeksOf(o))).length;
      const expected = m.seeks.romance && n < T.outings.composition.storyGuarantee.minCompatible;
      expect(g.friendsOnly[m.profile.userId]).toBe(expected);
      expect(story.get(m.profile.userId)).toBe(expected);
    }
    expect(g.teamCount).toBe(new Set(members.filter((m) => m.teamId && members.filter((o) => o.teamId === m.teamId).length > 1).map((m) => m.teamId)).size);
  });
  // teams indivisibles : tous ensemble, ou tous non placés
  const teams = new Map<string, OutingCandidate[]>();
  for (const c of p.candidates) if (c.teamId) teams.set(c.teamId, [...(teams.get(c.teamId) ?? []), c]);
  for (const members of teams.values()) expect(new Set(members.map((m) => groupOf.get(m.profile.userId) ?? -1)).size).toBe(1);
  for (const s of p.slots) expect(perSlot.get(s.venueSlotId) ?? 0).toBeLessThanOrEqual(s.remainingOutings);
  const unplaced = new Set(r.unplaced.map((u) => u.userId));
  for (const c of p.candidates) expect(groupOf.has(c.profile.userId) !== unplaced.has(c.profile.userId)).toBe(true);
  expect(unplaced.size).toBe(r.unplaced.length);
  expect(r.stats.placed + r.unplaced.length).toBe(p.candidates.length);
  expect(r.groups.every((g) => Number.isInteger(g.objectiveMilli))).toBe(true);
}

const seeksOf = (c: OutingCandidate) => ({ gender: c.profile.gender, seeks: c.seeks, meetGenders: c.meetGenders, romanceGenders: c.romanceGenders, age: c.profile.age, groupAge: c.groupAge });
const storyMember = (c: OutingCandidate) => ({ userId: c.profile.userId, teamId: c.teamId, seeks: seeksOf(c) });
const withStory = (enabled: boolean, minCompatible = T.outings.composition.storyGuarantee.minCompatible) => ({
  ...T,
  outings: { ...T.outings, composition: { ...T.outings.composition, storyGuarantee: { ...T.outings.composition.storyGuarantee, enabled, minCompatible } } },
});
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;

const popArb = fc.record({ seed: fc.string({ minLength: 1, maxLength: 8 }), n: fc.integer({ min: 8, max: 90 }), cap: fc.integer({ min: 1, max: 8 }) });

describe('composeOutings — propriétés', () => {
  it('invariants (tailles, blocages, déjà vus, âges, teams, créneau/quartier/activité, capacité, romance, meetGenders, unicité)', () => {
    fc.assert(
      fc.property(popArb, ({ seed, n, cap }) => {
        const p = population({ n, seed, capacityPerTime: cap, teamShare: 0.25, blockedPairs: n * 2, metPairs: n * 2 });
        checkInvariants(p, compose(p));
      }),
      { numRuns: 40, seed: 20261106 },
    );
  });

  it('déterminisme : même entrée → même sortie ; permutation de l’entrée → même sortie', () => {
    fc.assert(
      fc.property(popArb, ({ seed, n, cap }) => {
        const p = population({ n, seed, capacityPerTime: cap, teamShare: 0.2 });
        const r1 = compose(p);
        expect(compose(p)).toEqual(r1);
        const q = { ...p, candidates: shuffled(p.candidates, `${seed}c`), slots: shuffled(p.slots, `${seed}s`) };
        expect(compose(q)).toEqual(r1);
      }),
      { numRuns: 25, seed: 7 },
    );
  });

  it('graine différente : résultat valide (départages seulement)', () => {
    const p = population({ n: 120, seed: 'graine' });
    checkInvariants(p, compose(p, 'autre-graine'));
  });

  it('priorité : à profils égaux, un·e reporté·e (missedWeeks = 1) est placé·e avant les autres', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), fc.integer({ min: 0, max: 1_000_000 }), (k, requestedJitter) => {
        const p = population({ n: 1, seed: 'clone', romanceShare: 0, teamShare: 0 });
        const base = p.candidates[0]!;
        const offer = { ...p.slots[0]!, remainingOutings: 1 };
        const cands: OutingCandidate[] = Array.from({ length: 6 }, (_, i) => ({
          ...structuredClone(base),
          profile: { ...structuredClone(base.profile), userId: `c${i}`, petId: `p${i}`, vision: { ...base.profile.vision, limit: 'MENTIR' } },
          meetGenders: [],
          groupAge: { min: 18, max: 99 },
          slotStartsAtMs: [offer.startsAtMs],
          neighborhoodIds: [offer.neighborhoodId],
          activities: [],
          priority: { missedWeeks: i === k ? 1 : 0, firstOuting: false, requestedAtMs: requestedJitter },
        }));
        const r = composeOutings({ candidates: cands, facts: noFacts(), slots: [offer], seed: SEED, tuning: T });
        expect(r.groups).toHaveLength(1);
        expect(r.groups[0]!.memberUserIds).toHaveLength(T.outings.composition.targetSize);
        expect(r.groups[0]!.memberUserIds).toContain(`c${k}`);
        expect(r.unplaced).toHaveLength(1);
      }),
      { numRuns: 30, seed: 3 },
    );
  });

  it('team : composée ensemble même déjà vue entre elle ; team incompatible jamais scindée', () => {
    const p = population({ n: 40, seed: 'team', times: [Date.UTC(2026, 10, 19, 18)], romanceShare: 0, restrictedMeetShare: 0, teamShare: 0, blockedPairs: 0, metPairs: 0 });
    const [a, b, c] = p.candidates;
    for (const x of [a!, b!, c!]) Object.assign(x, { teamId: 'T1', groupAge: { min: 18, max: 99 }, neighborhoodIds: [...a!.neighborhoodIds], activities: [], slotStartsAtMs: [...a!.slotStartsAtMs] });
    const met = { ...p, facts: { blockedPairs: new Set<string>(), metPairs: new Set([pairKey(a!.profile.userId, b!.profile.userId)]) } };
    const g = compose(met).groups.find((x) => x.memberUserIds.includes(a!.profile.userId));
    expect(g?.memberUserIds).toEqual(expect.arrayContaining([a!.profile.userId, b!.profile.userId, c!.profile.userId]));
    expect(g?.teamCount).toBe(1);
    // une team avec un blocage interne n'est jamais scindée : ses membres ne sont pas placés
    const blocked = { ...p, facts: { blockedPairs: new Set([pairKey(a!.profile.userId, c!.profile.userId)]), metPairs: new Set<string>() } };
    const r = compose(blocked);
    for (const x of [a!, b!, c!]) expect(r.unplaced).toContainEqual({ userId: x.profile.userId, reason: 'TEAM_INCOMPATIBLE' });
  });

  it('quartiers acceptables et activité : jamais proposé·e hors de ses choix', () => {
    const p = population({ n: 60, seed: 'quartiers', teamShare: 0 });
    for (const c of p.candidates.slice(0, 30)) {
      c.neighborhoodIds = ['paris-11'];
      c.activities = ['DRINK_COFFEE'];
    }
    const r = compose(p);
    checkInvariants(p, r);
    for (const g of r.groups) if (g.memberUserIds.some((x) => p.candidates.slice(0, 30).some((c) => c.profile.userId === x))) expect([g.neighborhoodId, g.activity]).toEqual(['paris-11', 'DRINK_COFFEE']);
  });

  it('aucune influence du financement : un champ étranger en entrée ne change rien', () => {
    const p = population({ n: 80, seed: 'argent' });
    const paid = { ...p, candidates: p.candidates.map((c, i) => ({ ...c, funding: i % 2 ? 'PAID' : 'FREE_FIRST', plus: i % 3 === 0 }) as OutingCandidate) };
    expect(compose(paid)).toEqual(compose(p));
  });

  it('motifs de non-placement codés', () => {
    const tiny = population({ n: 3, seed: 'petit', times: [Date.UTC(2026, 10, 19, 18)], teamShare: 0 });
    for (const c of tiny.candidates) Object.assign(c, { activities: [], neighborhoodIds: ['paris-11', 'paris-12'] });
    expect(compose(tiny).unplaced.every((u) => u.reason === 'POOL_TOO_SMALL')).toBe(true);
    const full = population({ n: 40, seed: 'plein', times: [Date.UTC(2026, 10, 19, 18)], capacityPerTime: 0, teamShare: 0 });
    expect(compose(full).unplaced.every((u) => u.reason === 'NO_SLOT_CAPACITY')).toBe(true);
  });

  it('performance (médiane de 3 mesures, budgets larges : robuste à la charge machine) : 600 candidats < 5 s, 2 000 < 20 s', () => {
    for (const [n, budget] of [
      [600, 5000],
      [2000, 20000],
    ] as const) {
      const p = population({ n, seed: 'blowy-outings-2026' });
      const runs: number[] = [];
      let r: CompositionResult | null = null;
      for (let k = 0; k < 3; k++) {
        const t0 = performance.now();
        r = compose(p);
        runs.push(performance.now() - t0);
      }
      const ms = median(runs);
      expect(ms, `${n} candidats : médiane ${Math.round(ms)} ms (${runs.map(Math.round).join(', ')})`).toBeLessThan(budget);
      expect(r!.stats.placed / n).toBeGreaterThan(0.75);
      if (n === 600) checkInvariants(p, r!);
    }
  }, 180_000);
});

describe('garantie « pour toi » (V5.2 B.5–B.6)', () => {
  const s = (userId: string, gender: 'WOMAN' | 'MAN', romance: boolean, romanceGenders: Array<'WOMAN' | 'MAN'>, age = 28, teamId: string | null = null) => ({
    userId,
    teamId,
    seeks: { gender, seeks: { friends: true, romance }, meetGenders: [], romanceGenders, age, groupAge: { min: 24, max: 32 } },
  });

  it('vraie pour chaque groupe, garantie activée ou non, quel que soit le seuil (marquage toujours honnête)', () => {
    fc.assert(
      fc.property(popArb, fc.boolean(), fc.integer({ min: 1, max: 3 }), ({ seed, n, cap }, enabled, min) => {
        const p = population({ n, seed, capacityPerTime: cap, teamShare: 0.2, romanceShare: 0.6 });
        const t = withStory(enabled, min);
        const r = composeOutings({ ...p, seed: SEED, tuning: t });
        const byId = new Map(p.candidates.map((c) => [c.profile.userId, c]));
        for (const g of r.groups) {
          const members = g.memberUserIds.map((id) => byId.get(id)!);
          const flags = storyFriendsOnly(members.map(storyMember), t);
          for (const m of members) {
            const n2 = members.filter((o) => o !== m && !(m.teamId !== null && o.teamId === m.teamId) && storyCompatible(seeksOf(m), seeksOf(o))).length;
            // « histoire » : ≥ seuil compatibles, sinon « potes uniquement » ; pas « histoire » : jamais marqué
            expect(g.friendsOnly[m.profile.userId]).toBe(m.seeks.romance ? n2 < min : false);
            expect(flags.get(m.profile.userId)).toBe(g.friendsOnly[m.profile.userId]);
          }
        }
        const seekers = r.groups.flatMap((g) => g.memberUserIds.filter((id) => byId.get(id)!.seeks.romance));
        const fo = r.groups.reduce((k, g) => k + Object.values(g.friendsOnly).filter(Boolean).length, 0);
        expect(r.stats.friendsOnlyMembers).toBe(fo);
        expect(r.stats.storyGuaranteeCoverage).toBe(seekers.length > 0 ? Math.floor((1000 * (seekers.length - fo)) / seekers.length) : 0);
      }),
      { numRuns: 30, seed: 52 },
    );
  });

  it('règle : genres réciproques, intention histoire, tranches FIXES compatibles ; la team ne compte pas', () => {
    const a = s('a', 'WOMAN', true, ['MAN']);
    expect(storyCompatible(a.seeks, s('b', 'MAN', true, ['WOMAN']).seeks)).toBe(true);
    expect(storyCompatible(a.seeks, s('b', 'MAN', true, ['MAN']).seeks)).toBe(false);
    expect(storyCompatible(a.seeks, s('b', 'MAN', false, []).seeks)).toBe(false);
    // 33 ans → tranche 30–34, qui recoupe 24–32 : compatible (jamais l'âge exact) ; 35 → 35–39 : non
    expect(storyCompatible(a.seeks, s('b', 'MAN', true, ['WOMAN'], 33).seeks)).toBe(true);
    expect(storyCompatible(a.seeks, s('b', 'MAN', true, ['WOMAN'], 35).seeks)).toBe(false);
    const team = [s('a', 'WOMAN', true, ['MAN'], 28, 'T'), s('b', 'MAN', true, ['WOMAN'], 28, 'T'), s('c', 'MAN', true, ['WOMAN']), s('d', 'WOMAN', false, [])];
    expect(storyFriendsOnly(team, T).get('a')).toBe(true); // b est dans sa team : 1 seul compatible
    expect(storyFriendsOnly([...team, s('e', 'MAN', true, ['WOMAN'])], T).get('a')).toBe(false);
  });

  it('aucune information sur QUI est compatible : seul le booléen sort, identique quand on change lesquels le sont', () => {
    // a cherche un homme ; deux configurations : (b, c) compatibles ou (c, d) compatibles → même sortie
    const v1 = [s('a', 'WOMAN', true, ['MAN']), s('b', 'MAN', true, ['WOMAN']), s('c', 'MAN', true, ['WOMAN']), s('d', 'MAN', false, []), s('e', 'WOMAN', false, [])];
    const v2 = [s('a', 'WOMAN', true, ['MAN']), s('b', 'MAN', false, []), s('c', 'MAN', true, ['WOMAN']), s('d', 'MAN', true, ['WOMAN']), s('e', 'WOMAN', false, [])];
    const f1 = storyFriendsOnly(v1, T);
    const f2 = storyFriendsOnly(v2, T);
    expect(f1.get('a')).toBe(false);
    expect(f2.get('a')).toBe(f1.get('a'));
    // un booléen par personne, rien d'autre ; « false » ne distingue pas « garanti » de « ne cherche pas »
    expect([...f1.values()].every((x) => typeof x === 'boolean')).toBe(true);
    expect(f1.get('e')).toBe(false);
    // le résultat de la composition n'expose que des champs connus, et des agrégats en stats
    const p = population({ n: 90, seed: 'fuite', romanceShare: 0.6 });
    const r = compose(p);
    for (const g of r.groups) expect(Object.keys(g).sort()).toEqual(['activity', 'friendsOnly', 'memberUserIds', 'neighborhoodId', 'objectiveMilli', 'pairMinScore', 'startsAtMs', 'teamCount', 'venueId', 'venueSlotId']);
    expect(Object.values(r.stats).every((x) => typeof x === 'number')).toBe(true);
    expect(JSON.stringify(r.groups)).not.toMatch(/romance|story|compatib|gender|seeks|"WOMAN"|"MAN"/i);
  });

  it('déterminisme : même entrée, entrée permutée → mêmes booléens', () => {
    fc.assert(
      fc.property(popArb, ({ seed, n, cap }) => {
        const p = population({ n, seed, capacityPerTime: cap, teamShare: 0.2, romanceShare: 0.6 });
        const r1 = compose(p);
        const r2 = compose({ ...p, candidates: shuffled(p.candidates, `${seed}x`), slots: shuffled(p.slots, `${seed}y`) });
        expect(r2.groups.map((g) => g.friendsOnly)).toEqual(r1.groups.map((g) => g.friendsOnly));
        expect(JSON.stringify(r2)).toBe(JSON.stringify(r1));
      }),
      { numRuns: 20, seed: 9 },
    );
  });

  it('activée : plus de chercheurs d’histoire garantis qu’en la désactivant, sans perte de placement notable', () => {
    for (const n of [300, 600]) {
      const p = population({ n, seed: 'blowy-outings-2026' });
      const off = composeOutings({ ...p, seed: SEED, tuning: withStory(false) });
      const on = composeOutings({ ...p, seed: SEED, tuning: withStory(true) });
      expect(on.stats.storyGuaranteeCoverage).toBeGreaterThan(off.stats.storyGuaranteeCoverage);
      expect(on.stats.friendsOnlyMembers).toBeLessThan(off.stats.friendsOnlyMembers);
      expect(on.stats.placed).toBeGreaterThanOrEqual(off.stats.placed - Math.ceil(n * 0.02));
    }
  });
});

describe('composeSeedingOutings (amorçage team + team, V5.1 B.7)', () => {
  const seedingPop = (seed: string) => {
    const p = population({ n: 30, seed, times: [Date.UTC(2026, 10, 21, 14)], romanceShare: 0, restrictedMeetShare: 0, teamShare: 0, blockedPairs: 0, metPairs: 0 });
    const sizes = [3, 2, 3, 1, 1, 2, 3];
    let k = 0;
    sizes.forEach((size, ti) => {
      for (let m = 0; m < size; m++) Object.assign(p.candidates[k + m]!, { teamId: size > 1 ? `T${ti}` : null, groupAge: { min: 18, max: 99 }, neighborhoodIds: ['paris-11', 'paris-12'], activities: [] });
      k += size;
    });
    return { ...p, candidates: p.candidates.slice(0, k) };
  };
  it('une team de 3 est associée à une autre team ; seul·es jamais composé·es ; invariants', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 6 }), (seed) => {
        const p = seedingPop(seed);
        const r = composeSeedingOutings({ ...p, seed: SEED, tuning: T });
        checkInvariants(p, r, [4, T.outings.seeding.maxSize]);
        for (const g of r.groups) {
          const members = p.candidates.filter((c) => g.memberUserIds.includes(c.profile.userId));
          expect(members.every((m) => m.teamId !== null)).toBe(true);
          expect(new Set(members.map((m) => m.teamId)).size).toBe(2);
          expect(g.teamCount).toBe(2);
          expect(members.some((m) => members.filter((o) => o.teamId === m.teamId).length >= T.outings.seeding.triggerTeamSize)).toBe(true);
        }
        expect(composeSeedingOutings({ ...p, candidates: [...p.candidates].reverse(), seed: SEED, tuning: T })).toEqual(r);
      }),
      { numRuns: 20, seed: 5 },
    );
  });
});

describe('backfillCandidate', () => {
  it('choisit une personne seule, admissible sur le créneau, compatible avec tout le groupe, de façon déterministe', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 6 }), (seed) => {
        const p = population({ n: 60, seed, times: [Date.UTC(2026, 10, 19, 18)], blockedPairs: 120 });
        const r = compose(p);
        const g = r.groups.find((x) => p.candidates.filter((c) => x.memberUserIds.includes(c.profile.userId)).every((c) => c.teamId === null));
        if (!g) return;
        const slot: Pick<SlotOffer, 'startsAtMs' | 'neighborhoodId' | 'activity'> = { startsAtMs: g.startsAtMs, neighborhoodId: g.neighborhoodId, activity: g.activity };
        const members = p.candidates.filter((c) => g.memberUserIds.includes(c.profile.userId)).slice(0, g.memberUserIds.length - 1);
        const pool = p.candidates.filter((c) => !r.groups.some((x) => x.memberUserIds.includes(c.profile.userId)));
        const pick = backfillCandidate({ outingMembers: members, slot, pool, facts: p.facts, seed: SEED, tuning: T });
        expect(backfillCandidate({ outingMembers: [...members].reverse(), slot, pool: [...pool].reverse(), facts: p.facts, seed: SEED, tuning: T })).toBe(pick);
        if (pick === null) return;
        const chosen = pool.find((c) => c.profile.userId === pick)!;
        expect(chosen.teamId).toBeNull();
        expect(acceptsSlot(chosen, slot)).toBe(true);
        for (const m of members) expect(pairExclusion(m, chosen, p.facts, T)).toBeNull();
      }),
      { numRuns: 30, seed: 11 },
    );
  });
  it('null si la sortie est pleine ou le vivier vide', () => {
    const p = population({ n: 8, seed: 'x' });
    const slot = p.slots[0]!;
    expect(backfillCandidate({ outingMembers: p.candidates.slice(0, 5), slot, pool: p.candidates.slice(5), facts: p.facts, seed: SEED, tuning: T })).toBeNull();
    expect(backfillCandidate({ outingMembers: p.candidates.slice(0, 4), slot, pool: [], facts: p.facts, seed: SEED, tuning: T })).toBeNull();
  });
});

describe('règles romance / voie Duo', () => {
  const s = (gender: 'WOMAN' | 'MAN', romance: boolean, romanceGenders: Array<'WOMAN' | 'MAN'>, friends = true, meetGenders: Array<'WOMAN' | 'MAN'> = []) => ({ gender, seeks: { friends, romance }, romanceGenders, meetGenders });
  it('rom(a,b) réciproque, âges appliqués en silence quand fournis', () => {
    expect(romanceCompatible(s('WOMAN', true, ['MAN']), s('MAN', true, ['WOMAN']))).toBe(true);
    expect(romanceCompatible(s('WOMAN', true, ['MAN']), s('MAN', true, ['MAN']))).toBe(false);
    expect(romanceCompatible(s('WOMAN', true, ['MAN']), s('MAN', false, []))).toBe(false);
    expect(romanceCompatible({ ...s('WOMAN', true, ['MAN']), age: 30, groupAge: { min: 26, max: 34 } }, { ...s('MAN', true, ['WOMAN']), age: 40, groupAge: { min: 25, max: 45 } })).toBe(false);
  });
  it('voie Duo : romance réciproque, ou amitié réciproque respectant meetGenders', () => {
    expect(duoLaneCompatible(s('WOMAN', false, []), s('MAN', false, []))).toBe(true);
    expect(duoLaneCompatible(s('WOMAN', false, [], true, ['WOMAN']), s('MAN', false, []))).toBe(false);
    expect(duoLaneCompatible(s('WOMAN', true, ['MAN'], false), s('MAN', false, []))).toBe(false);
  });
  it('objectif entier ; groupe mono-genre par préférence non pénalisé, mixte par défaut pénalisé', () => {
    const base = population({ n: 4, seed: 'mono', romanceShare: 0, teamShare: 0 }).candidates.map((c) => ({ ...c, profile: { ...c.profile, gender: 'WOMAN' as const, vision: { ...c.profile.vision, limit: 'MENTIR' as const } }, groupAge: { min: 18, max: 99 } }));
    const lowT = { ...T, outings: { ...T.outings, composition: { ...T.outings.composition, minPairScore: 0 } } };
    const restricted = new PairTable(base.map((c) => ({ ...c, meetGenders: ['WOMAN' as const] })), noFacts(), lowT);
    const open = new PairTable(base.map((c) => ({ ...c, meetGenders: [] })), noFacts(), lowT);
    const ev1 = evaluateGroup([0, 1, 2, 3], restricted, lowT);
    const ev2 = evaluateGroup([0, 1, 2, 3], open, lowT);
    expect(Number.isInteger(ev1.objectiveMilli)).toBe(true);
    expect(ev1.genderImbalancePermille).toBe(0);
    expect(ev2.genderImbalancePermille).toBe(1000 - T.outings.composition.maxGenderSharePermille);
    expect(ev1.objectiveMilli - ev2.objectiveMilli).toBe(Math.floor((T.outings.composition.lambdaGender * ev2.genderImbalancePermille) / 1000));
  });
});
