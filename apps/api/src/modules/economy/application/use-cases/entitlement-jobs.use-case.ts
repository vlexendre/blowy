import type { EntitlementKey } from '@blowy/domain';
import type { TxScope, UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import type { Clock } from '../../../../shared/application/clock.js';
import { LedgerKeys } from '../../domain/index.js';
import type { CatalogRepository } from '../ports/catalog.repository.js';
import type { EntitlementRepository } from '../ports/entitlement.repository.js';
import type { LedgerRepository } from '../ports/ledger.repository.js';
import type { EntitlementStateService } from '../entitlement-state.service.js';
import type { ReconcileCustomerUseCase } from './reconcile-customer.use-case.js';

/**
 * Événements relations (outbox C) → droits dérivés.
 * - moved_in : chaque membre titulaire propage un droit dérivé à l'autre (non transitif).
 * - ended : révocation des dérivés liés à la relation + réduction de capacité éventuelle.
 */
export class RelationshipEntitlementsUseCase {
  constructor(
    private readonly repo: EntitlementRepository,
    private readonly state: EntitlementStateService,
  ) {}

  /** Exécuté dans la portée du consommateur outbox (déduplication dans la même transaction). */
  async onMovedIn(scope: TxScope, relationshipId: string, userIds: readonly string[]): Promise<void> {
    const [a, b] = userIds;
    if (!a || !b || a === b) return;
    await scope.lock.users([a, b]);
    for (const [holder, partner] of [[a, b], [b, a]] as const) {
      const before = await this.state.keysOf(holder, scope.now, scope);
      await this.state.syncDerivedAndCapacity(scope, holder, before, { partnerUserId: partner, relationshipId });
    }
  }

  async onEnded(scope: TxScope, relationshipId: string, userIds: readonly string[]): Promise<number> {
    if (userIds.length) await scope.lock.users([...userIds]);
    const before = new Map<string, Set<EntitlementKey>>();
    for (const u of userIds) before.set(u, await this.state.keysOf(u, scope.now, scope));
    const revoked = await this.repo.revokeDerivedForRelationship(scope, relationshipId, 'RELATIONSHIP_ENDED');
    for (const g of revoked) {
      const prior = before.get(g.beneficiaryUserId);
      if (prior) await this.state.emitChanged(scope, g.beneficiaryUserId, prior);
    }
    return revoked.length;
  }
}

/** Job : clôture des droits dérivés échus (échéance de la source passée sans renouvellement). */
export class ExpireDerivedEntitlementsUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly repo: EntitlementRepository,
    private readonly state: EntitlementStateService,
    private readonly clock: Clock,
  ) {}
  async run(limit = 200): Promise<number> {
    const expired = await this.repo.listExpiredDerived(this.clock.now(), limit);
    for (const g of expired) {
      await this.uow.run(async (scope) => {
        await scope.lock.users([g.beneficiaryUserId]);
        const before = new Set(await this.state.keysOf(g.beneficiaryUserId, new Date(g.endsAt!.getTime() - 1), scope));
        await this.repo.revokeGrant(scope, g.id, 'SOURCE_EXPIRED');
        await this.state.emitChanged(scope, g.beneficiaryUserId, before);
      });
    }
    return expired.length;
  }
}

/**
 * Job : boosts non consommés à expiration → remboursement intégral (écriture BOOST_NOT_CONSUMED_REFUND).
 * Un boost consommé par matching (transition ACTIVE→CONSUMED) n'est jamais remboursé.
 */
export class RefundExpiredBoostsUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly catalog: CatalogRepository,
    private readonly ledger: LedgerRepository,
    private readonly clock: Clock,
  ) {}
  async run(limit = 200): Promise<number> {
    const boosts = await this.catalog.listExpiredBoosts(this.clock.now(), limit);
    let refunded = 0;
    for (const b of boosts) {
      await this.uow.run(async (scope) => {
        await scope.lock.users([b.userId]);
        const wallet = await this.ledger.lockWallet(scope, b.userId);
        if (!(await this.catalog.transitionInventory(scope, b.id, 'ACTIVE', 'REFUNDED', { at: scope.now }))) return;
        const original = b.ledgerEntryId ? await this.ledger.findById(scope, b.ledgerEntryId) : null;
        if (!original || original.amount >= 0) return;
        await this.ledger.append(scope, wallet, {
          amount: -original.amount,
          reason: 'BOOST_NOT_CONSUMED_REFUND',
          source: 'CATALOG',
          idempotencyKey: LedgerKeys.boostRefund(b.id),
          causeType: 'visibility_boost_expired',
          causeId: b.id,
          reversesEntryId: original.id,
        });
        refunded++;
      });
    }
    return refunded;
  }
}

/** Consommation d'un boost par le matching (appelée via port par l'agent matching, idempotente). */
export class ConsumeBoostUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly catalog: CatalogRepository,
  ) {}
  async execute(userId: string, inventoryItemId: string, matchBatchId: string): Promise<boolean> {
    return this.uow.run(async (scope) => {
      await scope.lock.users([userId]);
      const inv = (await this.catalog.listInventory(userId)).find((i) => i.id === inventoryItemId);
      if (!inv || inv.expiresAt === null || inv.expiresAt <= scope.now) return false;
      return this.catalog.transitionInventory(scope, inventoryItemId, 'ACTIVE', 'CONSUMED', { at: scope.now, consumedRef: matchBatchId });
    });
  }
}

/** Job : réconciliation périodique des abonnements à échéance/obsolètes avec l'autorité fournisseur. */
export class PeriodicReconciliationUseCase {
  constructor(
    private readonly repo: EntitlementRepository,
    private readonly reconcile: ReconcileCustomerUseCase,
    private readonly clock: Clock,
    private readonly staleAfterMs = 24 * 3_600_000,
  ) {}
  async run(limit = 100): Promise<{ reconciled: number; failed: number }> {
    const now = this.clock.now();
    const subs = await this.repo.listSubscriptionsToReconcile(now, new Date(now.getTime() - this.staleAfterMs), limit);
    let reconciled = 0;
    let failed = 0;
    for (const userId of new Set(subs.map((s) => s.userId))) {
      try {
        await this.reconcile.execute(userId);
        reconciled++;
      } catch {
        failed++; // fournisseur indisponible : réessayé au prochain passage
      }
    }
    return { reconciled, failed };
  }
}

