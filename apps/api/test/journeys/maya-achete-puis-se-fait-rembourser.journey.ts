/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * Histoire 5 — Économie. Maya achète des pièces et Blowy+ via le fournisseur de démonstration
 * LOCAL_DEMO (aucun appel payant), tente de tricher, dépense deux fois en même temps, reçoit
 * ses bénéfices mensuels, puis se fait rembourser (webhook RevenueCat local authentifié).
 * Boost et gel de série sont des mécaniques V4 (supprimées en V5) : vérifiées brièvement.
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Person, publicCall } from './support/actor.js';
import { story } from './support/story.js';
import { DAY, startWorld, WEBHOOK_AUTH, type World } from './support/world.js';

let w: World;
let maya: Person;
const S = story('economie', 'Économie : achat démo, triche, dépenses concurrentes, remboursement');

beforeAll(async () => {
  w = await startWorld('J_ECONOMIE');
});
afterAll(async () => w?.close());

const wallet = async () => (await maya.call('GET', '/v1/wallet')).data as any;
const sub = async () => (await maya.call('GET', '/v1/subscriptions/me')).data as any;
const hook = (event: Record<string, unknown>) =>
  publicCall(w, 'POST', '/v1/webhooks/revenuecat', { api_version: '1.0', event: { id: randomUUID(), event_timestamp_ms: w.clock.now().getTime(), app_user_id: maya.userId, ...event } }, { authorization: WEBHOOK_AUTH });

describe('Économie', () => {
  S.step('Maya s’inscrit : 0 pièce, pas d’abonnement, produits annoncés en mode LOCAL_DEMO (sans prix inventé)', async () => {
    maya = new Person(w, { key: 'maya', displayName: 'Maya', gender: 'WOMAN', seeking: ['MAN'] });
    await maya.onboard();
    expect((await wallet()).balance).toBe(0);
    expect((await sub()).state).toBe('NONE');
    const prods = await maya.call('GET', '/v1/purchases/products');
    expect(prods.data.mode).toBe('LOCAL_DEMO');
    expect(JSON.stringify(prods.data)).not.toMatch(/price|€|EUR/i);
  });

  S.step('Triche : un /purchases/sync avec un corps forgé n’accorde rien', async () => {
    const r = await maya.call('POST', '/v1/purchases/sync', { entitlements: ['blowy_plus'], coins: 99999 });
    expect(r.ok).toBe(true);
    expect((await wallet()).balance).toBe(0);
    expect((await sub()).entitlements).toHaveLength(0);
  });

  S.step('Achat de 500 pièces (démo) avec double tap / renvoi de la même commande : crédité une seule fois', async () => {
    const cid = randomUUID();
    const [a, b] = await Promise.all([
      maya.call('POST', '/v1/purchases/local-demo', { action: 'BUY_COINS', productId: 'coins_500' }, cid),
      maya.call('POST', '/v1/purchases/local-demo', { action: 'BUY_COINS', productId: 'coins_500' }, cid),
    ]);
    expect(a.ok || b.ok).toBe(true);
    await maya.call('POST', '/v1/purchases/local-demo', { action: 'BUY_COINS', productId: 'coins_500' }, cid);
    expect((await wallet()).balance).toBe(500);
    const conflict = await maya.call('POST', '/v1/purchases/local-demo', { action: 'SUBSCRIBE', productId: 'blowy_plus_monthly' }, cid);
    if (conflict.ok) S.note(`Idempotence /purchases/local-demo : la même Idempotency-Key réutilisée avec un AUTRE payload (SUBSCRIBE au lieu de BUY_COINS) est exécutée (200, état ${conflict.data?.subscription?.state}) au lieu de 409 IDEMPOTENCY_CONFLICT.`);
    expect(conflict.status).toBe(409);
  });

  S.step('Blowy+ mensuel (démo) : droits serveur étiquetés LOCAL_DEMO ; bénéfices mensuels versés une fois au titulaire', async () => {
    const r = await maya.call('POST', '/v1/purchases/local-demo', { action: 'SUBSCRIBE', productId: 'blowy_plus_monthly' });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    const s = await sub();
    expect(s).toMatchObject({ mode: 'LOCAL_DEMO', state: 'ACTIVE', environment: 'LOCAL_DEMO' });
    expect(s.entitlements.every((e: any) => ['LOCAL_DEMO', 'STORE_SUBSCRIPTION'].includes(e.source))).toBe(true);
    await w.runJob('economy.monthly_benefits');
    await w.runJob('economy.monthly_benefits');
    const wl = await wallet();
    const monthly = wl.history.items.filter((e: any) => /MONTHLY/.test(e.reason));
    if (monthly.length === 0) S.note('Bénéfices mensuels Blowy+ (200 pièces + 2 gels) : rien versé après l’abonnement démo, même en lançant le job economy.monthly_benefits (le job lit l’heure système, pas l’horloge injectée — `run()` sans paramètre).');
    expect(monthly.length).toBe(1);
    expect(wl.availableStreakFreezes).toBe(2);
  });

  S.step('Deux dépenses simultanées au-delà du solde : une seule passe, jamais de solde négatif', async () => {
    const bal = (await wallet()).balance;
    // Achète des écharpes (120) en parallèle jusqu'à épuiser le solde.
    const n = Math.floor(bal / 120) + 2;
    const rs = await Promise.all(Array.from({ length: n }, () => maya.call('POST', '/v1/catalog/scarf_red/purchase', {})));
    const ok = rs.filter((r) => r.ok).length;
    const after = (await wallet()).balance;
    expect(after).toBeGreaterThanOrEqual(0);
    expect(after).toBe(bal - ok * 120);
    expect(rs.some((r) => !r.ok)).toBe(true);
    const codes = [...new Set(rs.filter((r) => !r.ok).map((r) => `${r.status} ${r.code}`))];
    if (codes.some((c) => c.startsWith('0 '))) S.note('Dépenses concurrentes : des achats restent bloqués > 20 s (délai client dépassé, statut 0) — attente de verrou/pool de connexions saturé.');
    S.note(`Dépenses concurrentes : ${ok}/${n} réussies, refus ${codes.join(', ')}.`);
    if (codes.some((c) => c.startsWith('500'))) S.note('Dépenses concurrentes : les achats perdants renvoient 500 INTERNAL (après ~20 s de retries/attente de verrou) au lieu d’un refus propre « solde insuffisant ». Le solde reste juste, mais l’app afficherait une erreur serveur.');
    expect(codes.every((c) => /^(402|409|412)/.test(c))).toBe(true);
  });

  S.step('[V4 — à remplacer] Boost de visibilité et gel de série : achat atomique, inventaire, gel consommé une seule fois', async () => {
    await maya.call('POST', '/v1/purchases/local-demo', { action: 'BUY_COINS', productId: 'coins_500' });
    const boost = await maya.call('POST', '/v1/catalog/visibility_boost/purchase', {});
    expect(boost.ok, JSON.stringify(boost.data)).toBe(true);
    expect(boost.data.expiresAt).toBeTruthy();
    const cid = randomUUID();
    const f1 = await maya.call('POST', '/v1/streak-freezes/use', {}, cid);
    const f2 = await maya.call('POST', '/v1/streak-freezes/use', {}, cid);
    if (f1.ok) expect(f2.data.replayed).toBe(true);
    else S.note(`Gel de série : utilisation refusée (${f1.status} ${f1.code}) — pas de série quotidienne en place à protéger.`);
  });

  S.step('[V4 — à remplacer] Boost non consommé (aucun lot éligible) remboursé à l’expiration', async () => {
    await w.advance(8 * DAY);
    await w.runJob('economy.refund_expired_boosts');
    const hist = (await wallet()).history.items.map((e: any) => e.reason);
    if (!hist.includes('BOOST_NOT_CONSUMED_REFUND')) S.note('Boost non consommé : pas de remboursement après 8 jours d’horloge — le job economy.refund_expired_boosts ignore l’horloge du monde (run() sans `now`), il n’est donc testable qu’en temps réel.');
    expect(hist).toContain('BOOST_NOT_CONSUMED_REFUND');
  });

  S.step('Webhook store : refusé sans le bon secret ; avec le secret, un achat/remboursement notifié est accepté… mais sans effet en mode démo', async () => {
    const bad = await publicCall(w, 'POST', '/v1/webhooks/revenuecat', { api_version: '1.0', event: { id: randomUUID(), type: 'CANCELLATION', app_user_id: maya.userId } }, { authorization: 'Bearer faux' });
    expect(bad.status).toBe(401);
    const txId = `tx-journey-${randomUUID()}`;
    const before = (await wallet()).balance;
    const buy = await hook({ type: 'NON_RENEWING_PURCHASE', product_id: 'coins_500', transaction_id: txId, purchased_at_ms: w.clock.now().getTime() });
    expect(buy.status, JSON.stringify(buy.body)).toBe(200);
    const ev = { type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', product_id: 'coins_500', transaction_id: txId };
    expect((await hook(ev)).status).toBe(200);
    await w.drain();
    const credited = await w.db.storeTransaction.findFirst({ where: { storeTransactionId: txId } });
    const after = (await wallet()).balance;
    S.note(`Webhook RevenueCat en BILLING_PROVIDER=local_demo : achat + remboursement acceptés (200) mais ignorés (transaction ${credited ? credited.status : 'non enregistrée'}, solde ${before} → ${after}). Aucune action REFUND dans /purchases/local-demo : le remboursement n’est testable qu’avec le fournisseur RevenueCat réel/sandbox.`);
    expect(after).toBe(before);
  });
  S.absent('Remboursement d’un achat (pièces ou Blowy+) en démo locale : contre-écriture REFUND_REVERSAL, droits retirés', 'LOCAL_DEMO n’expose que SUBSCRIBE/CANCEL/EXPIRE/BUY_COINS ; webhooks ignorés dans ce mode (couvert seulement par les tests unitaires/intégration du module économie)');

  S.step('Fin de Blowy+ (expiration démo) : droits retirés, objets achetés conservés', async () => {
    const r = await maya.call('POST', '/v1/purchases/local-demo', { action: 'EXPIRE' });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    const s = await sub();
    expect(s.entitlements).toHaveLength(0);
    expect(s.dateSlots).toBe(1);
    const inv = (await wallet()).inventory as any[];
    expect(inv.filter((i) => i.catalogItemId === 'scarf_red' && i.status !== 'REFUNDED').length).toBeGreaterThan(0);
  });
});
