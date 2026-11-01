import type { UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import type { RelationshipReader } from '../../../../shared/application/ports/relationship-reader.port.js';
import type { SubscriptionState } from '@blowy/domain';
import { BLOWY_PLUS_ENTITLEMENT, deriveStateFromSnapshot } from '../../domain/index.js';
import type { BillingProvider } from '../ports/billing-provider.port.js';
import type { EntitlementRepository } from '../ports/entitlement.repository.js';
import type { UserDirectory } from '../ports/economy-config.port.js';
import type { EntitlementStateService } from '../entitlement-state.service.js';
import type { StoreCreditService } from '../store-credit.service.js';

export interface ReconcileResult {
  userId: string;
  states: { environment: string; state: SubscriptionState }[];
  consumablesCredited: number;
}

/**
 * Réconciliation serveur : l'état FOURNISSEUR fait autorité (GET subscriber).
 * 1. appel réseau HORS transaction ; 2. transaction : verrou User, application de l'état par
 *    environnement (sandbox/prod séparés), droits propres + dérivés, crédit des consommables
 *    non encore crédités (clé = transaction store).
 * Utilisée par POST /purchases/sync, le traitement des webhooks et le job périodique.
 * Aucune donnée du client n'est utilisée : seul l'identifiant de session (= appUserID).
 */
export class ReconcileCustomerUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly provider: BillingProvider,
    private readonly entitlements: EntitlementRepository,
    private readonly state: EntitlementStateService,
    private readonly credits: StoreCreditService,
    private readonly relationships: RelationshipReader,
    private readonly users: UserDirectory,
  ) {}

  async execute(userId: string): Promise<ReconcileResult> {
    if (!(await this.users.exists(userId))) return { userId, states: [], consumablesCredited: 0 };
    const snapshot = await this.provider.fetchCustomer(userId);
    const products = await this.credits.productsById();
    const plusProducts = new Set([...products.values()].filter((p) => p.kind === 'SUBSCRIPTION' && p.entitlementId === BLOWY_PLUS_ENTITLEMENT).map((p) => p.id));
    // Tout produit couvert par l'entitlement chez le fournisseur compte aussi (catalogue store élargi).
    snapshot.entitlements.filter((e) => e.entitlementId === BLOWY_PLUS_ENTITLEMENT).forEach((e) => plusProducts.add(e.productId));
    const partner = await this.relationships.findMovedInPartner(userId);

    return this.uow.run(async (scope) => {
      await scope.lock.users([userId]);
      const before = await this.state.keysOf(userId, scope.now, scope);
      const existing = await this.entitlements.lockSubscriptions(scope, userId);
      const derived = deriveStateFromSnapshot(snapshot, BLOWY_PLUS_ENTITLEMENT, plusProducts, scope.now);
      // Un abonnement connu localement mais absent du snapshot (transfert vers un autre appUserID) → REVOKED.
      for (const sub of existing) {
        if (sub.provider !== this.provider.kind) continue;
        if (!derived.some((d) => d.environment === sub.environment) && sub.state !== 'NONE' && sub.state !== 'EXPIRED' && sub.state !== 'REVOKED') {
          derived.push({ environment: sub.environment, state: 'REVOKED', productId: sub.productId, store: sub.store, periodType: sub.periodType, currentPeriodEndsAt: sub.currentPeriodEndsAt, gracePeriodEndsAt: null });
        }
      }
      for (const d of derived) await this.state.applyState(scope, userId, d, { reconciledAt: snapshot.fetchedAt });

      let consumablesCredited = 0;
      for (const c of snapshot.consumables) {
        if (!c.storeTransactionId) continue;
        const outcome = await this.credits.creditConsumable(
          scope,
          { userId, provider: this.provider.kind, environment: c.environment, store: c.store, storeTransactionId: c.storeTransactionId, productId: c.productId, purchasedAt: c.purchasedAt },
          products.get(c.productId),
          this.state.accepted,
        );
        if (outcome === 'CREDITED') consumablesCredited++;
      }
      await this.state.syncDerivedAndCapacity(scope, userId, before, partner);
      return { userId, states: derived.map((d) => ({ environment: d.environment, state: d.state })), consumablesCredited };
    });
  }
}
