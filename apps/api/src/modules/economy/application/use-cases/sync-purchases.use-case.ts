import type { SubscriptionView } from './queries.js';
import type { GetMySubscriptionQuery } from './queries.js';
import type { ReconcileCustomerUseCase } from './reconcile-customer.use-case.js';

/**
 * POST /v1/purchases/sync — appelé par le mobile après purchasePackage/restorePurchases.
 * Le corps éventuel du client est IGNORÉ (aucune confiance) : seul l'utilisateur de session
 * (= appUserID RevenueCat) est réconcilié auprès du fournisseur, puis l'état serveur est renvoyé.
 * Idempotent par nature (la réconciliation converge vers l'état fournisseur).
 */
export class SyncPurchasesUseCase {
  constructor(
    private readonly reconcile: ReconcileCustomerUseCase,
    private readonly view: GetMySubscriptionQuery,
  ) {}

  async execute(userId: string): Promise<{ subscription: SubscriptionView; consumablesCredited: number }> {
    const r = await this.reconcile.execute(userId);
    return { subscription: await this.view.execute(userId), consumablesCredited: r.consumablesCredited };
  }
}
