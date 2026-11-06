/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5.5 (concept-v5.5, spec révision 5) — intégration (vraie base, vrai graphe Nest, horloge contrôlée,
 * astreinte APPLIQUÉE : `ONCALL_COVERAGE=enforce`) :
 *  - D-053 : composition GLISSANTE à J − 3 21 h par (ville, jour) — un mardi se compose le samedi 21 h (avant sa
 *    confirmation de lundi 18 h) ; une personne disponible mardi et jeudi est placée une seule fois ;
 *  - D-058 : aucun créneau / aucune sortie hors des heures d'astreinte ; `GET /v1/safety/oncall` ;
 *  - D-055 : ambiance — « plutôt calme » jamais dans un lieu animé ;
 *  - D-061 : état honnête « histoire » sur la ville et mes créneaux, avant composition ; « sortir en amitié » ;
 *  - D-059 : indicateurs de ville (photographie quotidienne, < 10 masqué) ;
 *  - D-064 : parrainage = prochaine sortie offerte (≤ 1 par mois, jamais deux en attente).
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uuidv7 } from '@blowy/database';
import { OUTINGS_JOBS } from '../../src/modules/outings/outings.module.js';
import { ECONOMY_GRAPH, ECONOMY_OUTBOX_CONSUMERS } from '../../src/modules/economy/economy.module.js';
import type { EconomyGraph } from '../../src/modules/economy/economy.composition.js';
import { UNIT_OF_WORK, type TxScope, type UnitOfWork } from '../../src/shared/application/unit-of-work.js';
import type { RecurringJob } from '../../src/jobs/scheduler.js';
import { onboard, startHarness, TestClient, type Harness } from './harness.js';

let h: Harness;
const T = {
  friday: new Date('2026-11-20T19:30:00Z'), // ven. 20 h 30 Paris : avant l'ouverture des demandes W48
  saturday: new Date('2026-11-21T10:00:00Z'), // sam. 11 h : demandes ouvertes (depuis ven. 21 h)
  composeTue: new Date('2026-11-21T20:01:00Z'), // sam. 21 h 01 Paris = J − 3 21 h du mardi 24
  composeThu: new Date('2026-11-23T20:01:00Z'), // lun. 21 h 01 Paris = J − 3 21 h du jeudi 26
  week: '2026-W48',
};
const TUE = new Date('2026-11-24T18:30:00Z'); // mar. 19 h 30 Paris
const THU = new Date('2026-11-26T18:30:00Z'); // jeu. 19 h 30 Paris
let nbId = '';

beforeAll(async () => {
  h = await startHarness(T.saturday, { ONCALL_COVERAGE: 'enforce' });
  await h.reset();
  const zone = await h.db.zone.findUniqueOrThrow({ where: { code: 'PARIS_11' } });
  nbId = (await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-v55-11', name: 'Paris 11e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } })).id;
  await h.db.neighborhoodSlotTemplate.createMany({ data: [{ neighborhoodId: nbId, isoWeekday: 2, localMinute: 19 * 60 + 30, activity: 'GAMES' }, { neighborhoodId: nbId, isoWeekday: 4, localMinute: 19 * 60 + 30, activity: 'GAMES' }] });
  await h.db.venue.create({ data: { neighborhoodId: nbId, name: 'Le Comptoir animé', addressLine: '1 rue IT', postalCode: '75011', city: 'Paris', lat: 48.86, lng: 2.37, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 2, accessibilityTags: [], checkinSecretRef: 'it-v55', ambiance: 'LIVELY' } });
});
afterAll(async () => h?.close());

const job = (name: string) => h.app.get<RecurringJob[]>(OUTINGS_JOBS).find((j) => j.name === name)!;
const run = async (name: string, at: Date) => {
  h.clock.set(at);
  await job(name).run(at);
  await h.drain();
};

async function person(key: string, gender: 'WOMAN' | 'MAN', o: { looking?: 'FRIENDS' | 'BOTH'; ambiance?: 'CALM' | 'LIVELY' | 'ANY' } = {}) {
  h.clock.set(T.saturday);
  const c = new TestClient(h);
  await onboard(c, key, { gender, seeking: [] });
  expect((await c.call('PUT', '/v1/me/neighborhood', { neighborhoodId: nbId })).status).toBe(200);
  const looking = o.looking ?? 'FRIENDS';
  if (looking !== 'FRIENDS') await c.call('POST', '/v1/consents', { items: [{ purpose: 'SENSITIVE_PREFERENCES', version: '2026-11', granted: true }] });
  expect((await c.call('PUT', '/v1/preferences/intentions', { lookingFor: looking, storySeriousness: null, kidsSomeday: null, meetingMode: 'GROUP', meetGenders: [], romanceGenders: looking === 'FRIENDS' ? [] : [gender === 'WOMAN' ? 'MAN' : 'WOMAN'] })).status).toBe(200);
  if (o.ambiance) {
    const r = await c.call('PUT', '/v1/preferences/outings', { groupAge: { min: 20, max: 40 }, availableSlotTemplateIds: [], weeksOff: [], activities: [], neighborhoodIds: [nbId], maxTravelMinutes: 30, ambiance: o.ambiance });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.ambiance).toBe(o.ambiance);
  }
  await h.db.mediaAsset.create({ data: { ownerUserId: c.userId, purpose: 'PROFILE_PHOTO', status: 'READY', storageKey: `it/${key}.jpg`, retentionClass: 'PROFILE_PHOTO', finalizedAt: T.saturday } });
  return c;
}

/** Tour d'astreinte (fuseau Europe/Paris) couvrant [from, to]. */
const shift = (from: Date, to: Date) => h.db.safetyOnCallShift.create({ data: { timezone: 'Europe/Paris', startsAt: from, endsAt: to, teamLabel: 'IT' } });

describe('V5.5 — calendrier glissant, astreinte, ambiance, état honnête', () => {
  let ps: TestClient[] = [];

  it('demandes ouvertes le vendredi 21 h de W−1 ; état honnête « histoire » avant composition (moi seul·e) ; « sortir en amitié »', async () => {
    ps = [await person('itv55a', 'WOMAN', { looking: 'BOTH' }), await person('itv55b', 'MAN'), await person('itv55c', 'WOMAN'), await person('itv55d', 'MAN'), await person('itv55e', 'WOMAN'), await person('itv55calm', 'MAN', { ambiance: 'CALM' })];
    h.clock.set(T.friday);
    expect((await ps[1]!.call('PUT', `/v1/outings/requests/${T.week}`, {})).body.detailsSafe?.reason).toBe('REQUEST_WINDOW_CLOSED');
    h.clock.set(T.saturday);
    for (const p of ps) expect((await p.call('PUT', `/v1/outings/requests/${T.week}`, {})).status).toBe(200);
    // Léa (itv55a) cherche une histoire : aucun homme cherchant une histoire sur ses créneaux → état honnête, pour elle seule.
    const w = (await ps[0]!.call('GET', '/v1/outings/week')).body;
    expect(w.storyFeasibility).toBe('NOT_ENOUGH_ON_SLOTS');
    expect(w.composeAt).toBe('2026-11-21T20:00:00.000Z'); // sam. 21 h : composition du mardi
    for (const p of ps.slice(1)) expect((await p.call('GET', '/v1/outings/week')).body.storyFeasibility).toBeUndefined();
    expect(JSON.stringify(w)).not.toMatch(/itv55|userId/);
    // « Sortir quand même, en amitié » cette semaine : l'état honnête disparaît.
    const f = await ps[0]!.call('PUT', `/v1/outings/requests/${T.week}`, { mode: 'FRIENDS_THIS_WEEK' });
    expect(f.body.mode).toBe('FRIENDS_THIS_WEEK');
    expect((await ps[0]!.call('GET', '/v1/outings/week')).body.storyFeasibility).toBeUndefined();
  });

  it('D-058 : sans astreinte, aucun créneau n’est composé ; GET /v1/safety/oncall dit la vérité', async () => {
    await run('outings.compose', T.composeTue);
    expect(await h.db.outing.count()).toBe(0);
    expect((await ps[1]!.call('GET', `/v1/safety/oncall?at=${TUE.toISOString()}`)).body).toEqual({ covered: false });
    await shift(new Date('2026-11-24T17:00:00Z'), new Date('2026-11-24T23:30:00Z')); // mar. 18 h → 0 h 30
    expect((await ps[1]!.call('GET', `/v1/safety/oncall?at=${TUE.toISOString()}`)).body).toEqual({ covered: true, responseMinutes: 60 });
  });

  it('D-053 : le mardi se compose le samedi 21 h — composition < fin d’invitation ≤ confirmation (lun. 18 h) ; ambiance respectée', async () => {
    await run('outings.compose', new Date(T.composeTue.getTime() + 60_000));
    const outings = await h.db.outing.findMany({ include: { seats: true } });
    expect(outings).toHaveLength(1);
    const o = outings[0]!;
    expect(o.startsAt.toISOString()).toBe(TUE.toISOString());
    expect(o.lockAt.toISOString()).toBe('2026-11-23T17:00:00.000Z');
    expect(o.composedAt.getTime()).toBeLessThan(o.acceptDeadline.getTime());
    expect(o.acceptDeadline.getTime()).toBeLessThanOrEqual(o.lockAt.getTime());
    const run1 = await h.db.compositionRun.findFirstOrThrow({ where: { kind: 'ROLLING' } });
    expect(run1.slotDate?.toISOString().slice(0, 10)).toBe('2026-11-24');
    // Le lieu est « animé » : la personne « plutôt calme » n'y est jamais proposée.
    const calm = ps[5]!;
    expect(o.seats.map((s) => s.userId)).not.toContain(calm.userId);
    // Rejouer la composition du jour ne crée rien.
    await run('outings.compose', new Date(T.composeTue.getTime() + 10 * 60_000));
    expect(await h.db.outing.count()).toBe(1);
    // La personne non placée mardi reste candidate (demande OPEN) pour le jeudi.
    expect((await h.db.outingRequest.findFirstOrThrow({ where: { userId: calm.userId, weekKey: T.week } })).status).toBe('OPEN');
  });

  it('D-053 : le jeudi se compose le lundi 21 h ; personne n’est placé·e deux fois ; un créneau non couvert reste vide', async () => {
    await run('outings.compose', T.composeThu);
    // Jeudi non couvert par l'astreinte → aucune sortie ; la personne calme n'a plus d'autre jour : non placée.
    expect(await h.db.outing.count({ where: { startsAt: THU } })).toBe(0);
    const seats = await h.db.outingSeat.groupBy({ by: ['userId'], _count: true });
    expect(seats.every((s) => s._count === 1)).toBe(true);
    // La demande close après le dernier jour composé : plus de créneau à composer → fenêtre fermée.
    h.clock.set(new Date('2026-11-24T08:00:00Z'));
    expect((await ps[5]!.call('PUT', `/v1/outings/requests/${T.week}`, {})).body.detailsSafe?.reason).toBe('REQUEST_WINDOW_CLOSED');
  });
});

describe('V5.5 — indicateurs de ville (D-059) et parrainage (D-064)', () => {
  it('photographie quotidienne ; sous 10, « pas encore assez de monde » partout ; jamais d’identifiant', async () => {
    await run('neighborhoods.city_insights', new Date('2026-11-24T03:00:00Z'));
    const snaps = await h.db.cityInsightSnapshot.findMany();
    expect(snaps).toHaveLength(1);
    expect(JSON.stringify(snaps[0]!.payload)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
    const c = new TestClient(h);
    await c.signIn('itv55a');
    const r = await c.call('GET', '/v1/me/city-insights');
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.asOf).toBe('2026-11-24');
    expect(r.body.ageBrackets.every((b: any) => b.notEnough === true)).toBe(true);
    // Rejouer le même jour : aucune nouvelle photographie.
    await run('neighborhoods.city_insights', new Date('2026-11-24T05:00:00Z'));
    expect(await h.db.cityInsightSnapshot.count()).toBe(1);
  });

  it('1ʳᵉ sortie vécue d’une filleule → prochaine sortie du parrain offerte (REFERRAL_FREE), ≤ 1 par mois, jamais deux en attente', async () => {
    const g = h.app.get<EconomyGraph>(ECONOMY_GRAPH);
    const uow = h.app.get<UnitOfWork>(UNIT_OF_WORK);
    const consumer = h.app.get<any[]>(ECONOMY_OUTBOX_CONSUMERS).find((x) => x.name === 'economy.referral_reward');
    const alex = new TestClient(h);
    await alex.signIn('itv55b');
    const [sarah, nina] = [new TestClient(h), new TestClient(h)];
    await sarah.signIn('itv55c');
    await nina.signIn('itv55d');
    const fire = (referee: string) => uow.run((s: TxScope) => consumer.handle(s, { id: randomUUID(), topic: 'referral.activated', payload: { claimId: randomUUID(), referrerUserId: alex.userId, refereeUserId: referee } }));
    expect((await alex.call('GET', '/v1/me/referral-reward')).body).toEqual({ nextOutingFree: false, thisMonthUsed: false });
    await fire(sarah.userId);
    await fire(sarah.userId); // rejeu : une seule récompense
    await fire(nina.userId); // 2ᵉ filleule le même mois : rien de plus
    expect(await h.db.referralReward.count({ where: { referrerUserId: alex.userId } })).toBe(1);
    expect((await alex.call('GET', '/v1/me/referral-reward')).body).toEqual({ nextOutingFree: true, thisMonthUsed: true });
    // Financement de sa prochaine place : après la 1ʳᵉ offerte, avant le paiement ; une seule fois.
    const fund = (seatId: string) =>
      uow.run(async (s: TxScope) => {
        await s.lock.users([alex.userId]);
        return g.payments.seatFunding.fund(s, { userId: alex.userId, seatId, outingId: uuidv7(), mode: 'AUTO', freeFirstAvailable: false });
      });
    const [r1, r2] = await Promise.all([fund(uuidv7()), fund(uuidv7())]);
    expect([r1, r2].filter((r) => r.kind === 'FUNDED' && r.funding === 'REFERRAL_FREE')).toHaveLength(1);
    expect((await alex.call('GET', '/v1/me/referral-reward')).body.nextOutingFree).toBe(false);
    // Aucune pièce V4 n'est plus versée pour un parrainage.
    expect(await h.db.ledgerEntry.count({ where: { reason: { in: ['REFERRAL_REFERRER', 'REFERRAL_REFEREE'] } } })).toBe(0);
  });
});
