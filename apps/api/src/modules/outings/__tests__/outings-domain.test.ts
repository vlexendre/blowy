/** Règles pures du module outings : projection par acteur (§3.1 + V5.1/V5.2), annulation, fiabilité, votes, check-in. */
import { describe, expect, it } from 'vitest';
import { DEFAULT_TUNING } from '@blowy/tuning';
import { storyFriendsOnly } from '@blowy/matching/groups';
import { OutingViewSchema } from '@blowy/api-contract';
import type { OutingFacts, SeatFacts } from '../domain/facts.js';
import { photoEligible, previewOf, projectOutingFor, storyMatchFor, viewerPhase, type ViewerContext } from '../domain/visibility.js';
import { cancelPreview } from '../domain/seat-policy.js';
import { EMPTY_RELIABILITY, isPaused, recordAbsence } from '../domain/reliability.js';
import { resolveOutingVotes, voteTargets, type Attendee } from '../domain/votes.js';
import { codeMatches, distanceMeters, geoCheckIn, venueCode } from '../domain/checkin.js';
import { canSetNeighborhood, matchesQuery } from '../../neighborhoods/domain/neighborhood.js';

const H = 3_600_000;
const T0 = new Date('2026-11-12T18:30:00Z');
const id = (n: number) => `00000000-0000-7000-8000-00000000000${n}`;
const seat = (n: number, status: SeatFacts['status'], o: Partial<SeatFacts> = {}): SeatFacts => ({
  seatId: id(n),
  userId: id(n),
  status,
  teamId: null,
  funding: status === 'CONFIRMED' || status === 'ATTENDED' || status === 'CHECKED_IN' ? 'FREE_FIRST' : null,
  holdExpiresAt: null,
  acceptDeadline: new Date(T0.getTime() - 48 * H),
  confirmedAt: status === 'INVITED' ? null : new Date(T0.getTime() - 60 * H),
  cancelKind: null,
  refundState: 'NONE',
  person: { firstName: `P${n}`, age: 25 + n, gender: n % 2 ? 'WOMAN' : 'MAN', reliability: { attended: 1, noShows: 0, lateCancels: 0 }, pet: { name: `Pet${n}`, species: 'NINO', stage: 'BABY', equipped: [], traits: ['school.cirque'] }, threeWords: ['DROLE'] },
  ...o,
});
const outing = (status: OutingFacts['status'], seats: SeatFacts[]): OutingFacts => ({
  id: id(9),
  status,
  weekKey: '2026-W46',
  neighborhoodName: 'Paris 11e',
  timezone: 'Europe/Paris',
  startsAt: T0,
  endsAt: new Date(T0.getTime() + 2 * H),
  capacity: 5,
  activity: 'GAMES',
  acceptDeadline: new Date(T0.getTime() - 40 * H),
  lockAt: new Date(T0.getTime() - 24.5 * H),
  photoRevealAt: new Date(T0.getTime() - 3 * H),
  checkinOpensAt: new Date(T0.getTime() - 0.5 * H),
  checkinClosesAt: new Date(T0.getTime() + 1.5 * H),
  votesCloseAt: new Date(T0.getTime() + 73.5 * H),
  votesClosedAt: null,
  cancelReason: null,
  venue: { id: id(8), name: 'Café des Oiseaux', address: '12 rue Oberkampf, 75011 Paris', offerLabel: 'Table', photoUrl: null, lat: 48.86, lng: 2.37 },
  conversationId: id(7),
  seats,
});
const ctx = (now: Date, o: Partial<ViewerContext> = {}): ViewerContext => ({ now, blocked: new Set(), linked: new Set(), photos: new Map([[id(2), { mediaId: id(2), url: 'https://x.test/p2' }], [id(3), { mediaId: id(3), url: 'https://x.test/p3' }]]), ...o });
/** Champs qu'aucune projection ne doit jamais contenir. */
const FORBIDDEN = ['lookingFor', 'romanceGenders', 'meetGenders', 'storySeriousness', 'kidsSomeday', '"gender"', '"age"', 'birthDate', 'choice', 'noShows', 'cancelKind', 'refundState', 'lat":48.86'];
const leaks = (v: unknown, extra: string[] = []) => [...FORBIDDEN, ...extra].filter((k) => JSON.stringify(v).includes(k));

describe('projection par acteur (§3.1, V5.1, V5.2)', () => {
  const seats = [seat(1, 'INVITED'), seat(2, 'CONFIRMED'), seat(3, 'CONFIRMED'), seat(4, 'CONFIRMED'), seat(5, 'INVITED')];

  it('invité·e (PROPOSED) : pets + aperçu anonyme, ni prénom, ni âge, ni photo, ni lieu, ni chat', () => {
    const v = projectOutingFor(id(1), outing('PROPOSED', seats), ctx(new Date(T0.getTime() - 72 * H)))!;
    OutingViewSchema.parse(v);
    expect(v.members).toHaveLength(4);
    expect(v.members.every((m) => !m.firstName && !m.ageRange && !m.photo && !m.reliability)).toBe(true);
    expect(v.venue).toBeUndefined();
    expect(v.conversationId).toBeUndefined();
    expect(v.preview).toMatchObject({ size: 5, genders: { WOMAN: 3, MAN: 2 } });
    expect(leaks(v, ['P2', 'Café'])).toEqual([]);
  });

  it('aperçu : union des tranches de la grille fixe, jamais un âge exact (V5.2 C.9)', () => {
    const p = previewOf(outing('PROPOSED', seats));
    expect([p.ageMin, p.ageMax]).toEqual([26, 34]); // âges 26..30 → 26–29 et 30–34
  });

  it('confirmé·e avant le verrouillage : prénoms + tranche + fiabilité des confirmés ; pas de photo ni de lieu', () => {
    const v = projectOutingFor(id(2), outing('FORMING', seats), ctx(new Date(T0.getTime() - 48 * H)))!;
    OutingViewSchema.parse(v);
    const p3 = v.members.find((m) => m.userId === id(3))!;
    expect(p3).toMatchObject({ firstName: 'P3', ageRange: '26_29', reliability: { attended: 1, total: 1 } });
    expect(p3.photo).toBeUndefined();
    expect(v.members.find((m) => m.userId === id(1))!.firstName).toBeUndefined();
    expect(v.venue).toBeUndefined();
    expect(v.conversationId).toBe(id(7));
  });

  it('verrouillé (J-1 18 h) : lieu révélé aux confirmés, visages pas encore (startsAt − 3 h, V5.2)', () => {
    const locked = [seat(1, 'EXPIRED'), seat(2, 'CONFIRMED'), seat(3, 'CONFIRMED'), seat(4, 'CONFIRMED'), seat(5, 'CANCELLED', { cancelKind: 'LATE' })];
    const v = projectOutingFor(id(2), outing('CONFIRMED', locked), ctx(new Date(T0.getTime() - 20 * H)))!;
    OutingViewSchema.parse(v);
    expect(v.venue).toMatchObject({ name: 'Café des Oiseaux', bookingName: 'Blowy' });
    expect(v.members.some((m) => m.photo)).toBe(false);
    expect(v.members.find((m) => m.userId === id(5))).toMatchObject({ notComing: true });
    expect(v.members.find((m) => m.userId === id(1))).toBeUndefined();
    expect(JSON.stringify(v)).not.toContain('LATE');
    expect(photoEligible(id(2), outing('CONFIRMED', locked), new Date(T0.getTime() - 20 * H), new Set())).toEqual([]);
    expect(v.knowsSomeoneAvailable).toBe(true); // V5.3 B.7 : dès la confirmation
    const after = projectOutingFor(id(2), outing('CONFIRMED', locked), ctx(new Date(T0.getTime() - 2 * H)))!;
    expect(after.members.find((m) => m.userId === id(3))!.photo).toBeDefined();
    expect(after.knowsSomeoneAvailable).toBe(true);
  });

  it('place non confirmée ou annulée : rien des autres, jamais le lieu', () => {
    const v = projectOutingFor(id(1), outing('CONFIRMED', [seat(1, 'EXPIRED'), ...seats.slice(1)]), ctx(new Date(T0.getTime() - 2 * H)))!;
    expect(v.members).toEqual([]);
    expect(v.venue).toBeUndefined();
    expect(v.confirmedCount).toBeUndefined();
  });

  it('check-in ouvert : « arrivé·e » seulement pour ceux qui ont fait le check-in, jamais « absent·e »', () => {
    const s = [seat(2, 'CHECKED_IN'), seat(3, 'CONFIRMED'), seat(4, 'CHECKED_IN')];
    const v = projectOutingFor(id(2), outing('CHECKIN_OPEN', s), ctx(T0))!;
    expect(v.members.find((m) => m.userId === id(4))!.arrived).toBe(true);
    expect(v.members.find((m) => m.userId === id(3))!.arrived).toBeUndefined();
    expect(JSON.stringify(v)).not.toMatch(/absent|NO_SHOW/);
  });

  it('après la sortie : présents seulement ; après la clôture : liens seulement ; personne bloquée absente', () => {
    const s = [seat(2, 'ATTENDED'), seat(3, 'ATTENDED'), seat(4, 'NO_SHOW'), seat(5, 'ATTENDED')];
    const v = projectOutingFor(id(2), outing('DONE', s), ctx(new Date(T0.getTime() + 3 * H), { blocked: new Set([id(5)]) }))!;
    expect(v.members.map((m) => m.userId)).toEqual([id(3)]);
    expect(v.votes).toEqual({ open: true, closesAt: expect.any(String) });
    const closed = projectOutingFor(id(2), { ...outing('DONE', s), votesClosedAt: new Date(T0.getTime() + 74 * H) }, ctx(new Date(T0.getTime() + 75 * H), { linked: new Set([id(5)]) }))!;
    expect(closed.members.map((m) => m.userId)).toEqual([id(5)]);
    expect(viewerPhase(outing('DONE', s), s[2]!, T0)).toBe('INACTIVE');
  });

  it('« histoire » : seul le cas négatif « potes uniquement » sort ; la garantie positive jamais ; rien pour qui ne cherche pas', () => {
    expect(storyMatchFor({ seeksRomance: true }, false)).toBeUndefined();
    expect(storyMatchFor({ seeksRomance: true }, true)).toBe('FRIENDS_ONLY');
    expect(storyMatchFor({ seeksRomance: false }, false)).toBeUndefined();
  });

  it('« histoire » : garantie de @blowy/matching (genres réciproques, tranches fixes, hors team, bloqué·es retiré·es en amont)', () => {
    const p = (userId: string, gender: 'WOMAN' | 'MAN', romance: boolean, romanceGenders: Array<'WOMAN' | 'MAN'>, teamId: string | null = null, age = 28) => ({
      userId,
      teamId,
      seeks: { gender, seeks: { friends: true, romance }, meetGenders: [], romanceGenders, age, groupAge: { min: 24, max: 32 } },
    });
    const lea = p('lea', 'WOMAN', true, ['MAN']);
    const group = [lea, p('hugo', 'MAN', true, ['WOMAN']), p('malo', 'MAN', false, []), p('ines', 'WOMAN', false, []), p('sarah', 'WOMAN', true, ['MAN'])];
    expect(storyMatchFor({ seeksRomance: true }, storyFriendsOnly(group, DEFAULT_TUNING).get('lea')!)).toBe('FRIENDS_ONLY');
    const two = [...group, p('tom', 'MAN', true, ['WOMAN'])];
    expect(storyFriendsOnly(two, DEFAULT_TUNING).get('lea')).toBe(false);
    expect(storyMatchFor({ seeksRomance: true }, storyFriendsOnly(two, DEFAULT_TUNING).get('lea')!)).toBeUndefined();
    // Tom venu en team avec Léa ne compte pas ; un homme hors des tranches souhaitées non plus
    expect(storyFriendsOnly([...group, p('tom', 'MAN', true, ['WOMAN'])].map((x) => (x.userId === 'tom' || x.userId === 'lea' ? { ...x, teamId: 'T' } : x)), DEFAULT_TUNING).get('lea')).toBe(true);
    expect(storyFriendsOnly([...group, p('paul', 'MAN', true, ['WOMAN'], null, 40)], DEFAULT_TUNING).get('lea')).toBe(true);
  });
});

describe('annulation (V5.1 E.16, V5.2 C.8)', () => {
  const revealAt = new Date(T0.getTime() - 3 * H);
  it('avant les visages : remboursable ; après : absence sans remboursement ; sécurité : remboursée, aucun effet', () => {
    // D-019 (T3) : place payée annulée avant les visages → crédit 90 j, pas la carte.
    expect(cancelPreview({ funding: 'PAID', now: new Date(revealAt.getTime() - 1), revealAt, kind: 'CANT_MAKE_IT' })).toEqual({ cancelKind: 'EARLY', refund: 'CREDIT', countsAsAbsence: false });
    expect(cancelPreview({ funding: 'FREE_FIRST', now: revealAt, revealAt, kind: 'CANT_MAKE_IT' })).toEqual({ cancelKind: 'LATE', refund: 'NONE', countsAsAbsence: true });
    expect(cancelPreview({ funding: 'PAID', now: T0, revealAt, kind: 'SAFETY' })).toEqual({ cancelKind: 'SAFETY_EXIT', refund: 'CARD', countsAsAbsence: false });
  });
});

describe('fiabilité', () => {
  it('2 absences dans la fenêtre → pause de 7 j ; épisode remis à zéro', () => {
    const a = recordAbsence(EMPTY_RELIABILITY, 'NO_SHOW', T0, DEFAULT_TUNING);
    expect(a.paused).toBe(false);
    const b = recordAbsence(a.state, 'LATE_CANCEL', new Date(T0.getTime() + 7 * 24 * H), DEFAULT_TUNING);
    expect(b.paused).toBe(true);
    expect(b.state).toMatchObject({ noShows: 1, lateCancels: 1, episodeAbsences: 0 });
    expect(isPaused(b.state, new Date(T0.getTime() + 13 * 24 * H))).toBe(true);
    expect(isPaused(b.state, new Date(T0.getTime() + 15 * 24 * H))).toBe(false);
    const late = recordAbsence(a.state, 'NO_SHOW', new Date(T0.getTime() + 91 * 24 * H), DEFAULT_TUNING);
    expect(late.paused).toBe(false);
  });
});

describe('votes (min, PLUS incompatible → AMI en silence, team exclue)', () => {
  const att = (n: number, gender: 'WOMAN' | 'MAN', romance: ('WOMAN' | 'MAN')[], teamId: string | null = null): Attendee => ({ userId: id(n), teamId, seeks: { gender, seeks: { friends: true, romance: romance.length > 0 }, meetGenders: [], romanceGenders: romance } });
  const A = att(1, 'MAN', ['WOMAN']);
  const B = att(2, 'WOMAN', ['MAN']);
  const C = att(3, 'WOMAN', ['WOMAN']);
  const D = att(4, 'MAN', [], 't1');
  const E = att(5, 'MAN', [], 't1');
  const ballots = new Map([
    [`${id(1)}>${id(2)}`, 'PLUS'],
    [`${id(2)}>${id(1)}`, 'PLUS'],
    [`${id(1)}>${id(3)}`, 'PLUS'],
    [`${id(3)}>${id(1)}`, 'PLUS'],
    [`${id(2)}>${id(3)}`, 'PLUS'],
    [`${id(3)}>${id(2)}`, 'FRIEND'],
    [`${id(1)}>${id(4)}`, 'PLUS'],
    [`${id(4)}>${id(1)}`, 'NO'],
    [`${id(4)}>${id(5)}`, 'FRIEND'],
    [`${id(5)}>${id(4)}`, 'FRIEND'],
  ] as const);
  it('résultats mutuels seulement', () => {
    const r = resolveOutingVotes([A, B, C, D, E], ballots);
    expect(r).toEqual([
      { a: id(1), b: id(2), kind: 'PLUS' },
      { a: id(1), b: id(3), kind: 'FRIEND' }, // « plus » incompatible (C cherche des femmes) → ami·e
      { a: id(2), b: id(3), kind: 'FRIEND' }, // min(PLUS, FRIEND)
    ]);
    expect(voteTargets(D, [A, B, C, D, E])).toEqual([id(1), id(2), id(3)]);
  });
});

describe('check-in sans position stockée', () => {
  it('rayon, précision, code de lieu déterministe', () => {
    const v = { lat: 48.8649, lng: 2.3707 };
    expect(geoCheckIn({ ...v, accuracyM: 20 }, v, DEFAULT_TUNING)).toBe('ACCEPTED');
    expect(geoCheckIn({ lat: 48.87, lng: 2.38, accuracyM: 20 }, v, DEFAULT_TUNING)).toBe('TOO_FAR');
    expect(geoCheckIn({ ...v, accuracyM: 500 }, v, DEFAULT_TUNING)).toBe('LOW_ACCURACY');
    expect(distanceMeters(v, v)).toBe(0);
    const code = venueCode('secret', T0);
    expect(code).toMatch(/^\d{4}$/);
    expect(venueCode('secret', T0)).toBe(code);
    expect(codeMatches(code, code)).toBe(true);
    expect(codeMatches(code, '0000') && code !== '0000').toBe(false);
  });
});

describe('quartier', () => {
  it('cooldown, place active, quartier fermé ; recherche sans accents', () => {
    const now = new Date('2026-11-06T10:00:00Z');
    expect(canSetNeighborhood({ current: null, target: { id: 'a', status: 'WAITLIST' }, changedAt: null, hasActiveSeat: false, now, cooldownDays: 7 })).toEqual({ ok: true });
    expect(canSetNeighborhood({ current: 'b', target: { id: 'a', status: 'LIVE' }, changedAt: null, hasActiveSeat: true, now, cooldownDays: 7 })).toMatchObject({ reason: 'ACTIVE_SEAT_EXISTS' });
    expect(canSetNeighborhood({ current: 'b', target: { id: 'a', status: 'LIVE' }, changedAt: new Date(now.getTime() - 2 * 24 * H), hasActiveSeat: false, now, cooldownDays: 7 })).toMatchObject({ reason: 'NEIGHBORHOOD_CHANGE_TOO_SOON' });
    expect(canSetNeighborhood({ current: 'b', target: { id: 'a', status: 'CLOSED' }, changedAt: null, hasActiveSeat: false, now, cooldownDays: 7 })).toMatchObject({ reason: 'NEIGHBORHOOD_CLOSED' });
    expect(matchesQuery({ name: 'Lyon 4e · Croix-Rousse', city: 'Lyon', slug: 'lyon-4' }, 'croix')).toBe(true);
    expect(matchesQuery({ name: 'Saint-Denis', city: 'Saint-Denis', slug: 'saint-denis' }, 'SAINT-DÉNIS')).toBe(true);
  });
});
