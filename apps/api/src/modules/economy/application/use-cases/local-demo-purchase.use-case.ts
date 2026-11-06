import type { CommandBus } from '../../../../shared/application/command-bus.js';
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
 *
 * Idempotence (§12, B7) : la commande est réservée dans le CommandBus (acteur, opération,
 * Idempotency-Key). Même clé + même payload → l'action n'est PAS rejouée (seule la vue est
 * recalculée) ; même clé + payload différent → 409 IDEMPOTENCY_CONFLICT, rien n'est exécuté.
 */
export class LocalDemoPurchaseUseCase {
  constructor(
    private readonly provider: BillingProvider,
    private readonly control: LocalDemoControl | null,
    private readonly records: BillingRecordRepository,
    private readonly sync: SyncPurchasesUseCase,
    private readonly bus: CommandBus,
  ) {}

  async execute(userId: string, commandId: string, req: LocalDemoAction) {
    if (this.provider.mode !== 'LOCAL_DEMO' || !this.control) throw notConfigured('Achat de démonstration');
    const control = this.control;
    // Validation hors transaction (lecture catalogue), puis réservation + action sous la commande.
    const apply = await this.prepare(userId, commandId, req, control);
    await this.bus.execute({
      actorId: userId,
      operation: 'economy.local_demo_purchase',
      commandId,
      payload: req,
      handle: async (scope) => {
        await scope.lock.users([userId]);
        // État fournisseur de démo en mémoire (aucun réseau) : appliqué une seule fois par clé.
        apply();
        return { applied: true };
      },
    });
    return this.sync.execute(userId);
  }

  private async prepare(userId: string, commandId: string, req: LocalDemoAction, control: LocalDemoControl): Promise<() => void> {
    if (req.action === 'SUBSCRIBE' || req.action === 'BUY_COINS') {
      const product = (await this.records.listStoreProducts()).find((p) => p.id === req.productId && p.active);
      if (!product) throw notFound('Produit');
      if (req.action === 'SUBSCRIBE') {
        if (product.kind !== 'SUBSCRIPTION') throw notFound('Abonnement');
        const period = /_(weekly|monthly|annual)$/.exec(product.id)?.[1];
        const ms = period === 'weekly' ? DEMO_PERIOD_MS.P1W! : period === 'annual' ? DEMO_PERIOD_MS.P1Y! : DEMO_PERIOD_MS.P1M!;
        return () => control.startSubscription(userId, product.id, req.trial ? 3 * 86_400_000 : ms, req.trial);
      }
      if (product.kind !== 'CONSUMABLE_COINS') throw notFound('Pack de pièces');
      return () => control.buyConsumable(userId, product.id, commandId);
    }
    if (req.action === 'CANCEL') return () => control.cancelSubscription(userId);
    return () => control.expireSubscription(userId);
  }
}

