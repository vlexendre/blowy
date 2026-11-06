/**
 * Intégration RÉELLE sur PostgreSQL (blowy_test) : UnitOfWork, CommandBus, idempotence et verrous
 * du socle, repositories Prisma, contraintes SQL. Seul le réseau RevenueCat est simulé (fetch
 * injecté renvoyant des réponses au format documenté GET /v1/subscribers).
 * Lancement : DATABASE_URL_TEST=postgresql://blowy:blowy@localhost:5432/blowy_test npx vitest run src/modules/economy/__tests__/economy.int.test.ts
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createDb, uuidv7, type Db } from '@blowy/database';
import { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock } from '../../../shared/application/clock.js';
import { PrismaIdempotencyStore } from '../../../shared/infrastructure/prisma/prisma-idempotency.store.js';
import { PrismaUnitOfWork } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { composeEconomy, type EconomyGraph } from '../economy.composition.js';
import type { EconomyConfig } from '../infrastructure/config/economy-config.js';
import { RevenueCatBillingProvider } from '../infrastructure/revenuecat/revenuecat-billing.provider.js';
import { NoopReconcileScheduler } from '../infrastructure/reconcile-scheduler.js';
import { TEST_PARAMS } from './fixtures.js';
import { defaultPaymentsParams } from '../infrastructure/config/payments-params.js';

const URL = process.env.DATABASE_URL_TEST ?? 'postgresql://blowy:blowy@localhost:5432/blowy_test';
const WEBHOOK_SECRET = 'Bearer test-webhook-secret-0123456789abcdef';

class TestClock implements Clock {
  t = new Date('2026-11-02T10:00:00Z');
  now() {
    return new Date(this.t);
  }
}

/** Faux réseau RevenueCat : état « fournisseur » par appUserID au format documenté. */
class FakeRevenueCat {
  customers = new Map<string, unknown>();
  calls = 0;
  fetch: typeof fetch = async (input) => {
    this.calls++;
    const id = decodeURIComponent(String(input).split('/subscribers/')[1] ?? '');
    const body = this.customers.get(id) ?? { request_date_ms: 0, subscriber: { entitlements: {}, subscriptions: {}, non_subscriptions: {} } };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  setPlus(userId: string, opts: { expires: string; refunded?: string | null; unsubscribed?: string | null; sandbox?: boolean; trial?: boolean }) {
    const active = new Date(opts.expires) > new Date('2026-11-02T10:00:00Z') && !opts.refunded;
    this.customers.set(userId, {
      request_date_ms: 0,
      subscriber: {
        entitlements: active ? { blowy_plus: { expires_date: opts.expires, grace_period_expires_date: null, product_identifier: 'blowy_plus_monthly', purchase_date: '2026-11-01T00:00:00Z' } } : {},
        subscriptions: {
          blowy_plus_monthly: {
            expires_date: opts.expires,
            purchase_date: '2026-11-01T00:00:00Z',
            period_type: opts.trial ? 'TRIAL' : 'NORMAL',
            store: 'APP_STORE',
            is_sandbox: opts.sandbox ?? false,
            unsubscribe_detected_at: opts.unsubscribed ?? null,
            billing_issues_detected_at: null,
            grace_period_expires_date: null,
            refunded_at: opts.refunded ?? null,
            store_transaction_id: `tx-sub-${userId}`,
          },
        },
        non_subscriptions: {},
      },
    });
  }
}

let db: Db;
let clock: TestClock;
let rc: FakeRevenueCat;
let economy: EconomyGraph;
let partners: Map<string, { partnerUserId: string; relationshipId: string }>;

const config: EconomyConfig = {
  env: 'test',
  provider: 'revenuecat',
  revenueCat: { secretApiKey: 'sk_test_never_used', webhookAuth: WEBHOOK_SECRET, baseUrl: 'https://api.revenuecat.test/v1', acceptSandbox: false, timeoutMs: 1000 },
  localWebhookAuth: null,
};

async function createUser(): Promise<string> {
  const id = uuidv7();
  await db.user.create({ data: { id, isFictional: true } });
  return id;
}

async function credit(userId: string, amount: number) {
  const uow = new PrismaUnitOfWork(db, clock);
  await uow.run(async (scope) => {
    await scope.lock.users([userId]);
    const w = await economy.repositories.ledger.lockWallet(scope, userId);
    await economy.repositories.ledger.append(scope, w, { amount, reason: 'MISSION_REWARD', source: 'MISSION', idempotencyKey: `seed:${randomUUID()}`, causeType: 'test', causeId: null });
  });
}

function webhook(event: Record<string, unknown>) {
  return { api_version: '1.0', event: { id: randomUUID(), event_timestamp_ms: clock.now().getTime(), environment: 'PRODUCTION', store: 'APP_STORE', ...event } };
}

beforeAll(async () => {
  db = createDb({ connectionString: URL, max: 8 });
  await db.$queryRaw`SELECT 1`;
  await db.storeProduct.createMany({
    data: [
      { id: 'blowy_plus_monthly', kind: 'SUBSCRIPTION', entitlementId: 'blowy_plus' },
      { id: 'blowy_plus_annual', kind: 'SUBSCRIPTION', entitlementId: 'blowy_plus' },
      { id: 'coins_500', kind: 'CONSUMABLE_COINS', coinsAmount: 500 },
    ],
    skipDuplicates: true,
  });
  await db.catalogItem.createMany({
    data: [
      { id: 'streak_freeze', kind: 'STREAK_FREEZE', priceCoins: 200 },
      { id: 'visibility_boost', kind: 'VISIBILITY_BOOST', priceCoins: 300 },
      { id: 'egg_rare_aurora', kind: 'RARE_EGG_COSMETIC', priceCoins: 400, perUserLimit: 1, metadata: { variant: 'aurora' } },
    ],
    skipDuplicates: true,
  });
});

afterAll(async () => {
  await db?.$disconnect();
});

beforeEach(() => {
  clock = new TestClock();
  rc = new FakeRevenueCat();
  partners = new Map();
  const uow = new PrismaUnitOfWork(db, clock);
  const bus = new CommandBus(uow, new PrismaIdempotencyStore());
  economy = composeEconomy({
    db,
    uow,
    bus,
    clock,
    config,
    relationships: { findMovedInPartner: async (u) => partners.get(u) ?? null },
    provider: new RevenueCatBillingProvider({ ...config.revenueCat!, isProduction: false }, rc.fetch, () => clock.now()),
    scheduler: new NoopReconcileScheduler(),
    params: { current: () => TEST_PARAMS },
    // V5.4 (C.10) : ces tests couvrent l'achat intégré RevenueCat (code gardé, désactivé par défaut) — on le réactive ici.
    paymentsParams: () => ({ ...defaultPaymentsParams(), plusBilling: 'IN_APP_PURCHASE' }),
  });
});

describe('ledger et catalogue (§16, §21-3)', () => {
  it('deux dépenses concurrentes ne rendent jamais le solde négatif', async () => {
    const u = await createUser();
    await credit(u, 300);
    const results = await Promise.allSettled([
      economy.purchaseCatalogItem.execute(u, randomUUID(), 'streak_freeze'),
      economy.purchaseCatalogItem.execute(u, randomUUID(), 'streak_freeze'),
      economy.purchaseCatalogItem.execute(u, randomUUID(), 'streak_freeze'),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(rejected.every((r) => (r.reason as { code?: string }).code === 'INSUFFICIENT_FUNDS')).toBe(true);
    const w = await db.wallet.findUniqueOrThrow({ where: { userId: u } });
    expect(w.balance).toBe(100);
    const sum = await db.ledgerEntry.aggregate({ where: { userId: u }, _sum: { amount: true } });
    expect(sum._sum.amount).toBe(100);
    expect(await db.streakFreeze.count({ where: { userId: u, status: 'AVAILABLE' } })).toBe(1);
  });

  it('même commande rejouée (double tap) : un seul débit, résultat rejoué', async () => {
    const u = await createUser();
    await credit(u, 1000);
    const cid = randomUUID();
    const [a, b] = await Promise.allSettled([economy.purchaseCatalogItem.execute(u, cid, 'visibility_boost'), economy.purchaseCatalogItem.execute(u, cid, 'visibility_boost')]);
    const replay = await economy.purchaseCatalogItem.execute(u, cid, 'visibility_boost');
    expect(replay.replayed).toBe(true);
    expect([a, b].filter((r) => r.status === 'fulfilled').length).toBeGreaterThanOrEqual(1);
    expect((await db.wallet.findUniqueOrThrow({ where: { userId: u } })).balance).toBe(700);
    expect(await db.inventoryItem.count({ where: { userId: u } })).toBe(1);
    await expect(economy.purchaseCatalogItem.execute(u, cid, 'streak_freeze')).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });

  it('ledger append-only : UPDATE/DELETE refusés par la base', async () => {
    const u = await createUser();
    await credit(u, 50);
    const e = await db.ledgerEntry.findFirstOrThrow({ where: { userId: u } });
    await expect(db.$executeRaw`UPDATE "LedgerEntry" SET amount = 9999 WHERE id = ${e.id}::uuid`).rejects.toThrow();
    await expect(db.$executeRaw`DELETE FROM "LedgerEntry" WHERE id = ${e.id}::uuid`).rejects.toThrow();
  });

  it('œuf rare cosmétique : déterministe, une seule fois par utilisateur', async () => {
    const u = await createUser();
    await credit(u, 1000);
    const r = await economy.purchaseCatalogItem.execute(u, randomUUID(), 'egg_rare_aurora');
    expect(r.result.priceCoins).toBe(400);
    const inv = await db.inventoryItem.findFirstOrThrow({ where: { userId: u, catalogItemId: 'egg_rare_aurora' } });
    expect(inv.metadata).toEqual({ variant: 'aurora' });
    await expect(economy.purchaseCatalogItem.execute(u, randomUUID(), 'egg_rare_aurora')).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
  });

  it('boost non consommé : remboursé une fois à expiration', async () => {
    const u = await createUser();
    await credit(u, 300);
    await economy.purchaseCatalogItem.execute(u, randomUUID(), 'visibility_boost');
    clock.t = new Date(clock.t.getTime() + 8 * 86_400_000);
    const jobs = economy.jobs.list();
    const refund = jobs.find((j) => j.name === 'economy.refund_expired_boosts')!;
    await refund.run();
    await refund.run();
    expect((await db.wallet.findUniqueOrThrow({ where: { userId: u } })).balance).toBe(300);
    expect(await db.ledgerEntry.count({ where: { userId: u, reason: 'BOOST_NOT_CONSUMED_REFUND' } })).toBe(1);
  });
});

describe('gels de série', () => {
  it('consommation atomique : deux utilisations concurrentes ne protègent qu’un jour', async () => {
    const u = await createUser();
    await db.streak.create({ data: { userId: u, length: 6, longestLength: 6, lastQualifiedDay: '2026-10-31', lastCoveredDay: '2026-10-31', timeZone: 'Europe/Paris' } });
    await credit(u, 400);
    await economy.purchaseCatalogItem.execute(u, randomUUID(), 'streak_freeze');
    await economy.purchaseCatalogItem.execute(u, randomUUID(), 'streak_freeze');
    const res = await Promise.allSettled([economy.useStreakFreeze.execute(u, randomUUID()), economy.useStreakFreeze.execute(u, randomUUID())]);
    expect(res.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await db.streakFreeze.count({ where: { userId: u, status: 'CONSUMED' } })).toBe(1);
    expect((await db.streak.findUniqueOrThrow({ where: { userId: u } })).lastCoveredDay).toBe('2026-11-01');
  });
});

describe('webhook RevenueCat (§21-15)', () => {
  it('mauvais header Authorization refusé, aucun enregistrement', async () => {
    const before = await db.providerWebhookEvent.count();
    await expect(economy.receiveWebhook.execute('Bearer wrong', webhook({ type: 'TEST' }))).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    await expect(economy.receiveWebhook.execute(undefined, webhook({ type: 'TEST' }))).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(await db.providerWebhookEvent.count()).toBe(before);
  });

  it('même webhook rejoué : un seul crédit de pièces', async () => {
    const u = await createUser();
    const body = webhook({ type: 'NON_RENEWING_PURCHASE', app_user_id: u, product_id: 'coins_500', transaction_id: `tx-${randomUUID()}`, purchased_at_ms: clock.now().getTime() });
    const r1 = await economy.receiveWebhook.execute(WEBHOOK_SECRET, body);
    const r2 = await economy.receiveWebhook.execute(WEBHOOK_SECRET, body);
    const [r3, r4] = await Promise.all([economy.receiveWebhook.execute(WEBHOOK_SECRET, body), economy.receiveWebhook.execute(WEBHOOK_SECRET, body)]);
    expect(r1.status).toBe('ACCEPTED');
    expect([r2.status, r3.status, r4.status]).toEqual(['DUPLICATE', 'DUPLICATE', 'DUPLICATE']);
    expect((await db.wallet.findUniqueOrThrow({ where: { userId: u } })).balance).toBe(500);
    // Même transaction store via un AUTRE événement (retry/restore) : toujours un seul crédit.
    await economy.receiveWebhook.execute(WEBHOOK_SECRET, { ...body, event: { ...body.event, id: randomUUID() } });
    expect((await db.wallet.findUniqueOrThrow({ where: { userId: u } })).balance).toBe(500);
    expect(await db.storeTransaction.count({ where: { userId: u } })).toBe(1);
  });

  it('remboursement consommable : contre-écriture bornée au solde, une seule fois', async () => {
    const u = await createUser();
    const tx = `tx-${randomUUID()}`;
    await economy.receiveWebhook.execute(WEBHOOK_SECRET, webhook({ type: 'NON_RENEWING_PURCHASE', app_user_id: u, product_id: 'coins_500', transaction_id: tx }));
    await economy.purchaseCatalogItem.execute(u, randomUUID(), 'visibility_boost'); // 500 → 200
    const refund = webhook({ type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', app_user_id: u, product_id: 'coins_500', transaction_id: tx });
    await economy.receiveWebhook.execute(WEBHOOK_SECRET, refund);
    await economy.receiveWebhook.execute(WEBHOOK_SECRET, { ...refund, event: { ...refund.event, id: randomUUID() } });
    const w = await db.wallet.findUniqueOrThrow({ where: { userId: u } });
    expect(w.balance).toBe(0);
    const reversal = await db.ledgerEntry.findMany({ where: { userId: u, reason: 'REFUND_REVERSAL' } });
    expect(reversal).toHaveLength(1);
    expect(reversal[0]!.amount).toBe(-200);
    expect((await db.storeTransaction.findFirstOrThrow({ where: { storeTransactionId: tx } })).status).toBe('REFUNDED');
  });

  it('événements désordonnés : un EXPIRATION ancien n’écrase pas un RENEWAL récent ; la réconciliation fait foi', async () => {
    const u = await createUser();
    const t0 = clock.now().getTime();
    const renewal = webhook({ type: 'RENEWAL', app_user_id: u, product_id: 'blowy_plus_monthly', entitlement_ids: ['blowy_plus'], period_type: 'NORMAL', expiration_at_ms: t0 + 30 * 86_400_000, event_timestamp_ms: t0 });
    const oldExpiration = webhook({ type: 'EXPIRATION', app_user_id: u, product_id: 'blowy_plus_monthly', entitlement_ids: ['blowy_plus'], expiration_at_ms: t0 - 1000, event_timestamp_ms: t0 - 60_000 });
    await economy.receiveWebhook.execute(WEBHOOK_SECRET, renewal);
    await economy.receiveWebhook.execute(WEBHOOK_SECRET, oldExpiration);
    expect((await economy.subscriptionView.execute(u)).state).toBe('ACTIVE');
    expect(await economy.entitlementsReader.dateSlots(u, clock.now())).toBe(3);
    // Autorité fournisseur : l'abonnement est en réalité remboursé.
    rc.setPlus(u, { expires: new Date(t0 + 30 * 86_400_000).toISOString(), refunded: new Date(t0).toISOString() });
    await economy.reconcile.execute(u);
    const view = await economy.subscriptionView.execute(u);
    expect(view.state).toBe('REFUNDED');
    expect(view.entitlements).toHaveLength(0);
    expect(await economy.entitlementsReader.dateSlots(u, clock.now())).toBe(1);
    // Perte de capacité → événement outbox pour marquer les relations LEGACY (module relations).
    expect(await db.outboxEvent.count({ where: { topic: 'economy.plus_capacity_reduced', aggregateId: u } })).toBeGreaterThanOrEqual(1);
  });

  it('achats sandbox refusés en production (environnements séparés)', async () => {
    const u = await createUser();
    rc.setPlus(u, { expires: '2026-12-02T10:00:00Z', sandbox: true });
    await economy.reconcile.execute(u);
    expect((await economy.entitlementsReader.activeKeys(u, clock.now())).size).toBe(0);
    expect(await db.subscription.count({ where: { userId: u, environment: 'SANDBOX' } })).toBe(1);
  });
});

describe('sync client & droits (§21-15)', () => {
  it('payload client falsifié ignoré : seul l’état fournisseur accorde Blowy+', async () => {
    const u = await createUser();
    // Le client prétend être premium : le serveur interroge RevenueCat (aucun abonnement).
    const r = await economy.sync.execute(u);
    expect(r.subscription.state).toBe('NONE');
    expect(r.subscription.entitlements).toEqual([]);
    expect(rc.calls).toBe(1);
    // Webhook forgé sans le bon secret : refusé.
    await expect(economy.receiveWebhook.execute('Bearer forged', webhook({ type: 'INITIAL_PURCHASE', app_user_id: u, product_id: 'blowy_plus_monthly', entitlement_ids: ['blowy_plus'] }))).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect((await economy.entitlementsReader.activeKeys(u, clock.now())).size).toBe(0);
  });

  it('droits dérivés : seul partenaire emménagé, non transitifs, révoqués à la perte du droit ; mensuel au titulaire seul', async () => {
    const [a, b, c] = [await createUser(), await createUser(), await createUser()];
    partners.set(a, { partnerUserId: b, relationshipId: await relationship() });
    partners.set(b, { partnerUserId: c, relationshipId: await relationship() }); // B emménagé avec C ailleurs : chaîne à bloquer
    rc.setPlus(a, { expires: '2026-12-02T10:00:00Z' });
    await economy.sync.execute(a);
    await economy.sync.execute(b); // B n'a pas d'abonnement propre
    const bKeys = await economy.entitlementsReader.activeKeys(b, clock.now());
    expect(bKeys.has('PLUS_DATE_SLOTS')).toBe(true);
    expect(bKeys.has('PLUS_MONTHLY_BENEFITS')).toBe(false);
    expect((await economy.entitlementsReader.activeKeys(c, clock.now())).size).toBe(0); // non transitif

    // Bénéfices mensuels : titulaire seulement, une seule fois même si le job est rejoué.
    await economy.monthly.runBatch();
    await economy.monthly.runBatch();
    await economy.monthly.grantFor(a);
    expect(await db.monthlyBenefitGrant.count({ where: { userId: a } })).toBe(1);
    expect(await db.monthlyBenefitGrant.count({ where: { userId: b } })).toBe(0);
    expect((await db.wallet.findUniqueOrThrow({ where: { userId: a } })).balance).toBe(200);
    expect(await db.streakFreeze.count({ where: { userId: a, source: 'MONTHLY_BENEFIT' } })).toBe(2);
    expect(await db.wallet.findUnique({ where: { userId: b } })).toBeNull();

    // Perte du droit payant de A → dérivé de B révoqué.
    rc.setPlus(a, { expires: '2026-11-01T00:00:00Z' });
    await economy.reconcile.execute(a);
    expect((await economy.entitlementsReader.activeKeys(b, clock.now())).size).toBe(0);
    expect(await db.outboxEvent.count({ where: { topic: 'economy.plus_capacity_reduced', aggregateId: b } })).toBeGreaterThanOrEqual(1);
  });

  it('rupture : droits dérivés révoqués par l’événement relationship.ended', async () => {
    const [a, b] = [await createUser(), await createUser()];
    const rel = await relationship();
    partners.set(a, { partnerUserId: b, relationshipId: rel });
    rc.setPlus(a, { expires: '2026-12-02T10:00:00Z' });
    await economy.sync.execute(a);
    expect((await economy.entitlementsReader.activeKeys(b, clock.now())).size).toBeGreaterThan(0);
    const consumer = economy.outboxConsumers[0]!;
    const uow = new PrismaUnitOfWork(db, clock);
    await uow.run((scope) => consumer.handle(scope, { id: randomUUID(), topic: 'relationship.ended', aggregateType: 'RelationshipContext', aggregateId: rel, payload: { relationshipId: rel, userIds: [a, b] }, createdAt: clock.now() }));
    expect((await economy.entitlementsReader.activeKeys(b, clock.now())).size).toBe(0);
    expect((await economy.entitlementsReader.activeKeys(a, clock.now())).size).toBeGreaterThan(0);
  });
});

async function relationship(): Promise<string> {
  const [p1, p2] = [uuidv7(), uuidv7()].sort();
  // Pets enfants (kind CHILD, non matchables) : suffisent comme support FK du contexte relationnel de test.
  await db.pet.createMany({ data: [p1!, p2!].map((id) => ({ id, kind: 'CHILD' as const, matchable: false, species: 'GASTON' as const, name: 'Test', engineVersion: 'test' })) });
  const pair = await db.petPair.create({ data: { id: uuidv7(), petLowId: p1!, petHighId: p2! } });
  const id = uuidv7();
  await db.relationshipContext.create({ data: { id, pairId: pair.id, type: 'DATE', affinity: 50, timezone: 'Europe/Paris', startedAt: new Date(), engineVersion: 'test', tuningVersion: 'test' } });
  return id;
}
