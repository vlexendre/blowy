/**
 * V5.10 (jury tour 11) — activités payantes PRÉPAYÉES dans l'app avec la place, intégration (vraie base, vrai
 * graphe Nest, Stripe sur HTTP SIMULÉ, webhooks signés) :
 *  - `activityDetail.priceCents` (TTC, prix du lieu) servi dès la proposition ;
 *  - paiement Stripe = place (si due) + activité ; une place offerte (1ʳᵉ sortie) garde son financement et ne paie
 *    que l'activité ;
 *  - annulation avant la confirmation → activité remboursée (une fois), 1ʳᵉ sortie rendue ;
 *  - Blowy annule (groupe incomplet à la confirmation) → activités remboursées ;
 *  - reversement au lieu pour chaque place confirmée, honorée ou non (absence, annulation tardive), TTC par
 *    défaut ; ligne « activités » du relevé ; la compensation d'une place payée n'inclut pas l'activité.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uuidv7 } from '@blowy/database';
import { onboard, startHarness, TestClient, type Harness } from '../../../../test/integration/harness.js';
import { VenuePartnerUseCases, type VenuePartnerContext } from '../../admin/application/use-cases/venue-partner.use-cases.js';
import { postWebhook, StripeMock } from './stripe-mock.js';

const T = {
  monday: new Date('2026-11-16T09:30:00Z'),
  composed: new Date('2026-11-17T11:01:00Z'),
  locked: new Date('2026-11-18T17:01:00Z'),
  week: '2026-W47',
};
let h: Harness;
let stripe: StripeMock;
let nbId = '';
let venueId = '';

beforeAll(async () => {
  stripe = await new StripeMock().start();
  Object.assign(process.env, stripe.env());
  h = await startHarness(T.monday);
  await h.reset();
  const zone = await h.db.zone.findUniqueOrThrow({ where: { code: 'PARIS_11' } });
  nbId = (await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-act-11', name: 'Paris 11e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } })).id;
  await h.db.neighborhoodSlotTemplate.create({ data: { neighborhoodId: nbId, isoWeekday: 4, localMinute: 19 * 60 + 30, activity: 'GAMES' } });
  // Jeux de société facturés par le lieu : 15 € TTC par personne, prépayés avec la place.
  venueId = (await h.db.venue.create({ data: { neighborhoodId: nbId, name: 'Ludo Café', addressLine: '1 rue IT', postalCode: '75011', city: 'Paris', lat: 48.8649, lng: 2.3707, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 3, accessibilityTags: [], checkinSecretRef: 'it-act', activityDetailKey: 'board_games', activityPriceCents: 1500 } })).id;
});
afterAll(async () => {
  await h?.close();
  await stripe?.close();
});

const runJob = async (name: string) => {
  const j = h.worker.jobs.find((x) => x.name === name);
  if (!j) throw new Error(`job ${name}`);
  const r = await j.run(h.clock.now());
  await h.drain();
  return r;
};

async function person(key: string, gender: 'WOMAN' | 'MAN') {
  h.clock.set(T.monday);
  const c = new TestClient(h);
  await onboard(c, key, { gender, seeking: [] });
  expect((await c.call('PUT', '/v1/me/neighborhood', { neighborhoodId: nbId })).status).toBe(200);
  expect((await c.call('PUT', '/v1/preferences/intentions', { lookingFor: 'FRIENDS', storySeriousness: null, kidsSomeday: null, meetingMode: 'GROUP', meetGenders: [], romanceGenders: [] })).status).toBe(200);
  await h.db.mediaAsset.create({ data: { ownerUserId: c.userId, purpose: 'PROFILE_PHOTO', status: 'READY', storageKey: `it/${key}.jpg`, retentionClass: 'PROFILE_PHOTO', finalizedAt: T.monday } });
  return c;
}

const seatOf = (outingId: string, c: TestClient) => h.db.outingSeat.findFirstOrThrow({ where: { outingId, userId: c.userId } });
const journal = async (kind: string) => (await h.db.domainEvent.findMany({ where: { aggregateType: 'economy.journal', type: kind } })).map((e) => JSON.stringify(e.payload));
const piOf = (seatId: string) => [...stripe.intents].find(([, v]) => v.metadata.seatId === seatId)![0];

/** Accepte (Stripe : HELD + intention), vérifie le montant, puis le webhook signé confirme la place. */
async function acceptAndPay(c: TestClient, outingId: string, funding: 'AUTO' | 'PAY', amountCents: number) {
  const a = await c.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding });
  expect(a.status, JSON.stringify(a.body)).toBe(200);
  expect(a.body.seat.status).toBe('HELD');
  expect(a.body.payment).toMatchObject({ provider: 'STRIPE', amountCents, activityCents: 1500, currency: 'EUR' });
  const seat = await seatOf(outingId, c);
  expect((await postWebhook(h.baseUrl, stripe.succeeded(piOf(seat.id), h.clock.now()))).status).toBe(200);
  return seatOf(outingId, c);
}

describe('V5.10 — activité prépayée avec la place (Stripe simulé)', () => {
  let ps: TestClient[] = [];
  let outingId = '';

  it('prix de l’activité servi dès la proposition (TTC, prix du lieu)', async () => {
    ps = [await person('act1', 'WOMAN'), await person('act2', 'MAN'), await person('act3', 'WOMAN'), await person('act4', 'MAN'), await person('act5', 'WOMAN')];
    h.clock.set(T.monday);
    for (const p of ps) expect((await p.call('PUT', `/v1/outings/requests/${T.week}`, {})).status).toBe(200);
    h.clock.set(T.composed);
    await runJob('outings.compose');
    outingId = (await ps[0]!.call('GET', '/v1/outings/week')).body.myOutingId;
    const v = (await ps[0]!.call('GET', `/v1/outings/${outingId}`)).body;
    expect(v.activityDetail).toMatchObject({ key: 'board_games', label: 'Jeux de société', priceCents: 1500 });
  });

  it('place payée : place + activité en un paiement ; 1ʳᵉ offerte : activité seule, la place reste offerte', async () => {
    const [p1, p2, p3, p4, p5] = ps as [TestClient, TestClient, TestClient, TestClient, TestClient];
    expect(await acceptAndPay(p1, outingId, 'PAY', 499 + 1500)).toMatchObject({ status: 'CONFIRMED', funding: 'PAID' });
    for (const p of [p2, p3, p4, p5]) expect(await acceptAndPay(p, outingId, 'AUTO', 1500)).toMatchObject({ status: 'CONFIRMED', funding: 'FREE_FIRST' });
    expect(new Set([...stripe.intents.values()].map((i) => i.amount))).toEqual(new Set([1999, 1500]));
  });

  it('annulation avant la confirmation : activité remboursée une fois, 1ʳᵉ sortie rendue', async () => {
    const p3 = ps[2]!;
    const c = await p3.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind: 'CANT_MAKE_IT' });
    expect(c.body).toMatchObject({ cancelKind: 'EARLY', countsAsAbsence: false });
    expect(await seatOf(outingId, p3)).toMatchObject({ status: 'CANCELLED', funding: 'FREE_FIRST', refundState: 'PENDING' });
    await runJob('economy.refunds');
    await runJob('economy.refunds');
    const refunds = stripe.calledOn('/v1/refunds');
    expect(refunds.map((r) => r.params.get('amount'))).toEqual(['1500']);
    expect(await seatOf(outingId, p3)).toMatchObject({ refundState: 'REFUNDED' });
    expect((await p3.call('GET', '/v1/outing-credits')).body.available).toEqual([{ kind: 'FREE_FIRST', count: 1 }]);
  });

  it('honorée ou non : activité reversée au lieu (TTC) ; ligne « activités » du relevé ; compensation hors activité', async () => {
    const p4 = ps[3]!;
    h.clock.set(T.locked);
    await runJob('outings.lifecycle');
    expect((await h.db.outing.findUniqueOrThrow({ where: { id: outingId } })).status).toBe('CONFIRMED');
    // Annulation tardive (absence) : l'activité n'est pas remboursée, elle est reversée au lieu.
    expect((await p4.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind: 'CANT_MAKE_IT' })).body).toMatchObject({ cancelKind: 'LATE', refund: 'NONE' });
    await h.drain();
    const o = await h.db.outing.findUniqueOrThrow({ where: { id: outingId } });
    h.clock.set(new Date(o.checkinOpensAt.getTime() + 60_000));
    await runJob('outings.lifecycle');
    h.clock.set(new Date(o.checkinClosesAt.getTime() + 60_000));
    await runJob('outings.lifecycle');
    await h.drain();
    expect((await h.db.outing.findUniqueOrThrow({ where: { id: outingId } })).status).toBe('DONE');
    const payouts = await journal('VENUE_ACTIVITY_PAYOUT');
    // p1, p2, p5 (absences au pointage) + p4 (annulation tardive) ; jamais p3 (remboursée).
    expect(payouts).toHaveLength(4);
    for (const p of payouts) expect(p).toMatch(/"amount":1500/);
    for (const p of payouts) expect(p).toMatch(/"taxBasis":"TTC"/);
    expect(payouts.join()).not.toContain((await seatOf(outingId, ps[2]!)).id);
    // Place payée absente : 4,16 € HT (jamais 4,99 + 15 €).
    const p1Seat = (await seatOf(outingId, ps[0]!)).id;
    expect((await journal('VENUE_COMPENSATION')).find((x) => x.includes(p1Seat))).toMatch(/"amount":416/);
    const ctx: VenuePartnerContext = { userId: ps[0]!.userId, sessionId: 'it', displayName: 'Gérante', venueIds: [venueId], sessionExpiresAt: new Date('2027-01-01T00:00:00Z'), requestId: null };
    const st = await h.app.get(VenuePartnerUseCases).statement(ctx, venueId, '2026-11');
    expect(st).toMatchObject({ activitiesTotalCents: 6000, activitiesTaxBasis: 'TTC', taxBasis: 'HT' });
    expect(st.lines.find((l) => l.outingId === outingId)).toMatchObject({ activities: 4, activitiesCents: 6000 });
  });

  it('Blowy annule (groupe incomplet à la confirmation) : activités remboursées, aucun reversement', async () => {
    const people = [await person('act6', 'WOMAN'), await person('act7', 'MAN'), await person('act8', 'WOMAN')];
    const startsAt = new Date('2026-12-03T18:30:00Z');
    const lockAt = new Date('2026-12-02T17:00:00Z');
    const slot = await h.db.venueSlot.create({ data: { venueId, startsAt, activity: 'GAMES', capacityOutings: 3, reservedOutings: 1 } });
    const o = await h.db.outing.create({
      data: {
        neighborhoodId: nbId, weekKey: '2026-W49', venueSlotId: slot.id, venueId, activity: 'GAMES', startsAt, endsAt: new Date(startsAt.getTime() + 2 * 3_600_000), status: 'PROPOSED', capacity: 5,
        composedAt: new Date('2026-11-30T20:00:00Z'), acceptDeadline: new Date('2026-12-01T20:00:00Z'), lockAt, photoRevealAt: new Date(startsAt.getTime() - 3 * 3_600_000),
        checkinOpensAt: new Date(startsAt.getTime() - 30 * 60_000), checkinClosesAt: new Date(startsAt.getTime() + 90 * 60_000), votesCloseAt: new Date(startsAt.getTime() + 74 * 3_600_000), tuningVersion: 'it', algoVersion: 'it',
      },
    });
    for (const p of people) await h.db.outingSeat.create({ data: { outingId: o.id, userId: p.userId, weekKey: '2026-W49', status: 'INVITED', acceptDeadline: o.acceptDeadline, invitedAt: o.composedAt } });
    h.clock.set(new Date('2026-12-01T09:00:00Z'));
    for (const p of people) expect(await acceptAndPay(p, o.id, 'AUTO', 1500)).toMatchObject({ status: 'CONFIRMED', funding: 'FREE_FIRST' });
    const before = stripe.calledOn('/v1/refunds').length;
    h.clock.set(new Date(lockAt.getTime() + 60_000));
    await runJob('outings.lifecycle');
    expect(await h.db.outing.findUniqueOrThrow({ where: { id: o.id } })).toMatchObject({ status: 'CANCELLED', cancelReason: 'UNDERSIZED' });
    for (const p of people) expect(await seatOf(o.id, p)).toMatchObject({ status: 'CANCELLED', refundState: 'PENDING' });
    await runJob('economy.refunds');
    expect(stripe.calledOn('/v1/refunds').slice(before).map((r) => r.params.get('amount'))).toEqual(['1500', '1500', '1500']);
    for (const p of people) expect(await seatOf(o.id, p)).toMatchObject({ refundState: 'REFUNDED' });
    const seatIds = await Promise.all(people.map(async (p) => (await seatOf(o.id, p)).id));
    expect((await journal('VENUE_ACTIVITY_PAYOUT')).filter((x) => seatIds.some((id) => x.includes(id)))).toHaveLength(0);
  });
});
