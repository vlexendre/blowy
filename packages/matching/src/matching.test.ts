import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { DEFAULT_TUNING as T } from '@blowy/tuning';
import { PASSIONS, SCHOOLS, SPECIES, SUNDAYS } from '@blowy/domain';
import { characterScore, geographyScore, passionScore, scoreVision, selectBatch, firstExclusion, rhythmScore, reputationScore, type MatchProfile, type PairFacts, type CandidateInput } from './index.js';

const axes = { kindMischief: 0, sportyContemplative: 0, scienceArt: 0, homeAdventure: 0 };
const profile = (id: string, over: Partial<MatchProfile> = {}): MatchProfile => ({
  userId: id,
  petId: `pet-${id}`,
  species: 'NINO',
  vision: { axes, school: 'CIRQUE', sunday: 'BRUNCH', passions: ['MUSIQUE', 'ART'], limit: 'MENTIR' },
  age: 28,
  gender: 'WOMAN',
  intention: 'LET_IT_HAPPEN',
  preferences: { minAge: 18, maxAge: 99, genders: [], maxDistanceKm: 10 },
  eligibility: { adult: true, verified: true, active: true, lastActiveDaysAgo: 0, hasFreeSlot: true, exclusive: false },
  reliability: 100,
  activityByHour: Array(24).fill(0),
  reputationWords: 0,
  ...over,
});
const facts = (over: Partial<PairFacts> = {}): PairFacts => ({ distanceKm: 2, blockedOrReported: false, metBefore: false, pendingProposals: [0, 0], ...over });

describe('score de vision', () => {
  it('composantes C exactes (ressemblance / complémentarité)', () => {
    expect(characterScore({ ...axes, sportyContemplative: 1, homeAdventure: -1, kindMischief: 1, scienceArt: -1 }, { ...axes, sportyContemplative: 1, homeAdventure: -1, kindMischief: -1, scienceArt: 1 })).toBe(1);
    expect(characterScore({ ...axes, sportyContemplative: 1, kindMischief: 1 }, { ...axes, sportyContemplative: -1, kindMischief: 1 })).toBe(0.5);
  });
  it('P Jaccard, R neutre sans historique, M neutre sans mots', () => {
    expect(passionScore(['ART', 'MUSIQUE'], ['ART', 'SPORT'])).toBeCloseTo(1 / 3, 10);
    expect(passionScore([], [])).toBe(0);
    expect(rhythmScore(Array(24).fill(0), Array(24).fill(5), T)).toBe(0.5);
    expect(reputationScore(0, T)).toBe(0.5);
  });
  it('G : 1 sous 1 km, 0 à la limite, pas de division par zéro si limite ≤ 1 km', () => {
    expect(geographyScore(0.5, 10, T)).toBe(1);
    expect(geographyScore(10, 10, T)).toBe(0);
    expect(geographyScore(5.5, 10, T)).toBeCloseTo(0.5, 10);
    expect(geographyScore(0.8, 1, T)).toBe(1);
    expect(geographyScore(0.8, 0.5, T)).toBe(0);
    expect(geographyScore(0.3, 0.5, T)).toBe(1);
  });
  it('poids exacts : profils identiques', () => {
    const a = profile('a');
    const s = scoreVision(a, profile('b'), 0.5, T);
    // C = (1+1+1+1)/4 = 1 ; P = 1 ; D = E = 1 ; R = M = 0.5 ; G = 1 ; S = Nino/Nino 0.6
    expect(s.score).toBe(Math.round(100 * (0.3 + 0.25 + 0.1 + 0.05 + 0.05 + 0.1 + 0.05 * 0.6 + 0.025)));
  });
  it('propriété : composantes et score bornés', () => {
    const ax = fc.double({ min: -1, max: 1, noNaN: true });
    const vision = fc.record({
      axes: fc.record({ kindMischief: ax, sportyContemplative: ax, scienceArt: ax, homeAdventure: ax }),
      school: fc.constantFrom(...SCHOOLS),
      sunday: fc.constantFrom(...SUNDAYS),
      passions: fc.subarray([...PASSIONS], { minLength: 1, maxLength: 4 }),
      limit: fc.constant('JUGER' as const),
    });
    fc.assert(
      fc.property(vision, vision, fc.constantFrom(...SPECIES), fc.double({ min: 0, max: 500, noNaN: true }), fc.double({ min: 0.1, max: 200, noNaN: true }), fc.array(fc.nat(50), { minLength: 24, maxLength: 24 }), fc.nat(100), (va, vb, sp, d, maxD, hours, words) => {
        const a = profile('a', { vision: va, species: sp, activityByHour: hours, preferences: { minAge: 18, maxAge: 99, genders: [], maxDistanceKm: maxD } });
        const b = profile('b', { vision: vb, reputationWords: words });
        const s = scoreVision(a, b, d, T);
        for (const k of ['C', 'P', 'D', 'E', 'R', 'G', 'S', 'M'] as const) expect(s[k] >= 0 && s[k] <= 1).toBe(true);
        expect(s.score >= 0 && s.score <= 100 && Number.isInteger(s.score)).toBe(true);
      }),
    );
  });
});

describe('filtres réciproques', () => {
  it('préférences d’âge et de genre dans les deux sens ; genre non déclaré non deviné', () => {
    expect(firstExclusion({ a: profile('a', { preferences: { minAge: 30, maxAge: 40, genders: [], maxDistanceKm: 10 } }), b: profile('b'), facts: facts(), tuning: T })).toBe('AGE_PREFERENCE');
    expect(firstExclusion({ a: profile('a'), b: profile('b', { preferences: { minAge: 18, maxAge: 99, genders: ['MAN'], maxDistanceKm: 10 } }), facts: facts(), tuning: T })).toBe('GENDER_PREFERENCE');
    expect(firstExclusion({ a: profile('a', { preferences: { minAge: 18, maxAge: 99, genders: ['WOMAN'], maxDistanceKm: 10 } }), b: profile('b', { gender: 'UNDISCLOSED' }), facts: facts(), tuning: T })).toBe('GENDER_PREFERENCE');
  });
  it('limite ghoster : fiabilité ≥ 70 ; intentions ; blocage ; quota entrant+sortant', () => {
    const ghostLimit = profile('a', { vision: { ...profile('a').vision, limit: 'GHOSTER' } });
    expect(firstExclusion({ a: ghostLimit, b: profile('b', { reliability: 69 }), facts: facts(), tuning: T })).toBe('LIMIT_GHOSTER');
    expect(firstExclusion({ a: ghostLimit, b: profile('b', { reliability: 70 }), facts: facts(), tuning: T })).toBeNull();
    expect(firstExclusion({ a: profile('a', { intention: 'FRIENDS_GROUP' }), b: profile('b', { intention: 'OPEN_TO_MORE' }), facts: facts(), tuning: T })).toBe('INTENTION');
    expect(firstExclusion({ a: profile('a'), b: profile('b'), facts: facts({ blockedOrReported: true }), tuning: T })).toBe('BLOCKED_OR_REPORTED');
    expect(firstExclusion({ a: profile('a'), b: profile('b'), facts: facts({ pendingProposals: [0, T.matching.maxPendingProposals] }), tuning: T })).toBe('PROPOSAL_QUOTA');
    expect(firstExclusion({ a: profile('a'), b: profile('b', { eligibility: { ...profile('b').eligibility, lastActiveDaysAgo: 7 } }), facts: facts(), tuning: T })).toBe('STALE_ACTIVITY');
    expect(firstExclusion({ a: profile('a'), b: profile('b'), facts: facts({ distanceKm: 11 }), tuning: T })).toBe('DISTANCE');
  });
});

describe('lot', () => {
  const cand = (id: string, over: Partial<MatchProfile> = {}, impressions = 6): CandidateInput => ({ profile: profile(id, over), facts: facts(), exposure: { recentImpressions: impressions, boostActive: false } });
  it('zone vide : aucun candidat inventé', () => {
    const r = selectBatch(profile('me'), [], 'seed', T);
    expect(r).toMatchObject({ proposals: [], eligibleCount: 0, state: 'EMPTY_ZONE' });
    expect(selectBatch(profile('me'), [cand('x')], 'seed', T).proposals).toHaveLength(1);
  });
  it('2 meilleurs + 1 découverte ; équité sans modifier le % affiché', () => {
    const pool = Array.from({ length: 10 }, (_, i) => cand(`c${i}`, { vision: { ...profile('x').vision, passions: i < 5 ? ['MUSIQUE', 'ART'] : ['SPORT'] } }, i === 7 ? 0 : 6));
    const r = selectBatch(profile('me'), pool, 'seed', T);
    expect(r.proposals.map((p) => p.slot)).toEqual(['STRONG', 'STRONG', 'DISCOVERY']);
    for (const p of r.proposals) expect(p.visionScore).toBe(p.breakdown.score);
    expect(new Set(r.proposals.map((p) => p.userId)).size).toBe(3);
    expect(selectBatch(profile('me'), pool, 'seed', T)).toEqual(r);
  });
});
