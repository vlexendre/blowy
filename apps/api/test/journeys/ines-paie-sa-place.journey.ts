/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 T3 — économie : « Inès paie sa place » (J7, + volets J8 et D-020, amendés V5.3 B.6 / C.10–C.11).
 * Stripe est SIMULÉ en HTTP (aucun appel réel) ; les webhooks sont signés avec la formule HMAC
 * documentée. Cinq personnes à Paris 11e :
 *  - Inès : 1ʳᵉ sortie offerte ; Hugo et Ben paient 4,99 € (hold 15 min, Apple Pay/PaymentSheet) ;
 *  - le webhook de Hugo est rejoué ×3 → une seule confirmation ; un webhook forgé est refusé ;
 *  - Ana paie après l'échéance du hold → place rendue, remboursement carte automatique (une fois) ;
 *  - après la confirmation (veille 18 h) Cléo annule → absence, rien n'est remboursé ;
 *  - Ben ne vient pas → absence ; compensation lieu : prix de la place payée (4,99 €) pour Ben, 3 € versés
 *    par Blowy pour la place offerte de Cléo ;
 *  - personne ne voit jamais le financement d'un·e autre ; Blowy+ s'achète en app (démo locale) :
 *    duos illimités, sortie suivante incluse ; boost/gels/pièces/accessoires vendus → 410.
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import type { Person } from './support/actor.js';
import { story } from './support/story.js';
import { MIN, startWorld, type World } from './support/world.js';
import { at, checkIn, city, CYCLE, leaksIn, outing, request, v5Person, week, type City } from './support/v5.js';
import { postWebhook, signedEvent, StripeMock } from '../../src/modules/economy/__tests__/stripe-mock.js';

let w: World;
let c: City;
let stripe: StripeMock;
let [ines, hugo, ana, ben, cleo]: Person[] = [];
let outingId = '';
const S = story('v5-ines-paie-sa-place', 'V5 T3 : place payée, remboursements, absence, compensation lieu, Blowy+ en app');

const accept = (p: Person, funding: 'AUTO' | 'PAY', key?: string) => p.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding }, key);
const piOf = (p: Person) => [...stripe.intents.entries()].find(([, v]) => v.metadata.userId === p.userId)?.[0];
const seat = (p: Person) => w.db.outingSeat.findFirstOrThrow({ where: { outingId, userId: p.userId } });

beforeAll(async () => {
  stripe = await new StripeMock().start();
  Object.assign(process.env, stripe.env());
  w = await startWorld('J_V5_PAY', CYCLE.monday);
  c = await city(w, { slug: 'j-paris-pay', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => {
  await w?.close();
  await stripe?.close();
  for (const k of Object.keys(stripe?.env() ?? {})) delete process.env[k];
});

describe('Inès paie sa place', () => {
  S.step('Cinq personnes demandent une sortie et sont composées ensemble', async () => {
    const specs = [
      ['ines', 'Inès', 'WOMAN', 'Myrtille'],
      ['hugo', 'Hugo', 'MAN', 'Moka'],
      ['ana', 'Ana', 'WOMAN', 'Luna'],
      ['ben', 'Ben', 'MAN', 'Réglisse'],
      ['cleo', 'Cléo', 'WOMAN', 'Praline'],
    ] as const;
    const people: Person[] = [];
    for (const [k, n, g, pet] of specs) people.push(await v5Person(w, { key: `v5pay.${k}`, displayName: n, gender: g, seeking: [], looking: 'FRIENDS', petName: pet }, c));
    [ines, hugo, ana, ben, cleo] = people;
    await at(w, CYCLE.monday);
    for (const p of people) expect((await request(p)).ok).toBe(true);
    await at(w, CYCLE.composed);
    await w.runJob('outings.compose');
    outingId = S.need((await week(ines!)).data.myOutingId, 'sortie composée');
    const products = (await ines!.call('GET', '/v1/purchases/products')).data;
    expect(products).toMatchObject({ seat: { amountCents: 499, currency: 'EUR', consumptionIncluded: false, firstOutingFree: true }, plus: { monthlyPriceCents: 999, includesAllOutings: true, duoUnlimited: true }, provider: 'STRIPE', duo: { freeMaxActive: 1 } });
    expect(products.products.some((p: any) => p.kind === 'CONSUMABLE_COINS')).toBe(false);
  });

  S.step('Inès dit « Je viens » : sa 1ʳᵉ sortie est offerte, aucun paiement', async () => {
    expect((await ines!.call('GET', '/v1/me/allowances')).data).toMatchObject({ firstOutingFree: true, duos: { maxActive: 1 }, provider: 'STRIPE' });
    const r = await accept(ines!, 'AUTO');
    expect(r.data.seat).toEqual({ status: 'CONFIRMED', funding: 'FREE_FIRST' });
    expect(r.data.payment).toBeUndefined();
    expect(stripe.calledOn('/v1/payment_intents')).toHaveLength(0);
  });

  S.step('Hugo paie 4,99 € : place réservée 15 min, intention Stripe unique malgré le double tap', async () => {
    const key = crypto.randomUUID();
    const [a, b] = await Promise.all([accept(hugo!, 'PAY', key), accept(hugo!, 'PAY', key)]);
    const ok = [a, b].filter((r) => r.ok);
    expect(ok.length).toBeGreaterThanOrEqual(1);
    const r = ok[0]!;
    expect(r.data.seat.status).toBe('HELD');
    expect(new Date(r.data.seat.holdExpiresAt).getTime() - CYCLE.composed.getTime()).toBe(15 * MIN);
    expect(r.data.payment).toMatchObject({ provider: 'STRIPE', amountCents: 499, currency: 'EUR' });
    expect(stripe.intents.size).toBe(1);
    expect(stripe.intents.get(piOf(hugo!)!)).toMatchObject({ amount: 499, currency: 'eur', metadata: { purpose: 'SEAT', userId: hugo!.userId } });
  });

  S.step('Un webhook forgé est refusé (401, rien enregistré) ; le vrai, rejoué ×3, confirme Hugo une seule fois', async () => {
    const pi = S.need(piOf(hugo!), 'intention de Hugo');
    const forged = await postWebhook(w.baseUrl, signedEvent({ id: 'evt_forge', type: 'payment_intent.succeeded', at: w.clock.now(), object: { id: pi }, secret: 'whsec_pas_le_bon_secret_123' }));
    expect(forged.status).toBe(401);
    expect(await w.db.providerWebhookEvent.count({ where: { providerEventId: 'evt_forge' } })).toBe(0);
    const ev = stripe.succeeded(pi, w.clock.now());
    const statuses = [];
    for (let i = 0; i < 3; i++) statuses.push((await postWebhook(w.baseUrl, ev)).body?.status);
    expect(statuses).toEqual(['ACCEPTED', 'DUPLICATE', 'DUPLICATE']);
    await w.drain();
    expect(await seat(hugo!)).toMatchObject({ status: 'CONFIRMED', funding: 'PAID', paymentRef: pi });
    // Base partagée entre parcours (ordre d'exécution variable) : on compte les écritures de CE paiement.
    expect(await w.db.domainEvent.count({ where: { aggregateType: 'economy.journal', type: 'PAYMENT_SUCCEEDED', payload: { path: ['refs', 'providerPaymentId'], equals: pi } } })).toBe(1);
    expect((await hugo!.phone.waitFor((e) => e.type === 'outing.seat_updated' && (e.payload as any)?.seat?.status === 'CONFIRMED', 1500))).toBeTruthy();
  });

  S.step('Ana paie trop tard (hold échu) : place rendue et remboursée automatiquement, une seule fois', async () => {
    expect((await accept(ana!, 'PAY')).data.seat.status).toBe('HELD');
    await at(w, new Date(CYCLE.composed.getTime() + 16 * MIN));
    expect((await postWebhook(w.baseUrl, stripe.succeeded(S.need(piOf(ana!), 'intention d’Ana'), w.clock.now()))).status).toBe(200);
    expect(await seat(ana!)).toMatchObject({ status: 'CANCELLED', refundState: 'PENDING' });
    await w.runJob('economy.refunds');
    await w.runJob('economy.refunds');
    expect(stripe.calledOn('/v1/refunds')).toHaveLength(1);
    expect(await seat(ana!)).toMatchObject({ refundState: 'REFUNDED' });
    expect((await outing(ana!, outingId)).data.members).toEqual([]);
  });

  S.step('Ben paie à temps, Cléo prend sa 1ʳᵉ offerte ; personne ne voit le financement des autres', async () => {
    expect((await accept(ben!, 'PAY')).data.seat.status).toBe('HELD');
    expect((await postWebhook(w.baseUrl, stripe.succeeded(S.need(piOf(ben!), 'intention de Ben'), w.clock.now()))).status).toBe(200);
    expect((await accept(cleo!, 'AUTO')).data.seat.funding).toBe('FREE_FIRST');
    await w.drain();
    for (const p of [ines!, hugo!, ben!, cleo!]) {
      const v = (await outing(p, outingId)).data;
      expect(v.status).toBe('FORMING');
      expect(leaksIn(v.members, ['PAID', 'FREE_FIRST', 'funding', 'pi_mock', 'clientSecret'])).toEqual([]);
    }
  });

  S.step('Confirmation la veille 18 h ; Cléo annule ensuite → absence, rien de remboursé (V5.3 B.6)', async () => {
    await at(w, CYCLE.locked);
    await w.runJob('outings.lifecycle');
    expect((await outing(ines!, outingId)).data.status).toBe('CONFIRMED');
    expect((await cleo!.call('GET', `/v1/outings/${outingId}/seat/cancel-preview`)).data).toEqual({ cancelKind: 'LATE', refund: 'NONE', countsAsAbsence: true });
    expect((await cleo!.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind: 'CANT_MAKE_IT' })).data.countsAsAbsence).toBe(true);
    await w.drain();
    expect(await seat(cleo!)).toMatchObject({ status: 'CANCELLED', cancelKind: 'LATE', refundState: 'NOT_ELIGIBLE' });
    expect((await cleo!.call('GET', '/v1/outing-credits')).data.available).toEqual([]);
  });

  S.step('Ben ne vient pas : absence ; le lieu reçoit 4,99 € pour Ben (payée) et 3 € de Blowy pour Cléo (offerte)', async () => {
    await at(w, CYCLE.checkin);
    await w.runJob('outings.lifecycle');
    expect((await checkIn(ines!, outingId)).ok).toBe(true);
    expect((await checkIn(hugo!, outingId)).ok).toBe(true);
    await at(w, CYCLE.done);
    await w.runJob('outings.lifecycle');
    expect(await seat(ben!)).toMatchObject({ status: 'NO_SHOW', refundState: 'NONE' });
    const comp = await w.db.domainEvent.findMany({ where: { aggregateType: 'economy.journal', type: 'VENUE_COMPENSATION' } });
    const mine = comp.map((e) => e.payload as any).filter((p) => p.account === `venue:${c.venueId}`);
    expect(mine.map((p) => [p.refs.cause, p.refs.basis, p.amount]).sort()).toEqual([
      ['LATE_CANCEL', 'FREE_SEAT', 300],
      ['NO_SHOW', 'SEAT_PRICE', 499],
    ]);
    // Rejouer l'outbox n'écrit rien de plus (une compensation par place).
    await w.drain();
    expect(await w.db.domainEvent.count({ where: { aggregateType: 'economy.journal', type: 'VENUE_COMPENSATION' } })).toBe(comp.length);
  });

  S.step('Hugo prend Blowy+ dans l’app (démo locale) : duos illimités ; Inès reste à 1 duo actif', async () => {
    const r = await hugo!.call('POST', '/v1/subscriptions/plus/checkout');
    expect(r.data).toMatchObject({ provider: 'LOCAL_DEMO' });
    expect((await hugo!.call('GET', '/v1/me/allowances')).data).toMatchObject({ plus: { active: true, includesAllOutings: true, duoUnlimited: true }, duos: { maxActive: null } });
    expect((await hugo!.call('POST', '/v1/subscriptions/plus/checkout')).data.detailsSafe.reason).toBe('PLUS_ALREADY_ACTIVE');
    expect((await ines!.call('GET', '/v1/me/allowances')).data).toMatchObject({ firstOutingFree: false, plus: { active: false }, duos: { maxActive: 1 } });
  });

  S.step('Ce qui disparaît en V5 répond 410 : gels, boost, accessoires vendus, packs de pièces', async () => {
    for (const r of [
      await ines!.call('POST', '/v1/catalog/streak_freeze/purchase'),
      await ines!.call('POST', '/v1/catalog/visibility_boost/purchase'),
      await ines!.call('POST', '/v1/catalog/scarf_red/purchase'),
      await ines!.call('POST', '/v1/streak-freezes/use'),
      await ines!.call('POST', '/v1/purchases/local-demo', { action: 'BUY_COINS', productId: 'coins_500' }),
    ]) {
      expect(r.status).toBe(410);
      expect(r.data.detailsSafe.reason).toBe('RETIRED_IN_V5');
    }
  });
});
