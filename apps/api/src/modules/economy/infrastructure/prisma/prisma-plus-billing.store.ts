/** V5.4 (C.10) : références Stripe Billing de Blowy+ (`Subscription` provider STRIPE) — client et abonnement. */
import type { Db } from '@blowy/database';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import { txOf } from '../../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { BLOWY_PLUS_ENTITLEMENT, type BillingEnvironment } from '../../domain/index.js';
import type { PlusBillingStore } from '../../application/payments/plus-billing.use-cases.js';

export class PrismaPlusBillingStore implements PlusBillingStore {
  constructor(private readonly db: Db) {}

  async stripeOf(userId: string, environment: BillingEnvironment) {
    const s = await this.db.subscription.findUnique({
      where: { userId_provider_environment_entitlementId: { userId, provider: 'STRIPE', environment, entitlementId: BLOWY_PLUS_ENTITLEMENT } },
      select: { providerCustomerRef: true, originalTransactionId: true, state: true, currentPeriodEndsAt: true, lastProviderEventAt: true },
    });
    return s ? { customerRef: s.providerCustomerRef, subscriptionRef: s.originalTransactionId, state: s.state, currentPeriodEndsAt: s.currentPeriodEndsAt, lastProviderEventAt: s.lastProviderEventAt } : null;
  }

  async remember(scope: TxScope, i: { userId: string; environment: BillingEnvironment; customerRef: string | null; subscriptionRef: string }) {
    await txOf(scope).subscription.updateMany({
      where: { userId: i.userId, provider: 'STRIPE', environment: i.environment, entitlementId: BLOWY_PLUS_ENTITLEMENT },
      data: { originalTransactionId: i.subscriptionRef, ...(i.customerRef ? { providerCustomerRef: i.customerRef } : {}) },
    });
  }
}
