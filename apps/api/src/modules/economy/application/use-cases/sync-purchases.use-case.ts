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
    /** V5.4 (C.10) : faux quand Blowy+ passe par Stripe Billing — aucun appel au store, état serveur renvoyé tel quel. */
    private readonly iapEnabled: () => boolean = () => true,
  ) {}

  async execute(userId: string): Promise<{ subscription: SubscriptionView; consumablesCredited: number }> {
    if (!this.iapEnabled()) return { subscription: await this.view.execute(userId), consumablesCredited: 0 };
    const r = await this.reconcile.execute(userId);
    return { subscription: await this.view.execute(userId), consumablesCredited: r.consumablesCredited };
  }
}
