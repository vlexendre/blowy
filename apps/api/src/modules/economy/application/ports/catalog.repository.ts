import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { CatalogItem, InventoryStatus, StreakSnapshot } from '../../domain/index.js';

export interface InventoryRecord {
  readonly id: string;
  readonly userId: string;
  readonly catalogItemId: string;
  readonly status: InventoryStatus;
  readonly acquiredAt: Date;
  readonly expiresAt: Date | null;
  readonly ledgerEntryId: string | null;
  readonly metadata: Record<string, unknown>;
}

export type FreezeSource = 'CATALOG_PURCHASE' | 'MONTHLY_BENEFIT' | 'STAFF_GRANT';

/** Catalogue, inventaire, séries et gels (tables écrites par economy uniquement). */
export interface CatalogRepository {
  listActive(): Promise<CatalogItem[]>;
  /** Verrouille la ligne catalogue (stock) — FOR UPDATE après le verrou wallet. */
  lockItem(scope: TxScope, itemId: string): Promise<CatalogItem | null>;
  incrementSold(scope: TxScope, itemId: string): Promise<void>;
  countOwned(scope: TxScope, userId: string, itemId: string): Promise<number>;
  hasActiveBoost(scope: TxScope, userId: string, now: Date): Promise<boolean>;
  createInventory(scope: TxScope, data: { userId: string; catalogItemId: string; status: InventoryStatus; expiresAt: Date | null; ledgerEntryId: string; commandId: string; metadata: Record<string, unknown> }): Promise<InventoryRecord>;
  listInventory(userId: string): Promise<InventoryRecord[]>;
  /** Boosts ACTIVE expirés non consommés (job de remboursement). */
  listExpiredBoosts(now: Date, limit: number): Promise<InventoryRecord[]>;
  /** Transition conditionnelle ACTIVE → status ; renvoie false si déjà transitée (idempotent). */
  transitionInventory(scope: TxScope, id: string, from: InventoryStatus, to: InventoryStatus, data: { at: Date; consumedRef?: string }): Promise<boolean>;

  /** Verrouille les gels AVAILABLE (FOR UPDATE) — consommation atomique. */
  lockAvailableFreezes(scope: TxScope, userId: string, now: Date): Promise<{ id: string; source: FreezeSource }[]>;
  countAvailableFreezes(scope: TxScope | null, userId: string, now: Date): Promise<number>;
  grantFreezes(scope: TxScope, data: { userId: string; count: number; source: FreezeSource; inventoryItemId?: string | null; monthlyBenefitGrantId?: string | null; grantedAt: Date; expiresAt: Date | null }): Promise<void>;
  consumeFreeze(scope: TxScope, freezeId: string, protectedDay: string, at: Date): Promise<void>;
  /** Verrouille la série (FOR UPDATE) ; null si l'utilisateur n'a jamais eu de série. */
  lockStreak(scope: TxScope, userId: string): Promise<(StreakSnapshot & { timeZone: string }) | null>;
  coverStreakDay(scope: TxScope, userId: string, day: string, expectedVersion: number): Promise<void>;
}
export const CATALOG_REPOSITORY = Symbol('CatalogRepository');
