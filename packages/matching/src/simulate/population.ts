/**
 * Population synthétique déterministe pour les tests de propriétés et le simulateur
 * `simulate:outings` (aucun Math.random : PRNG mulberry32 seedé par FNV-1a).
 */
import { ACTIVITY_KINDS, PASSIONS, SCHOOLS, SPECIES, SUNDAYS, pairKey, type ActivityKind, type Gender, type Passion } from '@blowy/domain';
import type { CompositionFacts, OutingCandidate, SlotOffer } from '../groups/index.js';
import { fnv1a } from '../shared/hash.js';

export type Rand = () => number;
export function prng(seed: string): Rand {
  let a = fnv1a(seed) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(r: Rand, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
const axis = (r: Rand) => Math.round((r() * 2 - 1) * 4) / 4;

export interface PopulationOptions {
  n: number;
  seed: string;
  /** Instants des créneaux (epoch ms). */
  times?: number[];
  /** Tables-sorties disponibles par créneau. */
  capacityPerTime?: number;
  romanceShare?: number;
  romanceOnlyShare?: number;
  restrictedMeetShare?: number;
  /** Part des personnes venant en team (teams de 2–3). */
  teamShare?: number;
  /** Quartiers du lot (le 1er est « chez soi » pour tous). */
  neighborhoods?: string[];
  blockedPairs?: number;
  metPairs?: number;
}

export interface Population {
  candidates: OutingCandidate[];
  facts: CompositionFacts;
  slots: SlotOffer[];
}

export const DEFAULT_NEIGHBORHOODS = ['paris-11', 'paris-12'];
const OFFER_ACTIVITIES: ActivityKind[] = ['DRINK_COFFEE', 'BRUNCH', 'GAMES'];

export const DEFAULT_TIMES = [Date.UTC(2026, 10, 19, 18, 30), Date.UTC(2026, 10, 21, 14), Date.UTC(2026, 10, 22, 10)];

export function population(o: PopulationOptions): Population {
  const r = prng(o.seed);
  const times = o.times ?? DEFAULT_TIMES;
  const genders: Gender[] = [];
  const candidates: OutingCandidate[] = [];
  for (let i = 0; i < o.n; i++) {
    const g = r();
    const gender: Gender = g < 0.47 ? 'WOMAN' : g < 0.92 ? 'MAN' : g < 0.98 ? 'NON_BINARY' : 'UNDISCLOSED';
    genders.push(gender);
    const romance = r() < (o.romanceShare ?? 0.45);
    const friends = !romance || r() >= (o.romanceOnlyShare ?? 0.1);
    const other: Gender = gender === 'WOMAN' ? 'MAN' : 'WOMAN';
    const rg = r();
    const romanceGenders: Gender[] = !romance ? [] : rg < 0.8 ? [other] : rg < 0.9 ? [gender === 'UNDISCLOSED' ? 'WOMAN' : gender] : ['WOMAN', 'MAN', 'NON_BINARY'];
    const meetGenders: Gender[] = r() < (o.restrictedMeetShare ?? 0.12) ? [gender === 'UNDISCLOSED' ? 'WOMAN' : gender] : [];
    const age = 20 + Math.floor(r() * 26);
    const passions = [...new Set(Array.from({ length: 1 + Math.floor(r() * 4) }, () => pick(r, PASSIONS)))] as Passion[];
    const chosen = times.filter(() => r() < 0.6);
    const id = `u${String(i).padStart(5, '0')}`;
    const hoods = o.neighborhoods ?? DEFAULT_NEIGHBORHOODS;
    const neighborhoodIds = r() < 0.7 ? [...hoods] : [hoods[0]!];
    const activities: ActivityKind[] = r() < 0.6 ? [] : [...new Set([pick(r, OFFER_ACTIVITIES), pick(r, ACTIVITY_KINDS)])];
    candidates.push({
      profile: {
        userId: id,
        petId: `p${id}`,
        species: pick(r, SPECIES),
        vision: { axes: { kindMischief: axis(r), sportyContemplative: axis(r), scienceArt: axis(r), homeAdventure: axis(r) }, school: pick(r, SCHOOLS), sunday: pick(r, SUNDAYS), passions, limit: r() < 0.2 ? 'GHOSTER' : 'MENTIR' },
        age,
        gender,
        intention: 'LET_IT_HAPPEN',
        preferences: { minAge: 18, maxAge: 99, genders: [], maxDistanceKm: 10 },
        eligibility: { adult: true, verified: true, active: true, lastActiveDaysAgo: 0, hasFreeSlot: true, exclusive: false },
        reliability: 100,
        activityByHour: Array<number>(24).fill(0),
        reputationWords: Math.floor(r() * 30),
      },
      seeks: { friends, romance },
      meetGenders,
      romanceGenders,
      groupAge: { min: Math.max(18, age - 8 - Math.floor(r() * 4)), max: age + 8 + Math.floor(r() * 6) },
      slotStartsAtMs: chosen.length > 0 ? chosen : [pick(r, times)],
      neighborhoodIds,
      activities,
      teamId: null,
      attendance: { attended: Math.floor(r() * 5), noShows: r() < 0.1 ? 1 : 0 },
      priority: { missedWeeks: r() < 0.1 ? 1 : 0, firstOuting: r() < 0.3, requestedAtMs: Date.UTC(2026, 10, 16, 9) + Math.floor(r() * 27 * 3600_000) },
    });
  }
  // teams de 2–3 (mêmes disponibilités, quartiers et activités que leur premier membre)
  const inTeams = Math.floor(o.n * (o.teamShare ?? 0.12));
  for (let k = 0, team = 0; k + 1 < inTeams; team++) {
    const size = Math.min(inTeams - k, r() < 0.5 ? 2 : 3);
    if (size < 2) break;
    const lead = candidates[k]!;
    for (let m = 0; m < size; m++) {
      const c = candidates[k + m]!;
      c.teamId = `team-${team}`;
      c.slotStartsAtMs = [...lead.slotStartsAtMs];
      c.neighborhoodIds = [...lead.neighborhoodIds];
      c.activities = [...lead.activities];
      c.groupAge = { min: 18, max: 99 };
    }
    k += size;
  }
  const ids = candidates.map((c) => c.profile.userId);
  const randomPairs = (m: number) => {
    const s = new Set<string>();
    for (let k = 0; k < m && o.n > 1; k++) {
      const a = pick(r, ids);
      const b = pick(r, ids);
      if (a !== b) s.add(pairKey(a, b));
    }
    return s;
  };
  const capacity = o.capacityPerTime ?? Math.ceil(o.n / 6);
  const hoods = o.neighborhoods ?? DEFAULT_NEIGHBORHOODS;
  const slots: SlotOffer[] = times.flatMap((time, ti) => [
    { venueSlotId: `vs-${ti}-a`, venueId: 'venue-a', neighborhoodId: hoods[0]!, activity: 'DRINK_COFFEE' as const, startsAtMs: time, remainingOutings: Math.ceil(capacity / 2) },
    { venueSlotId: `vs-${ti}-b`, venueId: 'venue-b', neighborhoodId: hoods[hoods.length - 1]!, activity: OFFER_ACTIVITIES[ti % OFFER_ACTIVITIES.length]!, startsAtMs: time, remainingOutings: Math.floor(capacity / 2) },
  ]);
  return { candidates, facts: { blockedPairs: randomPairs(o.blockedPairs ?? o.n), metPairs: randomPairs(o.metPairs ?? o.n) }, slots };
}
