import { uuidv7, type Db } from '@blowy/database';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import { decodeCursor, pageFrom, type Page } from '../../../../shared/application/pagination.js';
import { txOf } from '../../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { BillingEnvironment, BillingProviderKind } from '../../domain/index.js';
import type { NormalizedWebhookEvent } from '../../application/ports/billing-provider.port.js';
import type {
  BillingRecordRepository,
  StoreProductRecord,
  StoreTransactionRecord,
  WebhookEventRecord,
  WebhookStatus,
} from '../../application/ports/billing-record.repository.js';
import type { UserDirectory } from '../../application/ports/economy-config.port.js';

type TxRow = Omit<StoreTransactionRecord, 'provider' | 'environment' | 'status'> & { provider: string; environment: string; status: string };
const toTx = (r: TxRow): StoreTransactionRecord => ({
  ...r,
  provider: r.provider as BillingProviderKind,
  environment: r.environment as BillingEnvironment,
  status: r.status as StoreTransactionRecord['status'],
});
const txSelect = { id: true, userId: true, provider: true, environment: true, storeTransactionId: true, productId: true, status: true, coinsCredited: true, ledgerEntryId: true, refundLedgerEntryId: true } as const;

type WhRow = Omit<WebhookEventRecord, 'environment' | 'status'> & { environment: string; status: string };
const toWh = (r: WhRow): WebhookEventRecord => ({ ...r, environment: r.environment as BillingEnvironment, status: r.status as WebhookStatus });
const whSelect = { id: true, provider: true, providerEventId: true, environment: true, eventType: true, appUserId: true, eventTimestamp: true, receivedAt: true, processedAt: true, status: true, attempts: true, lastError: true } as const;

export class PrismaBillingRecordRepository implements BillingRecordRepository {
  constructor(private readonly db: Db) {}

  async listStoreProducts(): Promise<StoreProductRecord[]> {
    return (await this.db.storeProduct.findMany()).map((p) => ({ id: p.id, kind: p.kind, coinsAmount: p.coinsAmount, entitlementId: p.entitlementId, active: p.active }));
  }

  async lockStoreTransaction(scope: TxScope, provider: BillingProviderKind, environment: BillingEnvironment, storeTransactionId: string): Promise<StoreTransactionRecord | null> {
    const tx = txOf(scope);
    await tx.$queryRaw`SELECT 1 FROM "StoreTransaction" WHERE provider = ${provider}::"BillingProviderKind" AND environment = ${environment}::"BillingEnvironment" AND "storeTransactionId" = ${storeTransactionId} FOR UPDATE`;
    const r = await tx.storeTransaction.findUnique({ where: { provider_environment_storeTransactionId: { provider, environment, storeTransactionId } }, select: txSelect });
    return r ? toTx(r) : null;
  }

  async insertStoreTransaction(
    scope: TxScope,
    d: Omit<StoreTransactionRecord, 'id' | 'refundLedgerEntryId'> & { store: string; kind: 'SUBSCRIPTION' | 'CONSUMABLE_COINS'; purchasedAt: Date },
  ): Promise<StoreTransactionRecord | null> {
    const tx = txOf(scope);
    const id = uuidv7(scope.now.getTime());
    const n = await tx.$executeRaw`INSERT INTO "StoreTransaction" (id, "userId", provider, environment, store, "storeTransactionId", "productId", kind, "purchasedAt", status, "coinsCredited", "ledgerEntryId", "createdAt")
      VALUES (${id}::uuid, ${d.userId}::uuid, ${d.provider}::"BillingProviderKind", ${d.environment}::"BillingEnvironment", ${d.store}, ${d.storeTransactionId}, ${d.productId},
        ${d.kind}::"StoreProductKind", ${d.purchasedAt}, ${d.status}::"StoreTransactionStatus", ${d.coinsCredited}, ${d.ledgerEntryId}::uuid, ${scope.now})
      ON CONFLICT (provider, environment, "storeTransactionId") DO NOTHING`;
    if (n !== 1) return null;
    return toTx((await tx.storeTransaction.findUniqueOrThrow({ where: { id }, select: txSelect })) as TxRow);
  }

  async markStoreTransactionRefunded(scope: TxScope, id: string, refundLedgerEntryId: string | null, at: Date): Promise<boolean> {
    const r = await txOf(scope).storeTransaction.updateMany({ where: { id, status: 'CREDITED' }, data: { status: 'REFUNDED', refundLedgerEntryId, refundedAt: at } });
    return r.count === 1;
  }

  async markStoreTransactionRecredited(scope: TxScope, id: string): Promise<boolean> {
    const r = await txOf(scope).storeTransaction.updateMany({ where: { id, status: 'REFUNDED' }, data: { status: 'CREDITED' } });
    return r.count === 1;
  }

  async recordWebhook(e: NormalizedWebhookEvent, provider: string, appUserId: string | null, payload: unknown, now: Date): Promise<{ record: WebhookEventRecord; duplicate: boolean }> {
    const id = uuidv7(now.getTime());
    const n = await this.db.$executeRaw`INSERT INTO "ProviderWebhookEvent" (id, provider, "providerEventId", environment, "eventType", "appUserId", "eventTimestamp", "receivedAt", status, attempts, payload)
      VALUES (${id}::uuid, ${provider}, ${e.providerEventId}, ${e.environment}::"BillingEnvironment", ${e.type}, ${appUserId}, ${e.eventAt}, ${now}, 'RECEIVED', 0, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (provider, "providerEventId") DO NOTHING`;
    const row = await this.db.providerWebhookEvent.findUniqueOrThrow({ where: { provider_providerEventId: { provider, providerEventId: e.providerEventId } }, select: whSelect });
    return { record: toWh(row), duplicate: n !== 1 };
  }

  async claimWebhook(scope: TxScope, id: string): Promise<WebhookEventRecord | null> {
    const tx = txOf(scope);
    await tx.$queryRaw`SELECT 1 FROM "ProviderWebhookEvent" WHERE id = ${id}::uuid FOR UPDATE`;
    const r = await tx.providerWebhookEvent.findUnique({ where: { id }, select: whSelect });
    if (!r || r.status === 'PROCESSED' || r.status === 'IGNORED') return null;
    await tx.providerWebhookEvent.update({ where: { id }, data: { attempts: { increment: 1 } } });
    return toWh(r);
  }

  async completeWebhook(scope: TxScope, id: string, status: 'PROCESSED' | 'IGNORED', at: Date): Promise<void> {
    await txOf(scope).providerWebhookEvent.update({ where: { id }, data: { status, processedAt: at, lastError: null } });
  }

  async failWebhook(id: string, error: string): Promise<void> {
    await this.db.providerWebhookEvent.updateMany({ where: { id, status: { in: ['RECEIVED', 'FAILED'] } }, data: { status: 'FAILED', lastError: error, attempts: { increment: 1 } } });
  }

  async getWebhookPayload(id: string): Promise<{ record: WebhookEventRecord; payload: unknown } | null> {
    const r = await this.db.providerWebhookEvent.findUnique({ where: { id }, select: { ...whSelect, payload: true } });
    if (!r) return null;
    const { payload, ...rest } = r;
    return { record: toWh(rest), payload };
  }

  async listWebhooks(filter: { status?: WebhookStatus; appUserId?: string }, cursor: string | undefined, limit: number): Promise<Page<WebhookEventRecord>> {
    const c = decodeCursor(cursor);
    const where = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.appUserId ? { appUserId: filter.appUserId } : {}),
      ...(c && typeof c[0] === 'string' && typeof c[1] === 'string'
        ? { OR: [{ receivedAt: { lt: new Date(c[0]) } }, { receivedAt: new Date(c[0]), id: { lt: c[1] } }] }
        : {}),
    };
    const rows = await this.db.providerWebhookEvent.findMany({ where, select: whSelect, orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }], take: limit + 1 });
    return pageFrom(rows.map(toWh), limit, (w) => [w.receivedAt.toISOString(), w.id]);
  }

  async listRetryableWebhooks(limit: number, maxAttempts: number): Promise<WebhookEventRecord[]> {
    return (
      await this.db.providerWebhookEvent.findMany({ where: { status: { in: ['RECEIVED', 'FAILED'] }, attempts: { lt: maxAttempts } }, select: whSelect, orderBy: { receivedAt: 'asc' }, take: limit })
    ).map(toWh);
  }
}

export class PrismaUserDirectory implements UserDirectory {
  constructor(private readonly db: Db) {}
  async exists(userId: string): Promise<boolean> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return false;
    return (await this.db.user.count({ where: { id: userId, deletedAt: null } })) > 0;
  }
}
