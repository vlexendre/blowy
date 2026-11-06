/**
 * Fumée HTTP Nest du module économie (vraie base blowy_test) : routes, guard d'auth du socle,
 * filtre d'erreurs, idempotence, webhook public. Les jetons transverses sont fournis ici avec les
 * implémentations réelles du socle (UoW, CommandBus, idempotence Prisma) ; seule la résolution de
 * session est un stand-in (jeton = userId), en attendant le montage complet de l'AppModule.
 */
import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Global, Module, type INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, NestFactory, Reflector } from '@nestjs/core';
import { createDb, uuidv7, type Db } from '@blowy/database';
import { CommandBus } from '../../../shared/application/command-bus.js';
import { PrismaIdempotencyStore } from '../../../shared/infrastructure/prisma/prisma-idempotency.store.js';
import { PrismaUnitOfWork } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { AuthGuard } from '../../../shared/interface/auth.guard.js';
import { ApiErrorFilter } from '../../../shared/interface/error.filter.js';
import { CLOCK, COMMAND_BUS, DB, LOGGER, RELATIONSHIP_READER, UNIT_OF_WORK } from '../../../shared/shared.tokens.js';
import { EconomyModule } from '../economy.module.js';

const URL = process.env.DATABASE_URL_TEST ?? 'postgresql://blowy:blowy@localhost:5432/blowy_test';
const WEBHOOK_AUTH = 'Bearer http-smoke-secret-0123456789abcdef';
const silent = { warn: () => {}, error: () => {}, info: () => {}, debug: () => {}, child: () => silent };

let db: Db;
let app: INestApplication;
let base: string;

beforeAll(async () => {
  process.env.BLOWY_ENV = 'test';
  process.env.BILLING_PROVIDER = 'local_demo';
  process.env.REVENUECAT_WEBHOOK_AUTH = WEBHOOK_AUTH;
  db = createDb({ connectionString: URL, max: 4 });
  const clock = { now: () => new Date() };
  const uow = new PrismaUnitOfWork(db, clock);
  @Global()
  @Module({
    providers: [
      { provide: DB, useValue: db },
      { provide: CLOCK, useValue: clock },
      { provide: UNIT_OF_WORK, useValue: uow },
      { provide: COMMAND_BUS, useValue: new CommandBus(uow, new PrismaIdempotencyStore()) },
      { provide: LOGGER, useValue: silent },
      { provide: RELATIONSHIP_READER, useValue: { findMovedInPartner: async () => null } },
    ],
    exports: [DB, CLOCK, UNIT_OF_WORK, COMMAND_BUS, LOGGER, RELATIONSHIP_READER],
  })
  class TestCore {}
  @Module({
    imports: [TestCore, EconomyModule],
    providers: [
      { provide: APP_GUARD, useFactory: (r: Reflector) => new AuthGuard(r, { resolve: async (t) => (/^[0-9a-f-]{36}$/.test(t) ? { userId: t, sessionId: 's' } : null) }), inject: [Reflector] },
      { provide: APP_FILTER, useFactory: () => new ApiErrorFilter(silent as never) },
    ],
  })
  class TestApp {}
  app = await NestFactory.create(TestApp, { logger: false });
  await app.listen(0);
  base = `${await app.getUrl()}/v1`.replace('[::1]', 'localhost');
  await db.storeProduct.createMany({ data: [{ id: 'blowy_plus_monthly', kind: 'SUBSCRIPTION', entitlementId: 'blowy_plus' }, { id: 'coins_500', kind: 'CONSUMABLE_COINS', coinsAmount: 500 }], skipDuplicates: true });
  await db.catalogItem.createMany({ data: [{ id: 'streak_freeze', kind: 'STREAK_FREEZE', priceCoins: 200 }], skipDuplicates: true });
});

afterAll(async () => {
  await app?.close();
  await db?.$disconnect();
});

const call = (path: string, init: { method?: string; token?: string; body?: unknown; headers?: Record<string, string> } = {}) =>
  fetch(`${base}${path}`, {
    method: init.method ?? 'GET',
    headers: { 'content-type': 'application/json', ...(init.token ? { authorization: `Bearer ${init.token}` } : {}), ...(init.headers ?? {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

describe('HTTP /v1 économie', () => {
  it('parcours démo locale : abonnement + pièces via réconciliation serveur, étiqueté LOCAL_DEMO', async () => {
    const u = uuidv7();
    await db.user.create({ data: { id: u, isFictional: true } });
    expect((await call('/wallet')).status).toBe(401);

    const sub = await call('/purchases/local-demo', { method: 'POST', token: u, headers: { 'idempotency-key': randomUUID() }, body: { action: 'SUBSCRIBE', productId: 'blowy_plus_monthly' } });
    expect(sub.status).toBe(200);
    const subBody = (await sub.json()) as { subscription: { mode: string; state: string; dateSlots: number } };
    expect(subBody.subscription).toMatchObject({ mode: 'LOCAL_DEMO', state: 'ACTIVE', dateSlots: 3 });

    // V5 (D-020) : pièces, gels, boost, accessoires vendus → 410 GONE (même en démo).
    const coins = await call('/purchases/local-demo', { method: 'POST', token: u, headers: { 'idempotency-key': randomUUID() }, body: { action: 'BUY_COINS', productId: 'coins_500' } });
    expect(coins.status).toBe(410);
    expect(((await coins.json()) as { detailsSafe: { reason: string } }).detailsSafe.reason).toBe('RETIRED_IN_V5');
    // Sync client avec un corps falsifié : ignoré.
    await call('/purchases/sync', { method: 'POST', token: u, body: { entitlements: ['blowy_plus'], coins: 99999 } });
    const wallet = (await (await call('/wallet', { token: u })).json()) as { balance: number; history: { items: unknown[] } };
    expect(wallet.balance).toBe(0);
    const buy = await call('/catalog/streak_freeze/purchase', { method: 'POST', token: u, headers: { 'idempotency-key': randomUUID() } });
    expect(buy.status).toBe(410);
    expect((await call('/streak-freezes/use', { method: 'POST', token: u, headers: { 'idempotency-key': randomUUID() } })).status).toBe(410);
    const products = (await (await call('/purchases/products', { token: u })).json()) as { products: { kind: string }[]; seat: { amountCents: number }; plus: { monthlyPriceCents: number } };
    expect(products.products.every((p) => p.kind === 'SUBSCRIPTION')).toBe(true);
    expect(products.seat.amountCents).toBe(499);
    expect(products.plus.monthlyPriceCents).toBe(999);

    const me = (await (await call('/subscriptions/me', { token: u })).json()) as { mode: string; entitlements: { key: string }[] };
    expect(me.mode).toBe('LOCAL_DEMO');
    expect(me.entitlements.map((e) => e.key)).toContain('PLUS_MONTHLY_BENEFITS');
  });

  it('webhook : 401 structuré sans le bon header, 200 avec', async () => {
    const body = { api_version: '1.0', event: { id: randomUUID(), type: 'TEST', event_timestamp_ms: Date.now(), app_user_id: 'anon' } };
    const bad = await call('/webhooks/revenuecat', { method: 'POST', body, headers: { authorization: 'Bearer nope' } });
    expect(bad.status).toBe(401);
    expect(((await bad.json()) as { code: string }).code).toBe('UNAUTHENTICATED');
    const ok = await call('/webhooks/revenuecat', { method: 'POST', body, headers: { authorization: WEBHOOK_AUTH } });
    expect(ok.status).toBe(200);
    const dup = await call('/webhooks/revenuecat', { method: 'POST', body, headers: { authorization: WEBHOOK_AUTH } });
    expect(await dup.json()).toEqual({ status: 'DUPLICATE' });
  });
});
