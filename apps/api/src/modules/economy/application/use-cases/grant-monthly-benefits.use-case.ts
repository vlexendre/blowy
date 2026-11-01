import type { UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import type { Clock } from '../../../../shared/application/clock.js';
import { LedgerKeys, isMonthlyBenefitEligible, liveAcceptedGrants, monthlyPeriod } from '../../domain/index.js';
import type { CatalogRepository } from '../ports/catalog.repository.js';
import type { EntitlementRepository } from '../ports/entitlement.repository.js';
import type { LedgerRepository } from '../ports/ledger.repository.js';
import type { EconomyParamsProvider } from '../ports/economy-config.port.js';
import type { EntitlementStateService } from '../entitlement-state.service.js';

/**
 * Job « bénéfices mensuels Blowy+ » : 200 pièces + 2 gels (tuning) au TITULAIRE payant seulement,
 * une fois par (user, mois UTC). Idempotent : contrainte UNIQUE MonthlyBenefitGrant(userId, period)
 * + clé ledger `monthly:<user>:<period>` ; rejouer le job ne verse rien de plus.
 * Jamais versé aux bénéficiaires dérivés, ni pendant l'essai, ni sur un grant staff.
 */
export class GrantMonthlyBenefitsUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly ledger: LedgerRepository,
    private readonly catalog: CatalogRepository,
    private readonly entitlements: EntitlementRepository,
    private readonly state: EntitlementStateService,
    private readonly params: EconomyParamsProvider,
    private readonly clock: Clock,
  ) {}

  /** Traite un utilisateur (utilisable aussi après une réconciliation). */
  async grantFor(userId: string): Promise<'GRANTED' | 'ALREADY' | 'NOT_ELIGIBLE'> {
    return this.uow.run(async (scope) => {
      await scope.lock.users([userId]);
      const period = monthlyPeriod(scope.now);
      if (await this.entitlements.hasMonthlyBenefit(scope, userId, period)) return 'ALREADY';
      const subs = await this.entitlements.lockSubscriptions(scope, userId);
      const grants = liveAcceptedGrants(await this.entitlements.listLiveGrants(userId, scope.now, scope), scope.now, this.state.accepted);
      const own = grants.find((g) => g.beneficiaryUserId === userId && (g.source === 'STORE_SUBSCRIPTION' || g.source === 'LOCAL_DEMO') && g.subscriptionId);
      const sub = own ? subs.find((s) => s.id === own.subscriptionId) : undefined;
      if (!own || !sub || !isMonthlyBenefitEligible(sub.state, true)) return 'NOT_ELIGIBLE';
      const p = this.params.current();
      const wallet = await this.ledger.lockWallet(scope, userId);
      const { entry } = await this.ledger.append(scope, wallet, {
        amount: p.plusMonthlyCoins,
        reason: 'MONTHLY_BENEFIT',
        source: 'SUBSCRIPTION',
        idempotencyKey: LedgerKeys.monthlyBenefit(userId, period),
        causeType: 'monthly_benefit',
        causeId: period,
        metadata: { subscriptionId: sub.id, tuningVersion: p.tuningVersion },
      });
      const grant = await this.entitlements.insertMonthlyBenefit(scope, {
        userId,
        period,
        subscriptionId: sub.id,
        ledgerEntryId: entry.id,
        freezesGranted: p.plusMonthlyStreakFreezes,
        coinsGranted: p.plusMonthlyCoins,
      });
      if (!grant) throw new Error('Versement mensuel concurrent'); // annule la transaction (crédit compris)
      const available = await this.catalog.countAvailableFreezes(scope, userId, scope.now);
      const freezes = Math.max(0, Math.min(p.plusMonthlyStreakFreezes, p.maxAvailableStreakFreezes - available));
      if (freezes > 0) {
        await this.catalog.grantFreezes(scope, { userId, count: freezes, source: 'MONTHLY_BENEFIT', monthlyBenefitGrantId: grant.id, grantedAt: scope.now, expiresAt: null });
      }
      await scope.outbox.emit({ topic: 'economy.monthly_benefit_granted', aggregateType: 'User', aggregateId: userId, payload: { userId, period, coins: p.plusMonthlyCoins, freezes } });
      return 'GRANTED';
    });
  }

  /** Parcours paginé des titulaires du mois. */
  async runBatch(limit = 200): Promise<{ granted: number; scanned: number }> {
    const period = monthlyPeriod(this.clock.now());
    let after: string | null = null;
    let granted = 0;
    let scanned = 0;
    for (;;) {
      const batch = await this.entitlements.listMonthlyCandidates(period, [...this.state.accepted], limit, after);
      if (batch.length === 0) break;
      for (const c of batch) {
        scanned++;
        if ((await this.grantFor(c.userId)) === 'GRANTED') granted++;
      }
      after = batch.at(-1)!.userId;
    }
    return { granted, scanned };
  }
}
