import { notConfigured, notFound } from '../../domain/index.js';
import type { BillingProvider } from '../ports/billing-provider.port.js';
import type { BillingRecordRepository } from '../ports/billing-record.repository.js';
import type { SyncPurchasesUseCase } from './sync-purchases.use-case.js';

/** Contrôle du fournisseur de démo (sous-ensemble implémenté par LocalDemoBillingProvider). */
export interface LocalDemoControl {
  startSubscription(appUserId: string, productId: string, durationMs: number, trial: boolean): void;
  cancelSubscription(appUserId: string): void;
  expireSubscription(appUserId: string): void;
  buyConsumable(appUserId: string, productId: string, transactionKey: string): void;
}

export type LocalDemoAction =
  | { action: 'SUBSCRIBE'; productId: string; trial: boolean }
  | { action: 'CANCEL' }
  | { action: 'EXPIRE' }
  | { action: 'BUY_COINS'; productId: string };

const DEMO_PERIOD_MS: Record<string, number> = { P1W: 7 * 86_400_000, P1M: 30 * 86_400_000, P1Y: 365 * 86_400_000 };

/**
 * Achat de DÉMONSTRATION (BILLING_PROVIDER=local_demo, hors production). Passe par le MÊME
 * chemin que la production : modification de l'état « fournisseur » puis réconciliation serveur.
 * Réponse étiquetée LOCAL_DEMO via la vue d'abonnement.
 */
export class LocalDemoPurchaseUseCase {
  constructor(
    private readonly provider: BillingProvider,
    private readonly control: LocalDemoControl | null,
    private readonly records: BillingRecordRepository,
    private readonly sync: SyncPurchasesUseCase,
  ) {}

  async execute(userId: string, commandId: string, req: LocalDemoAction) {
    if (this.provider.mode !== 'LOCAL_DEMO' || !this.control) throw notConfigured('Achat de démonstration');
    if (req.action === 'SUBSCRIBE' || req.action === 'BUY_COINS') {
      const product = (await this.records.listStoreProducts()).find((p) => p.id === req.productId && p.active);
      if (!product) throw notFound('Produit');
      if (req.action === 'SUBSCRIBE') {
        if (product.kind !== 'SUBSCRIPTION') throw notFound('Abonnement');
        const period = /_(weekly|monthly|annual)$/.exec(product.id)?.[1];
        const ms = period === 'weekly' ? DEMO_PERIOD_MS.P1W! : period === 'annual' ? DEMO_PERIOD_MS.P1Y! : DEMO_PERIOD_MS.P1M!;
        this.control.startSubscription(userId, product.id, req.trial ? 3 * 86_400_000 : ms, req.trial);
      } else {
        if (product.kind !== 'CONSUMABLE_COINS') throw notFound('Pack de pièces');
        this.control.buyConsumable(userId, product.id, commandId);
      }
    } else if (req.action === 'CANCEL') this.control.cancelSubscription(userId);
    else this.control.expireSubscription(userId);
    return this.sync.execute(userId);
  }
}

