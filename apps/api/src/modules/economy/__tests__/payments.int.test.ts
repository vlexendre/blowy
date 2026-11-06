/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * Paiements V5 (T3) — intégration : vraie base, vrai graphe Nest, Stripe sur HTTP SIMULÉ (aucun appel
 * réel), webhooks signés avec la formule HMAC documentée.
 *  - place payée : HELD (hold 15 min) → intention après commit (idempotente) → webhook ×4 (2 concurrents)
 *    → une seule confirmation ; signature invalide → 401 sans enregistrement ;
 *  - paiement après l'échéance du hold → remboursement carte automatique, exécuté une fois (job) ;
 *  - sortie annulée (sous-effectif) → remboursement carte des payées, 1ʳᵉ offerte rendue ;
 *  - annulation après la confirmation = absence, pas de remboursement, pas de compensation si la sortie
 *    n'a pas lieu ;
 *  - crédits : un lot consommé une seule fois sous concurrence ; crédit 90 j après annulation perso.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uuidv7 } from '@blowy/database';
import { onboard, startHarness, TestClient, type Harness } from '../../../../test/integration/harness.js';
import { ECONOMY_GRAPH } from '../economy.module.js';
import { UNIT_OF_WORK, type TxScope, type UnitOfWork } from '../../../shared/application/unit-of-work.js';
import type { EconomyGraph } from '../economy.composition.js';
import { postWebhook, signedEvent, StripeMock } from './stripe-mock.js';

const T = {
  monday: new Date('2026-11-16T09:30:00Z'),
  composed: new Date('2026-11-17T11:01:00Z'),
  locked: new Date('2026-11-18T17:01:00Z'),
  week: '2026-W47',
};
let h: Harness;
let stripe: StripeMock;
let nbId = '';
const MIN = 60_000;

beforeAll(async () => {
  stripe = await new StripeMock().start();
  Object.assign(process.env, stripe.env());
  h = await startHarness(T.monday);
  await h.reset();
  const zone = await h.db.zone.findUniqueOrThrow({ where: { code: 'PARIS_11' } });
  const n = await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-pay-11', name: 'Paris 11e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } });
  nbId = n.id;
  await h.db.neighborhoodSlotTemplate.create({ data: { neighborhoodId: n.id, isoWeekday: 4, localMinute: 19 * 60 + 30, activity: 'GAMES' } });
  await h.db.venue.create({ data: { neighborhoodId: n.id, name: 'Café Pay', addressLine: '1 rue IT', postalCode: '75011', city: 'Paris', lat: 48.8649, lng: 2.3707, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 3, accessibilityTags: [], checkinSecretRef: 'it-pay' } });
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
const journal = (kind: string) => h.db.domainEvent.findMany({ where: { aggregateType: 'economy.journal', type: kind } });

describe('paiements V5 (Stripe simulé)', () => {
  let ps: TestClient[] = [];
  let outingId = '';

  it('composition d’une sortie de 5', async () => {
    ps = [await person('pay1', 'WOMAN'), await person('pay2', 'MAN'), await person('pay3', 'WOMAN'), await person('pay4', 'MAN'), await person('pay5', 'WOMAN')];
    h.clock.set(T.monday);
    for (const p of ps) expect((await p.call('PUT', `/v1/outings/requests/${T.week}`, {})).status).toBe(200);
    h.clock.set(T.composed);
    await runJob('outings.compose');
    outingId = (await ps[0]!.call('GET', '/v1/outings/week')).body.myOutingId;
    expect(outingId).toBeTruthy();
  });

  it('place payée : HELD + intention créée après commit, double tap idempotent (une seule intention)', async () => {
    const [p1] = ps as [TestClient];
    const key = randomUUID();
    const a = await p1.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'PAY' }, { commandId: key });
    expect(a.status, JSON.stringify(a.body)).toBe(200);
    expect(a.body.seat.status).toBe('HELD');
    expect(new Date(a.body.seat.holdExpiresAt).getTime() - T.composed.getTime()).toBe(15 * MIN);
    expect(a.body.payment).toMatchObject({ provider: 'STRIPE', amountCents: 499, currency: 'EUR' });
    const b = await p1.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'PAY' }, { commandId: key });
    expect(b.body.payment.clientSecret).toBe(a.body.payment.clientSecret);
    const intents = stripe.calledOn('/v1/payment_intents');
    expect(new Set(intents.map((c) => c.idempotencyKey))).toEqual(new Set([`seat:${(await seatOf(outingId, p1)).id}`]));
    expect(stripe.intents.size).toBe(1);
    // Le secret client n'est jamais stocké en base.
    expect(JSON.stringify(await h.db.domainEvent.findMany({ where: { aggregateType: 'economy.journal' } }))).not.toContain('_secret_');
  });

  it('webhook : signature invalide → 401 sans enregistrement ; succès rejoué ×4 (dont 2 concurrents) → une confirmation', async () => {
    const [p1] = ps as [TestClient];
    const piId = [...stripe.intents.keys()][0]!;
    const forged = signedEvent({ id: 'evt_forged', type: 'payment_intent.succeeded', at: h.clock.now(), object: { id: piId }, secret: 'whsec_attacker_secret_123456' });
    const bad = await postWebhook(h.baseUrl, forged);
    expect(bad.status).toBe(401);
    expect(bad.body?.detailsSafe?.reason).toBe('WEBHOOK_SIGNATURE_INVALID');
    expect(await h.db.providerWebhookEvent.count({ where: { providerEventId: 'evt_forged' } })).toBe(0);
    const ev = stripe.succeeded(piId, h.clock.now());
    const [r1, r2] = await Promise.all([postWebhook(h.baseUrl, ev), postWebhook(h.baseUrl, ev)]);
    const r3 = await postWebhook(h.baseUrl, ev);
    const r4 = await postWebhook(h.baseUrl, ev);
    expect([r1.status, r2.status, r3.status, r4.status].filter((s) => s === 200).length).toBeGreaterThanOrEqual(3);
    expect(r4.body?.status).toBe('DUPLICATE');
    const seat = await seatOf(outingId, p1);
    expect(seat).toMatchObject({ status: 'CONFIRMED', funding: 'PAID', paymentRef: piId });
    expect((await journal('PAYMENT_SUCCEEDED')).length).toBe(1);
    // client_secret expurgé du journal des webhooks.
    expect(JSON.stringify((await h.db.providerWebhookEvent.findFirstOrThrow({ where: { providerEventId: `evt_${piId}_ok` } })).payload)).not.toContain('_secret_mock');
  });

  it('paiement après l’échéance du hold → place rendue, remboursement carte automatique exécuté une seule fois', async () => {
    const p2 = ps[1]!;
    const a = await p2.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'PAY' });
    expect(a.body.seat.status).toBe('HELD');
    const piId = [...stripe.intents.keys()][1]!;
    h.clock.set(new Date(T.composed.getTime() + 16 * MIN));
    expect((await postWebhook(h.baseUrl, stripe.succeeded(piId, h.clock.now()))).status).toBe(200);
    expect(await seatOf(outingId, p2)).toMatchObject({ status: 'CANCELLED', cancelKind: 'SYSTEM_REMOVAL', refundState: 'PENDING', paymentRef: piId });
    await runJob('economy.refunds');
    await runJob('economy.refunds');
    const refunds = stripe.calledOn('/v1/refunds');
    expect(refunds).toHaveLength(1);
    expect(refunds[0]!.idempotencyKey).toBe(`refund:${(await seatOf(outingId, p2)).id}`);
    expect(refunds[0]!.params.get('payment_intent')).toBe(piId);
    expect(refunds[0]!.params.get('amount')).toBe('499');
    expect(await seatOf(outingId, p2)).toMatchObject({ refundState: 'REFUNDED' });
  });

  it('1ʳᵉ sortie offerte, puis annulation après la confirmation = absence ; la sortie tombe sous 3 → remboursements', async () => {
    const [p1, , p3, p4, p5] = ps as [TestClient, TestClient, TestClient, TestClient, TestClient];
    for (const p of [p3, p4, p5]) expect((await p.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'AUTO' })).body.seat.funding).toBe('FREE_FIRST');
    h.clock.set(T.locked);
    await runJob('outings.lifecycle');
    expect((await h.db.outing.findUniqueOrThrow({ where: { id: outingId } })).status).toBe('CONFIRMED');
    // V5.3 B.6 : après la confirmation (veille 18 h), annuler = absence, sans remboursement.
    const c3 = await p3.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind: 'CANT_MAKE_IT' });
    expect(c3.body).toEqual({ cancelKind: 'LATE', refund: 'NONE', countsAsAbsence: true });
    const c4 = await p4.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind: 'CANT_MAKE_IT' });
    expect(c4.body.countsAsAbsence).toBe(true);
    await h.drain();
    // 2 confirmés (< 3) avant startsAt − 3 h : la sortie n'a pas lieu.
    expect((await h.db.outing.findUniqueOrThrow({ where: { id: outingId } })).status).toBe('CANCELLED');
    expect(await seatOf(outingId, p1)).toMatchObject({ status: 'CANCELLED', refundState: 'PENDING' });
    expect(await seatOf(outingId, p5)).toMatchObject({ status: 'CANCELLED', refundState: 'RECREDITED' });
    await runJob('economy.refunds');
    expect(await seatOf(outingId, p1)).toMatchObject({ refundState: 'REFUNDED' });
    expect(stripe.calledOn('/v1/refunds')).toHaveLength(2);
    // La 1ʳᵉ offerte est rendue à p5, pas à p3 (absence).
    expect((await p5.call('GET', '/v1/outing-credits')).body.available).toEqual([{ kind: 'FREE_FIRST', count: 1 }]);
    expect((await p3.call('GET', '/v1/outing-credits')).body.available).toEqual([]);
    // Pas de compensation lieu : la sortie n'a pas eu lieu.
    expect(await journal('VENUE_COMPENSATION')).toHaveLength(0);
  });

  it('crédits (dépréciés, D-042) : un ancien lot rendu redevient un lot 90 j ; un lot consommé une seule fois sous concurrence', async () => {
    const g = h.app.get<EconomyGraph>(ECONOMY_GRAPH);
    const uow = h.app.get<UnitOfWork>(UNIT_OF_WORK);
    const u = ps[0]!;
    const fakeSeat = uuidv7();
    const run = <T>(f: (s: TxScope) => Promise<T>) => uow.run(f);
    // D-042 : une place payée n'est plus jamais transformée en crédit ; seul un ancien lot consommé est rendu.
    expect(await run((s) => g.payments.seatFunding.refundCredit(s, { userId: u.userId, seatId: fakeSeat, funding: 'CREDIT', cause: 'OUTING_CANCELLED' }))).toBe('RECREDITED');
    // p1 a payé sa place (mode PAY) : sa 1ʳᵉ sortie offerte reste disponible, à côté du crédit.
    const credits = (await u.call('GET', '/v1/outing-credits')).body.available;
    expect(credits.map((c: any) => c.kind)).toEqual(['FREE_FIRST', 'REFUND_CREDIT']);
    expect(credits[1]).toMatchObject({ kind: 'REFUND_CREDIT', count: 1 });
    expect(new Date(credits[1].expiresAt).getTime() - h.clock.now().getTime()).toBe(90 * 86_400_000);
    // Deux consommations concurrentes (verrou users) : une seule obtient le crédit, l'autre doit payer.
    const fund = (seatId: string) => run(async (s) => {
      await s.lock.users([u.userId]);
      return g.payments.seatFunding.fund(s, { userId: u.userId, seatId, outingId: uuidv7(), mode: 'AUTO', freeFirstAvailable: false });
    });
    const res = await Promise.all([fund(uuidv7()), fund(uuidv7())]);
    expect(res.map((r) => (r.kind === 'FUNDED' ? r.funding : r.kind)).sort()).toEqual(['CREDIT', 'HOLD']);
    expect((await u.call('GET', '/v1/outing-credits')).body.available).toEqual([{ kind: 'FREE_FIRST', count: 1 }]);
    expect((await u.call('GET', '/v1/me/allowances')).body).toMatchObject({ firstOutingFree: true, plus: { active: false }, duos: { maxActive: 1 }, credits: 0, provider: 'STRIPE' });
  });
});
