import type { CatalogItemDto, LedgerEntryDto, WalletResponse } from '@blowy/api-contract';
import type { CatalogItem, LedgerEntry } from '../../domain/index.js';
import type { InventoryRecord } from '../../application/ports/catalog.repository.js';

/** Mappers domaine → DTO (aucun champ interne exposé : clés d'idempotence, notes staff, metadata). */
export const toCatalogDto = (i: CatalogItem): CatalogItemDto => ({
  id: i.id,
  kind: i.kind,
  priceCoins: i.priceCoins,
  perUserLimit: i.perUserLimit,
  remainingStock: i.stockLimit === null ? null : Math.max(0, i.stockLimit - i.soldCount),
  labelKey: typeof i.metadata['labelKey'] === 'string' ? i.metadata['labelKey'] : null,
  variant: typeof i.metadata['variant'] === 'string' ? i.metadata['variant'] : null,
});

export const toLedgerDto = (e: LedgerEntry): LedgerEntryDto => ({
  id: e.id,
  amount: e.amount,
  balanceAfter: e.balanceAfter,
  reason: e.reason,
  source: e.source,
  causeType: e.causeType,
  createdAt: e.createdAt.toISOString(),
  reversesEntryId: e.reversesEntryId ?? null,
});

export const toInventoryDto = (i: InventoryRecord): NonNullable<WalletResponse['inventory']>[number] => ({
  id: i.id,
  catalogItemId: i.catalogItemId,
  status: i.status,
  acquiredAt: i.acquiredAt.toISOString(),
  expiresAt: i.expiresAt?.toISOString() ?? null,
});
