import type { GrantMonthlyBenefitsUseCase } from '../application/use-cases/grant-monthly-benefits.use-case.js';
import type { ExpireDerivedEntitlementsUseCase, PeriodicReconciliationUseCase, RefundExpiredBoostsUseCase } from '../application/use-cases/entitlement-jobs.use-case.js';
import type { ProcessWebhookEventUseCase } from '../application/use-cases/process-webhook.use-case.js';
import type { BillingRecordRepository } from '../application/ports/billing-record.repository.js';

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
  ) {}

  list(): EconomyJob[] {
    return [
      { name: 'economy.monthly_benefits', everyMs: 3_600_000, run: () => this.monthly.runBatch() },
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
        await this.webhooks.execute(w.id);
        n++;
      } catch {
        /* échec tracé dans l'événement (lastError) ; repris au prochain passage */
      }
    }
    return n;
  }
}
