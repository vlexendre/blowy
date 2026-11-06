import type { GrantMonthlyBenefitsUseCase } from '../application/use-cases/grant-monthly-benefits.use-case.js';
import type { ExpireDerivedEntitlementsUseCase, PeriodicReconciliationUseCase, RefundExpiredBoostsUseCase } from '../application/use-cases/entitlement-jobs.use-case.js';
import type { ProcessWebhookEventUseCase } from '../application/use-cases/process-webhook.use-case.js';
import type { BillingRecordRepository } from '../application/ports/billing-record.repository.js';
import type { ProcessRefundsUseCase } from '../application/payments/payments.use-cases.js';
import type { HandleStripeWebhookUseCase } from '../application/payments/stripe-webhook.use-case.js';

/**
 * Jobs planifiés du module économie (exécutés par worker.ts ; tous idempotents et rejouables).
 * Cadences proposées : monthly = toutes les heures (rattrape tout titulaire non versé du mois),
 * reconcile = toutes les 15 min, derivedExpiry/boostRefund = toutes les 15 min, webhookRetry = 5 min.
 */
export interface EconomyJob {
  readonly name: string;
  readonly everyMs: number;
  run(): Promise<unknown>;
}

export class EconomyJobs {
  constructor(
    private readonly monthly: GrantMonthlyBenefitsUseCase,
    private readonly reconcile: PeriodicReconciliationUseCase,
    private readonly derived: ExpireDerivedEntitlementsUseCase,
    private readonly boosts: RefundExpiredBoostsUseCase,
    private readonly webhooks: ProcessWebhookEventUseCase,
    private readonly records: BillingRecordRepository,
    private readonly refunds?: ProcessRefundsUseCase,
    private readonly stripe?: HandleStripeWebhookUseCase,
  ) {}

  /**
   * V5 (D-020) : `economy.monthly_benefits` (200 pièces + 2 gels) n'est plus planifié — pièces gelées,
   * gels retirés. Nouveau : `economy.refunds` (1 min, spec §7.8) exécute les remboursements carte.
   */
  /** Versement mensuel V4 conservé (non câblé, spec §6.1) : exécutable seulement à la main (rattrapage). */
  get retiredMonthlyBenefits(): GrantMonthlyBenefitsUseCase {
    return this.monthly;
  }

  list(): EconomyJob[] {
    return [
      ...(this.refunds ? [{ name: 'economy.refunds', everyMs: 60_000, run: () => this.refunds!.run() }] : []),
      { name: 'economy.reconcile_subscriptions', everyMs: 15 * 60_000, run: () => this.reconcile.run() },
      { name: 'economy.expire_derived_entitlements', everyMs: 15 * 60_000, run: () => this.derived.run() },
      { name: 'economy.refund_expired_boosts', everyMs: 15 * 60_000, run: () => this.boosts.run() },
      { name: 'economy.retry_webhooks', everyMs: 5 * 60_000, run: () => this.retryWebhooks() },
    ];
  }

  private async retryWebhooks(): Promise<number> {
    const pending = await this.records.listRetryableWebhooks(50, 8);
    let n = 0;
    for (const w of pending) {
      try {
        if (w.provider === 'stripe') {
          if (this.stripe) await this.stripe.retry(w.id);
        } else await this.webhooks.execute(w.id);
        n++;
      } catch {
        /* échec tracé dans l'événement (lastError) ; repris au prochain passage */
      }
    }
    return n;
  }
}
