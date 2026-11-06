/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * Histoire 5 (V5) — Économie : Maya achète puis se fait rembourser. Remplace la version V4 (pièces, gels,
 * boost, bénéfices mensuels — retirés par D-020, 410). Même intention, en V5 (§6, D-040 → D-043), via
 * le fournisseur de démonstration LOCAL_DEMO (aucun appel payant) :
 *  - produits V5 honnêtes (place 4,99 € conso non incluse, 1ʳᵉ offerte, Blowy+ 9,99 €), aucun pack de pièces ;
 *  - triche : un /purchases/sync forgé n'accorde rien ;
 *  - achat d'une place (4,99 €) avec double tap / renvoi de la même commande : payée une seule fois ;
 *  - annulation AVANT la confirmation (J-1 18 h) : remboursement CARTE intégral, une seule fois — jamais un
 *    crédit 90 j (D-042) ; sa 1ʳᵉ sortie offerte reste disponible ;
 *  - Blowy+ (V5.4 : abonnement aux sorties, démo) : droit V5 `PLUS_INCLUDED_OUTINGS` ; quota hebdo
 *    inchangé ; webhook store refusé sans secret ; expiration : droits retirés, rien d'autre ne bouge ;
 *  - pièces, gels, boost, accessoires vendus : 410 RETIRED_IN_V5.
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { type Person, publicCall } from './support/actor.js';
import { story } from './support/story.js';
import { startWorld, WEBHOOK_AUTH, type World } from './support/world.js';
import { at, city, CYCLE, request, v5Person, week, type City } from './support/v5.js';

let w: World;
let c: City;
let maya: Person;
let others: Person[] = [];
let outingId = '';
const S = story('economie', 'V5 : place payée, remboursement carte avant la confirmation, Blowy+ en achat intégré (démo), V4 retiré');

const sub = async () => (await maya.call('GET', '/v1/subscriptions/me')).data as any;
const allowances = async () => (await maya.call('GET', '/v1/me/allowances')).data as any;
const journal = (kind: string) => w.db.domainEvent.findMany({ where: { aggregateType: 'economy.journal', type: kind, actorUserId: maya.userId } });

beforeAll(async () => {
  w = await startWorld('J_ECONOMIE', CYCLE.monday);
  c = await city(w, { slug: 'j-paris-eco', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

describe('Économie (V5)', () => {
  S.step('Maya s’inscrit : pas d’abonnement ; produits V5 (place 4,99 €, 1ʳᵉ offerte, Blowy+), aucun pack de pièces', async () => {
    maya = await v5Person(w, { key: 'maya', displayName: 'Maya', gender: 'WOMAN', seeking: [], looking: 'FRIENDS', petName: 'Moka' }, c);
    expect((await sub()).state).toBe('NONE');
    expect((await sub()).v5Entitlements).toEqual([]);
    const prods = (await maya.call('GET', '/v1/purchases/products')).data;
    expect(prods).toMatchObject({ seat: { amountCents: 499, currency: 'EUR', consumptionIncluded: false, firstOutingFree: true }, plus: { monthlyPriceCents: 999, includesAllOutings: true, duoUnlimited: false, billing: 'STRIPE_BILLING' }, duo: { freeMaxActive: 3 } });
    expect(prods.products.some((p: any) => p.kind === 'CONSUMABLE_COINS')).toBe(false);
    expect(await allowances()).toMatchObject({ firstOutingFree: true, duos: { maxActive: 3 }, plus: { active: false } });
  });

  S.step('Triche : un /purchases/sync avec un corps forgé n’accorde rien', async () => {
    const r = await maya.call('POST', '/v1/purchases/sync', { entitlements: ['blowy_plus'], coins: 99999 });
    expect(r.ok).toBe(true);
    expect((await sub()).entitlements).toHaveLength(0);
    expect((await sub()).v5Entitlements).toEqual([]);
  });

  S.step('Maya et quatre voisin·es demandent une sortie ; composition du mardi', async () => {
    const specs = [
      ['eco.lou', 'Lou', 'WOMAN'],
      ['eco.ben', 'Ben', 'MAN'],
      ['eco.ines', 'Inès', 'WOMAN'],
      ['eco.tom', 'Tom', 'MAN'],
    ] as const;
    others = [];
    for (const [k, n, g] of specs) others.push(await v5Person(w, { key: k, displayName: n, gender: g, seeking: [], looking: 'FRIENDS', petName: `Pet-${n}` }, c));
    await at(w, CYCLE.monday);
    for (const p of [maya, ...others]) expect((await request(p)).ok, p.name).toBe(true);
    await at(w, CYCLE.composed);
    await w.runJob('outings.compose');
    outingId = S.need((await week(maya)).data.myOutingId, 'sortie composée');
  });

  S.step('Maya paie sa place 4,99 € (mode PAY, démo) avec double tap puis renvoi : payée une seule fois', async () => {
    const key = randomUUID();
    const [a, b] = await Promise.all([maya.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'PAY' }, key), maya.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'PAY' }, key)]);
    expect([a, b].some((r) => r.ok), JSON.stringify([a.data, b.data])).toBe(true);
    const again = await maya.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'PAY' }, key);
    expect(again.data.seat).toMatchObject({ status: 'CONFIRMED', funding: 'PAID' });
    expect(await journal('PAYMENT_SUCCEEDED')).toHaveLength(1);
    // Personne d'autre ne voit le financement de Maya.
    const seen = (await others[0]!.call('GET', `/v1/outings/${outingId}`)).data;
    expect(JSON.stringify(seen)).not.toMatch(/PAID|paymentRef|local_demo/);
  });

  S.step('Avant la confirmation (J-1 18 h), l’aperçu dit « remboursement carte, pas une absence »', async () => {
    const p = await maya.call('GET', `/v1/outings/${outingId}/seat/cancel-preview`);
    expect(p.data).toEqual({ cancelKind: 'EARLY', refund: 'CARD', countsAsAbsence: false });
  });

  S.step('Maya annule avant la confirmation : carte remboursée intégralement, une seule fois ; aucun crédit 90 j (D-042)', async () => {
    const key = randomUUID();
    const r = await maya.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind: 'CANT_MAKE_IT' }, key);
    expect(r.data).toEqual({ cancelKind: 'EARLY', refund: 'CARD', countsAsAbsence: false });
    await maya.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind: 'CANT_MAKE_IT' }, key);
    await w.runJob('economy.refunds');
    await w.runJob('economy.refunds');
    const seat = await w.db.outingSeat.findFirstOrThrow({ where: { outingId, userId: maya.userId } });
    expect(seat).toMatchObject({ status: 'CANCELLED', cancelKind: 'EARLY', refundState: 'REFUNDED' });
    expect(await journal('REFUND_REQUESTED')).toHaveLength(1);
    expect(await journal('REFUND_SETTLED')).toHaveLength(1);
    expect(await journal('CREDIT_GRANT')).toHaveLength(0);
    expect((await maya.call('GET', '/v1/outing-credits')).data.available).toEqual([{ kind: 'FREE_FIRST', count: 1 }]);
    expect((await maya.call('GET', '/v1/me/reliability')).data).toMatchObject({ total: 0 });
  });

  S.step('Blowy+ (V5.4 : abonnement aux sorties, démo) : droit V5 « toutes les sorties » seulement ; Duo inchangé ; quota hebdo inchangé', async () => {
    const r = await maya.call('POST', '/v1/purchases/local-demo', { action: 'SUBSCRIBE', productId: 'blowy_plus_monthly' });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    const s = await sub();
    expect(s).toMatchObject({ mode: 'LOCAL_DEMO', state: 'ACTIVE' });
    expect(s.v5Entitlements.map((e: any) => e.key).sort()).toEqual(['PLUS_INCLUDED_OUTINGS']);
    expect(await allowances()).toMatchObject({ plus: { active: true }, duos: { maxActive: 3 } });
    // Une sortie par semaine pour tout le monde, abonné·e compris (non achetable) : sa demande de la semaine est
    // déjà placée → 409 même dans la fenêtre de demande.
    await at(w, CYCLE.monday);
    const again = await request(maya);
    expect([again.status, again.data.detailsSafe?.reason]).toEqual([409, 'WEEKLY_QUOTA_USED']);
    await at(w, CYCLE.composed);
  });

  S.step('Webhook store : refusé sans le bon secret ; avec le secret, accepté (idempotent)', async () => {
    const bad = await publicCall(w, 'POST', '/v1/webhooks/revenuecat', { api_version: '1.0', event: { id: randomUUID(), type: 'CANCELLATION', app_user_id: maya.userId } }, { authorization: 'Bearer faux' });
    expect(bad.status).toBe(401);
    const ev = { api_version: '1.0', event: { id: randomUUID(), type: 'TEST', event_timestamp_ms: w.clock.now().getTime(), app_user_id: maya.userId } };
    expect((await publicCall(w, 'POST', '/v1/webhooks/revenuecat', ev, { authorization: WEBHOOK_AUTH })).status).toBe(200);
    expect((await publicCall(w, 'POST', '/v1/webhooks/revenuecat', ev, { authorization: WEBHOOK_AUTH })).status).toBe(200);
  });

  S.step('Pièces, gels, boost, accessoires vendus : 410 RETIRED_IN_V5 (D-020)', async () => {
    const rs = [
      await maya.call('POST', '/v1/purchases/local-demo', { action: 'BUY_COINS', productId: 'coins_500' }),
      await maya.call('POST', '/v1/catalog/scarf_red/purchase', {}),
      await maya.call('POST', '/v1/catalog/visibility_boost/purchase', {}),
      await maya.call('POST', '/v1/streak-freezes/use', {}),
    ];
    expect(rs.map((r) => `${r.status} ${r.data?.detailsSafe?.reason}`)).toEqual(Array(4).fill('410 RETIRED_IN_V5'));
  });

  S.step('Fin de Blowy+ (expiration démo) : droits V5 retirés ; Duo inchangé (3 pour tous) ; rien d’autre ne bouge', async () => {
    const r = await maya.call('POST', '/v1/purchases/local-demo', { action: 'EXPIRE' });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    const s = await sub();
    expect(s.entitlements).toHaveLength(0);
    expect(s.v5Entitlements).toEqual([]);
    expect(await allowances()).toMatchObject({ plus: { active: false }, duos: { maxActive: 3 }, firstOutingFree: true });
  });
});
