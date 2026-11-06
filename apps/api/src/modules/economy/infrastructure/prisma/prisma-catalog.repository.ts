import { uuidv7, type Db } from '@blowy/database';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import { txOf } from '../../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { CatalogItem, InventoryStatus, StreakSnapshot } from '../../domain/index.js';
import type { CatalogRepository, FreezeSource, InventoryRecord } from '../../application/ports/catalog.repository.js';

type ItemRow = { id: string; kind: string; priceCoins: number; active: boolean; perUserLimit: number | null; stockLimit: number | null; soldCount: number; metadata: unknown };
const toItem = (r: ItemRow): CatalogItem => ({ ...r, kind: r.kind as CatalogItem['kind'], metadata: (r.metadata ?? {}) as Record<string, unknown> });
type InvRow = { id: string; userId: string; catalogItemId: string; status: string; acquiredAt: Date; expiresAt: Date | null; ledgerEntryId: string | null; metadata: unknown };
const toInv = (r: InvRow): InventoryRecord => ({ ...r, status: r.status as InventoryStatus, metadata: (r.metadata ?? {}) as Record<string, unknown> });

const availableFreezeWhere = (userId: string, now: Date) => ({ userId, status: 'AVAILABLE' as const, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly db: Db) {}

  async listActive(): Promise<CatalogItem[]> {
    return (await this.db.catalogItem.findMany({ where: { active: true }, orderBy: [{ kind: 'asc' }, { id: 'asc' }] })).map(toItem);
  }

  async lockItem(scope: TxScope, itemId: string): Promise<CatalogItem | null> {
    const tx = txOf(scope);
    await tx.$queryRaw`SELECT 1 FROM "CatalogItem" WHERE id = ${itemId} FOR NO KEY UPDATE`;
    const r = await tx.catalogItem.findUnique({ where: { id: itemId } });
    return r ? toItem(r) : null;
  }

  async incrementSold(scope: TxScope, itemId: string): Promise<void> {
    await txOf(scope).catalogItem.update({ where: { id: itemId }, data: { soldCount: { increment: 1 } } });
  }

  countOwned(scope: TxScope, userId: string, itemId: string): Promise<number> {
    return txOf(scope).inventoryItem.count({ where: { userId, catalogItemId: itemId, status: { in: ['OWNED', 'ACTIVE'] } } });
  }

  async hasActiveBoost(scope: TxScope, userId: string, now: Date): Promise<boolean> {
    const n = await txOf(scope).inventoryItem.count({ where: { userId, status: 'ACTIVE', catalogItem: { kind: 'VISIBILITY_BOOST' }, expiresAt: { gt: now } } });
    return n > 0;
  }

  async createInventory(scope: TxScope, d: { userId: string; catalogItemId: string; status: InventoryStatus; expiresAt: Date | null; ledgerEntryId: string; commandId: string; metadata: Record<string, unknown> }): Promise<InventoryRecord> {
    const r = await txOf(scope).inventoryItem.create({
      data: {
        id: uuidv7(scope.now.getTime()),
        userId: d.userId,
        catalogItemId: d.catalogItemId,
        status: d.status,
        acquiredAt: scope.now,
        activatedAt: d.status === 'ACTIVE' ? scope.now : null,
        consumedAt: d.status === 'CONSUMED' ? scope.now : null,
        expiresAt: d.expiresAt,
        ledgerEntryId: d.ledgerEntryId,
        commandId: d.commandId,
        metadata: d.metadata as object,
      },
    });
    return toInv(r);
  }

  async listInventory(userId: string): Promise<InventoryRecord[]> {
    return (await this.db.inventoryItem.findMany({ where: { userId }, orderBy: { acquiredAt: 'desc' }, take: 500 })).map(toInv);
  }

  async listExpiredBoosts(now: Date, limit: number): Promise<InventoryRecord[]> {
    return (await this.db.inventoryItem.findMany({ where: { status: 'ACTIVE', expiresAt: { lte: now }, catalogItem: { kind: 'VISIBILITY_BOOST' } }, orderBy: { expiresAt: 'asc' }, take: limit })).map(toInv);
  }

  async transitionInventory(scope: TxScope, id: string, from: InventoryStatus, to: InventoryStatus, data: { at: Date; consumedRef?: string }): Promise<boolean> {
    const r = await txOf(scope).inventoryItem.updateMany({
      where: { id, status: from },
      data: { status: to, ...(to === 'CONSUMED' || to === 'REFUNDED' || to === 'EXPIRED' ? { consumedAt: data.at } : {}), ...(data.consumedRef ? { consumedRef: data.consumedRef } : {}) },
    });
    return r.count === 1;
  }

  async lockAvailableFreezes(scope: TxScope, userId: string, now: Date): Promise<{ id: string; source: FreezeSource }[]> {
    const tx = txOf(scope);
    const rows = await tx.$queryRaw<{ id: string; source: FreezeSource }[]>`
      SELECT id::text AS id, source::text AS source FROM "StreakFreeze"
      WHERE "userId" = ${userId}::uuid AND status = 'AVAILABLE' AND ("expiresAt" IS NULL OR "expiresAt" > ${now})
      ORDER BY "grantedAt", id FOR UPDATE`;
    return rows;
  }

  countAvailableFreezes(scope: TxScope | null, userId: string, now: Date): Promise<number> {
    const client = scope ? txOf(scope) : this.db;
    return client.streakFreeze.count({ where: availableFreezeWhere(userId, now) });
  }

  async grantFreezes(scope: TxScope, d: { userId: string; count: number; source: FreezeSource; inventoryItemId?: string | null; monthlyBenefitGrantId?: string | null; grantedAt: Date; expiresAt: Date | null }): Promise<void> {
    const tx = txOf(scope);
    for (let i = 0; i < d.count; i++) {
      await tx.streakFreeze.create({
        data: {
          id: uuidv7(scope.now.getTime()),
          userId: d.userId,
          source: d.source,
          status: 'AVAILABLE',
          grantedAt: d.grantedAt,
          inventoryItemId: i === 0 ? (d.inventoryItemId ?? null) : null,
          monthlyBenefitGrantId: d.monthlyBenefitGrantId ?? null,
          expiresAt: d.expiresAt,
        },
      });
    }
  }

  async consumeFreeze(scope: TxScope, freezeId: string, protectedDay: string, at: Date): Promise<void> {
    const r = await txOf(scope).streakFreeze.updateMany({ where: { id: freezeId, status: 'AVAILABLE' }, data: { status: 'CONSUMED', consumedAt: at, protectedDay } });
    if (r.count !== 1) throw new Error('Gel déjà consommé');
  }

  async lockStreak(scope: TxScope, userId: string): Promise<(StreakSnapshot & { timeZone: string }) | null> {
    const tx = txOf(scope);
    await tx.$queryRaw`SELECT 1 FROM "Streak" WHERE "userId" = ${userId}::uuid FOR UPDATE`;
    const s = await tx.streak.findUnique({ where: { userId } });
    return s ? { userId: s.userId, length: s.length, lastCoveredDay: s.lastCoveredDay, version: s.version, timeZone: s.timeZone } : null;
  }

  async coverStreakDay(scope: TxScope, userId: string, day: string, expectedVersion: number): Promise<void> {
    const r = await txOf(scope).streak.updateMany({ where: { userId, version: expectedVersion }, data: { lastCoveredDay: day, version: { increment: 1 } } });
    if (r.count !== 1) throw new Error('Série modifiée hors verrou');
  }
}
