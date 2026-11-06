/** Règles pures du module `connections` (T5) : échange 48 h, RDV, bulletins, capacité, œuf, voie Duo. */
import { describe, expect, it } from 'vitest';
import { DEFAULT_TUNING } from '@blowy/tuning';
import type { MatchProfile } from '@blowy/matching';
import { canMoveDuo, checkinWindow, dateInRange, duoCapacity, duoDateLockAt, eggActive, eggEligible, exchangeOutcome, isLateCancel, isUnlocked, localDateHour, localMinuteOf, resolveDuoVote, restingStatus, unlockProgress, voteOptionsFor } from '../domain/duo-policy.js';
import { laneCompatible, selectLanePairs, type LaneCandidate } from '../domain/lane.js';
import { memoryView } from '../application/queries.js';

const t = DEFAULT_TUNING;
const H = 3_600_000;
const at = new Date('2026-11-16T12:00:00Z');

describe('échange texte d’abord (V5.1 F.18)', () => {
  const base = { status: 'EXCHANGE' as const, exchangeEndsAt: new Date(at.getTime() + 48 * H), messagesLow: 2, messagesHigh: 2 };
  it('rien avant 48 h, même si les deux ont écrit', () => {
    expect(exchangeOutcome(base, new Date(at.getTime() + 47 * H), t)).toBeNull();
  });
  it('à 48 h : visages débloqués si les deux ont écrit, sinon fin', () => {
    expect(exchangeOutcome(base, base.exchangeEndsAt, t)).toBe('UNLOCKED');
    expect(exchangeOutcome({ ...base, messagesHigh: 1 }, base.exchangeEndsAt, t)).toBe('EXPIRED');
    expect(exchangeOutcome({ ...base, messagesLow: 0, messagesHigh: 9 }, base.exchangeEndsAt, t)).toBe('EXPIRED');
  });
  it('progression = la mienne seulement, bornée à 1', () => {
    expect(unlockProgress(0, t)).toBe(0);
    expect(unlockProgress(1, t)).toBe(0.5);
    expect(unlockProgress(7, t)).toBe(1);
  });
  it('aucun RDV ni visage pendant l’échange ; terminal fermé', () => {
    expect(isUnlocked('EXCHANGE')).toBe(false);
    expect(isUnlocked('UNLOCKED')).toBe(true);
    expect(isUnlocked('LEFT')).toBe(false);
    expect(canMoveDuo('EXCHANGE', 'DATE_PROPOSED')).toBe(false);
    expect(canMoveDuo('TOGETHER', 'DATE_PROPOSED')).toBe(true);
    expect(canMoveDuo('DATE_CONFIRMED', 'TOGETHER')).toBe(true);
    expect(restingStatus(true)).toBe('TOGETHER');
  });
});

describe('rendez-vous', () => {
  const dl = new Date(at.getTime() + 7 * 24 * H);
  it('créneau : ≥ 2 h à l’avance, 10 h–22 h locale, ≤ échéance + 7 j (voie Duo)', () => {
    const s = new Date('2026-11-18T18:30:00Z');
    expect(dateInRange({ origin: 'LANE', dateDeadline: dl, startsAt: s, localMinute: localMinuteOf(s, 'Europe/Paris'), now: at }, t)).toBe(true);
    expect(dateInRange({ origin: 'LANE', dateDeadline: dl, startsAt: new Date(at.getTime() + H), localMinute: 14 * 60, now: at }, t)).toBe(false);
    expect(dateInRange({ origin: 'LANE', dateDeadline: dl, startsAt: s, localMinute: 23 * 60, now: at }, t)).toBe(false);
    expect(dateInRange({ origin: 'LANE', dateDeadline: dl, startsAt: new Date(dl.getTime() + 8 * 24 * H), localMinute: 19 * 60, now: at }, t)).toBe(false);
    // Né d'une sortie : pas d'échéance J+7.
    expect(dateInRange({ origin: 'OUTING_VOTE', dateDeadline: null, startsAt: new Date(dl.getTime() + 8 * 24 * H), localMinute: 19 * 60, now: at }, t)).toBe(true);
  });
  it('check-in −30 / +90 min ; annulation tardive < 24 h', () => {
    const s = new Date('2026-11-18T18:30:00Z');
    const w = checkinWindow(s, t);
    expect(w.opensAt.toISOString()).toBe('2026-11-18T18:00:00.000Z');
    expect(w.closesAt.toISOString()).toBe('2026-11-18T20:00:00.000Z');
    expect(isLateCancel(s, new Date(s.getTime() - 23 * H))).toBe(true);
    expect(isLateCancel(s, new Date(s.getTime() - 25 * H))).toBe(false);
  });
});

describe('après-RDV : min, PLUS exige la compatibilité réciproque', () => {
  it('résolution', () => {
    expect(resolveDuoVote('PLUS', 'PLUS', true)).toBe('PLUS');
    expect(resolveDuoVote('PLUS', 'PLUS', false)).toBe('FRIEND');
    expect(resolveDuoVote('PLUS', 'FRIEND', true)).toBe('FRIEND');
    expect(resolveDuoVote('PLUS', 'NO', true)).toBeNull();
    expect(resolveDuoVote('PLUS', undefined, true)).toBeNull();
  });
  it('« plus » proposé selon le seul votant', () => {
    expect(voteOptionsFor(false)).toEqual(['FRIEND', 'NO']);
    expect(voteOptionsFor(true)).toContain('PLUS');
  });
});

describe('capacité (V5.2 H.25) et œuf (drapeau T9)', () => {
  it('1 duo actif gratuit, illimité Blowy+', () => {
    // V5.4 (C.11) : gratuit pour tous, 3 actifs, Blowy+ sans effet.
    expect(duoCapacity(false)).toBe(3);
    expect(duoCapacity(true)).toBe(3);
    expect(duoCapacity(true, 3)).toBe(3);
  });
  it('œuf : TOGETHER + 2 RDV vécus ; actif seulement si les deux', () => {
    expect(eggEligible({ status: 'TOGETHER', datesAttended: 1 }, t)).toBe(false);
    expect(eggEligible({ status: 'TOGETHER', datesAttended: 2 }, t)).toBe(true);
    expect(eggEligible({ status: 'UNLOCKED', datesAttended: 5 }, t)).toBe(false);
    expect(eggActive({ eggOptInLow: true, eggOptInHigh: false })).toBe(false);
    expect(eggActive({ eggOptInLow: true, eggOptInHigh: true })).toBe(true);
  });
  it('heure locale du lot', () => {
    expect(localDateHour(new Date('2026-11-16T20:05:00Z'), 'Europe/Paris')).toEqual({ date: '2026-11-16', hour: 21 });
  });
});

describe('voie Duo : paires réciproques, sans fabrication', () => {
  const profile = (userId: string, gender: 'WOMAN' | 'MAN'): MatchProfile => ({
    userId,
    petId: `p-${userId}`,
    species: 'NINO',
    vision: { axes: { kindMischief: 0.2, sportyContemplative: 0, scienceArt: 0.1, homeAdventure: 0.3 }, school: 'AUTODIDACTE', sunday: 'BRUNCH', passions: ['MUSIQUE'], limit: 'MENTIR' },
    age: 29,
    gender,
    intention: 'LET_IT_HAPPEN',
    preferences: { minAge: 18, maxAge: 99, genders: [], maxDistanceKm: 0 },
    eligibility: { adult: true, verified: true, active: true, lastActiveDaysAgo: 0, hasFreeSlot: true, exclusive: false },
    reliability: 100,
    activityByHour: new Array(24).fill(0),
    reputationWords: 0,
  });
  const cand = (userId: string, gender: 'WOMAN' | 'MAN', romance: ('WOMAN' | 'MAN')[], friends = false, capacity = 3): LaneCandidate => ({
    userId,
    petId: `p-${userId}`,
    profile: profile(userId, gender),
    seeks: { gender, seeks: { friends, romance: romance.length > 0 }, meetGenders: [], romanceGenders: romance, age: 29, groupAge: { min: 25, max: 35 } },
    capacity,
  });
  it('romance réciproque seulement (un homme qui cherche des femmes n’est jamais proposé à un homme gay)', () => {
    const thomas = cand('a-thomas', 'MAN', ['WOMAN']);
    const camille = cand('b-camille', 'WOMAN', ['MAN']);
    const hugo = cand('c-hugo', 'MAN', ['MAN']);
    expect(laneCompatible(thomas, camille)).toBe(true);
    expect(laneCompatible(thomas, hugo)).toBe(false);
    expect(laneCompatible(hugo, camille)).toBe(false);
    const pairs = selectLanePairs([thomas, camille, hugo], new Set(), 'seed', t);
    expect(pairs.map((p) => [p.a.userId, p.b.userId])).toEqual([['a-thomas', 'b-camille']]);
  });
  it('capacité nulle, paire exclue ou tranche d’âge hors limite : aucune proposition', () => {
    const a = cand('a', 'MAN', ['WOMAN']);
    const b = cand('b', 'WOMAN', ['MAN']);
    expect(selectLanePairs([a, { ...b, capacity: 0 }], new Set(), 's', t)).toEqual([]);
    expect(selectLanePairs([a, b], new Set(['a|b']), 's', t)).toEqual([]);
    expect(selectLanePairs([a, { ...b, seeks: { ...b.seeks, age: 50 } }], new Set(), 's', t)).toEqual([]);
  });
});

describe('« Ta rue » : décor = souvenirs, jamais de donnée d’autrui non visible', () => {
  it('mappe les données stockées vers le contrat strict', () => {
    const v = memoryView({ id: '00000000-0000-7000-8000-000000000001', kind: 'OUTING_LIVED', data: { weekKey: '2026-W47', venueName: 'Café', pets: 5, species: ['NINO', 'X'], secret: 'jamais' }, createdAt: at });
    expect(v[0]).toMatchObject({ kind: 'OUTING_LIVED', labelKey: 'memory.outing_lived', data: { weekKey: '2026-W47', venueName: 'Café', petCount: 5, speciesPresent: ['NINO'] } });
    expect(JSON.stringify(v)).not.toContain('jamais');
  });
});

describe('V5.6 (E13) — table de 2 au lieu partenaire', () => {
  it('confirmée au plus tard la veille à 18 h, heure du lieu (y compris au changement d’heure)', () => {
    expect(duoDateLockAt(new Date('2026-11-19T18:30:00Z'), 'Europe/Paris', DEFAULT_TUNING).toISOString()).toBe('2026-11-18T17:00:00.000Z');
    expect(duoDateLockAt(new Date('2026-03-30T17:30:00Z'), 'Europe/Paris', DEFAULT_TUNING).toISOString()).toBe('2026-03-29T16:00:00.000Z');
  });
});
