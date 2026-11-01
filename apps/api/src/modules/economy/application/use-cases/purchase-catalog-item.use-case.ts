import type { CommandBus } from '../../../../shared/application/command-bus.js';
import { LedgerKeys, notFound, planCatalogPurchase } from '../../domain/index.js';
import type { CatalogRepository } from '../ports/catalog.repository.js';
import type { LedgerRepository } from '../ports/ledger.repository.js';
import type { EconomyParamsProvider } from '../ports/economy-config.port.js';
import { ECONOMY_TOPICS } from '../economy-events.js';

export interface CatalogPurchaseResult {
  itemId: string;
  inventoryItemId: string;
  priceCoins: number;
  balance: number;
  ledgerEntryId: string;
  expiresAt: string | null;
}

/**
 * Achat d'un objet catalogue en pièces — transactionnel objet + ledger.
 * Ordre des verrous : users → wallets → (catalogue). Idempotent par (acteur, opération, commandId)
 * via le CommandBus ET par la clé ledger `catalog:<user>:<commandId>` (double garde).
 */
export class PurchaseCatalogItemUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly ledger: LedgerRepository,
    private readonly catalog: CatalogRepository,
    private readonly params: EconomyParamsProvider,
  ) {}

  execute(actorId: string, commandId: string, itemId: string) {
    return this.bus.execute<{ itemId: string }, CatalogPurchaseResult>({
      actorId,
      operation: 'economy.catalog_purchase',
      commandId,
      payload: { itemId },
      handle: async (scope) => {
        await scope.lock.users([actorId]);
        const wallet = await this.ledger.lockWallet(scope, actorId);
        const item = await this.catalog.lockItem(scope, itemId);
        if (!item) throw notFound('Objet');
        const plan = planCatalogPurchase(item, {
          now: scope.now,
          params: this.params.current(),
          ownedCount: await this.catalog.countOwned(scope, actorId, itemId),
          availableFreezes: await this.catalog.countAvailableFreezes(scope, actorId, scope.now),
          hasActiveBoost: await this.catalog.hasActiveBoost(scope, actorId, scope.now),
        });
        const { entry, wallet: after } = await this.ledger.append(scope, wallet, {
          amount: -plan.priceCoins,
          reason: 'CATALOG_PURCHASE',
          source: 'CATALOG',
          idempotencyKey: LedgerKeys.catalogPurchase(actorId, commandId),
          causeType: 'catalog_item',
          causeId: itemId,
          metadata: { kind: item.kind, tuningVersion: this.params.current().tuningVersion },
        });
        const inv = await this.catalog.createInventory(scope, {
          userId: actorId,
          catalogItemId: itemId,
          status: plan.inventoryStatus,
          expiresAt: plan.inventoryExpiresAt,
          ledgerEntryId: entry.id,
          commandId,
          metadata: plan.effect.type === 'ADD_COSMETIC' ? { variant: plan.effect.variant } : plan.effect.type === 'ACTIVATE_BOOST' ? { exposureAdjustment: plan.effect.exposureAdjustment } : {},
        });
        await this.catalog.incrementSold(scope, itemId);
        if (plan.effect.type === 'GRANT_STREAK_FREEZE') {
          await this.catalog.grantFreezes(scope, { userId: actorId, count: 1, source: 'CATALOG_PURCHASE', inventoryItemId: inv.id, grantedAt: scope.now, expiresAt: null });
        } else if (plan.effect.type === 'ACTIVATE_BOOST') {
          await scope.outbox.emit({
            topic: ECONOMY_TOPICS.BOOST_ACTIVATED,
            aggregateType: 'User',
            aggregateId: actorId,
            payload: { userId: actorId, inventoryItemId: inv.id, exposureAdjustment: plan.effect.exposureAdjustment, expiresAt: plan.effect.expiresAt.toISOString() },
          });
        }
        return {
          itemId,
          inventoryItemId: inv.id,
          priceCoins: plan.priceCoins,
          balance: after.balance,
          ledgerEntryId: entry.id,
          expiresAt: plan.inventoryExpiresAt?.toISOString() ?? null,
        };
      },
    });
  }
}
