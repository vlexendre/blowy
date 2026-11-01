import type { BillingProvider } from '../../application/ports/billing-provider.port.js';
import type { BillingEnvironment, ProviderConsumable, ProviderCustomerSnapshot, ProviderSubscription } from '../../domain/index.js';
import { BLOWY_PLUS_ENTITLEMENT } from '../../domain/index.js';

/**
 * Fournisseur de DÉMONSTRATION locale — déterministe, sans réseau, INTERDIT en production
 * (refusé par loadEconomyConfig). Toutes les réponses portent le mode LOCAL_DEMO ; aucune
 * transaction réelle n'est simulée comme « réussie » chez un store.
 * L'état « fournisseur » est tenu en mémoire et piloté par `LocalDemoPurchaseUseCase`
 * (endpoint /v1/purchases/local-demo, monté hors production uniquement).
 */
export class LocalDemoBillingProvider implements BillingProvider {
  readonly kind = 'LOCAL_DEMO' as const;
  readonly mode = 'LOCAL_DEMO' as const;
  readonly acceptedEnvironments: ReadonlySet<BillingEnvironment> = new Set(['LOCAL_DEMO']);
  private readonly subs = new Map<string, ProviderSubscription[]>();
  private readonly consumables = new Map<string, ProviderConsumable[]>();

  constructor(private readonly now: () => Date) {}

  /** Abonnement de démo de durée fixe (déterministe : dépend seulement de `now`). */
  startSubscription(appUserId: string, productId: string, durationMs: number, trial: boolean): void {
    const at = this.now();
    this.subs.set(appUserId, [
      {
        productId,
        store: 'LOCAL_DEMO',
        environment: 'LOCAL_DEMO',
        periodType: trial ? 'TRIAL' : 'NORMAL',
        purchasedAt: at,
        expiresAt: new Date(at.getTime() + durationMs),
        gracePeriodExpiresAt: null,
        unsubscribeDetectedAt: null,
        billingIssuesDetectedAt: null,
        refundedAt: null,
        storeTransactionId: `demo-sub-${appUserId}-${at.getTime()}`,
      },
    ]);
  }

  cancelSubscription(appUserId: string): void {
    const list = this.subs.get(appUserId);
    if (list) this.subs.set(appUserId, list.map((s) => ({ ...s, unsubscribeDetectedAt: this.now() })));
  }

  expireSubscription(appUserId: string): void {
    const list = this.subs.get(appUserId);
    if (list) this.subs.set(appUserId, list.map((s) => ({ ...s, expiresAt: new Date(this.now().getTime() - 1) })));
  }

  /** Achat consommable de démo : l'identifiant de transaction est fourni par l'appelant (clé d'idempotence). */
  buyConsumable(appUserId: string, productId: string, transactionKey: string): void {
    const list = this.consumables.get(appUserId) ?? [];
    const storeTransactionId = `demo-${appUserId}-${transactionKey}`;
    if (!list.some((c) => c.storeTransactionId === storeTransactionId)) {
      list.push({ productId, environment: 'LOCAL_DEMO', store: 'LOCAL_DEMO', storeTransactionId, purchasedAt: this.now() });
    }
    this.consumables.set(appUserId, list);
  }

  async fetchCustomer(appUserId: string): Promise<ProviderCustomerSnapshot> {
    const subs = this.subs.get(appUserId) ?? [];
    const live = subs.find((s) => s.expiresAt && s.expiresAt > this.now());
    return {
      appUserId,
      fetchedAt: this.now(),
      entitlements: live ? [{ entitlementId: BLOWY_PLUS_ENTITLEMENT, productId: live.productId, expiresAt: live.expiresAt, gracePeriodExpiresAt: null }] : [],
      subscriptions: subs,
      consumables: this.consumables.get(appUserId) ?? [],
    };
  }
}
