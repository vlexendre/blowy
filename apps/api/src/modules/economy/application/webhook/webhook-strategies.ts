import type { SubscriptionState } from '@blowy/domain';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import { BLOWY_PLUS_ENTITLEMENT, shouldApplyHint, type BillingProviderKind, type SubscriptionHint, type SubscriptionRecord } from '../../domain/index.js';
import type { NormalizedWebhookEvent } from '../ports/billing-provider.port.js';
import type { StoreProductRecord } from '../ports/billing-record.repository.js';
import type { EntitlementStateService } from '../entitlement-state.service.js';
import type { StoreCreditService } from '../store-credit.service.js';

/**
 * Strategy de traitement par type d'événement webhook (RevenueCat « Event Types and Fields »).
 * Chaque stratégie applique au plus un INDICE local ordonné ; la réconciliation fournisseur
 * (toujours demandée ensuite par le use case) reste l'autorité finale.
 */
export interface WebhookContext {
  readonly scope: TxScope;
  readonly userId: string;
  readonly event: NormalizedWebhookEvent;
  readonly provider: BillingProviderKind;
  readonly product: StoreProductRecord | undefined;
  readonly isPlusSubscription: boolean;
  readonly subscription: SubscriptionRecord | null;
  readonly state: EntitlementStateService;
  readonly credits: StoreCreditService;
}

export type WebhookOutcome = 'PROCESSED' | 'IGNORED';

export interface WebhookStrategy {
  readonly types: readonly string[];
  handle(ctx: WebhookContext): Promise<WebhookOutcome>;
}

/** Applique un indice d'état d'abonnement s'il est plus récent que le dernier appliqué. */
async function applyHint(ctx: WebhookContext, state: SubscriptionState, overrides: Partial<SubscriptionHint> = {}): Promise<WebhookOutcome> {
  if (!ctx.isPlusSubscription) return 'IGNORED';
  const e = ctx.event;
  // Indice « actif » dont l'échéance est déjà passée (événement très en retard) → expiré.
  const stale = (state === 'ACTIVE' || state === 'TRIAL') && e.expiresAt !== null && e.expiresAt <= ctx.scope.now;
  const hint: SubscriptionHint = {
    state: stale ? 'EXPIRED' : state,
    productId: e.newProductId ?? e.productId,
    store: e.store,
    periodType: e.periodType,
    currentPeriodEndsAt: e.expiresAt,
    gracePeriodEndsAt: e.gracePeriodExpiresAt,
    eventAt: e.eventAt,
    ...overrides,
  };
  if (!shouldApplyHint(ctx.subscription, hint)) return 'IGNORED';
  await ctx.state.applyState(
    ctx.scope,
    ctx.userId,
    { environment: e.environment, state: hint.state, productId: hint.productId, store: hint.store, periodType: hint.periodType, currentPeriodEndsAt: hint.currentPeriodEndsAt, gracePeriodEndsAt: hint.gracePeriodEndsAt },
    { eventAt: e.eventAt },
  );
  return 'PROCESSED';
}

const isRefund = (e: NormalizedWebhookEvent) => e.cancelReason === 'CUSTOMER_SUPPORT';

const activation: WebhookStrategy = {
  types: ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT'],
  handle: (ctx) => {
    // PRODUCT_CHANGE peut ne pas prendre effet immédiatement : on conserve l'état actif, la réconciliation tranche.
    const trial = ctx.event.periodType === 'TRIAL';
    return applyHint(ctx, trial ? 'TRIAL' : 'ACTIVE', ctx.event.type === 'PRODUCT_CHANGE' ? { productId: ctx.event.productId } : {});
  },
};

const cancellation: WebhookStrategy = {
  types: ['CANCELLATION'],
  handle: async (ctx) => {
    const e = ctx.event;
    if (ctx.product?.kind === 'CONSUMABLE_COINS') {
      if (!isRefund(e) || !e.transactionId) return 'IGNORED';
      const r = await ctx.credits.refundConsumable(ctx.scope, ctx.provider, e.environment, e.transactionId);
      return r === 'REFUNDED' ? 'PROCESSED' : 'IGNORED';
    }
    if (isRefund(e)) return applyHint(ctx, 'REFUNDED');
    // Résiliation à échéance : le droit reste jusqu'à expiration.
    return applyHint(ctx, 'CANCELLED_PENDING_EXPIRY');
  },
};

const billingIssue: WebhookStrategy = {
  types: ['BILLING_ISSUE'],
  handle: (ctx) => (ctx.event.gracePeriodExpiresAt && ctx.event.gracePeriodExpiresAt > ctx.scope.now ? applyHint(ctx, 'GRACE_PERIOD') : Promise.resolve('IGNORED' as const)),
};

const expiration: WebhookStrategy = {
  types: ['EXPIRATION'],
  handle: (ctx) => applyHint(ctx, 'EXPIRED'),
};

const nonRenewing: WebhookStrategy = {
  types: ['NON_RENEWING_PURCHASE'],
  handle: async (ctx) => {
    const e = ctx.event;
    if (!e.transactionId || !e.productId) return 'IGNORED';
    const outcome = await ctx.credits.creditConsumable(
      ctx.scope,
      { userId: ctx.userId, provider: ctx.provider, environment: e.environment, store: e.store ?? 'UNKNOWN', storeTransactionId: e.transactionId, productId: e.productId, purchasedAt: e.purchasedAt ?? e.eventAt },
      ctx.product,
      ctx.state.accepted,
    );
    return outcome === 'CREDITED' ? 'PROCESSED' : 'IGNORED';
  },
};

const refundReversed: WebhookStrategy = {
  types: ['REFUND_REVERSED'],
  handle: async (ctx) => {
    const e = ctx.event;
    if (ctx.product?.kind === 'CONSUMABLE_COINS' && e.transactionId) {
      return (await ctx.credits.reverseRefund(ctx.scope, ctx.provider, e.environment, e.transactionId)) ? 'PROCESSED' : 'IGNORED';
    }
    return 'IGNORED'; // abonnement : la réconciliation rétablit l'état fournisseur.
  },
};

/** Événements sans effet local direct : la réconciliation (TRANSFER, PAUSED…) fait foi. */
const reconcileOnly: WebhookStrategy = {
  types: ['TRANSFER', 'SUBSCRIPTION_PAUSED', 'TEST', 'SUBSCRIBER_ALIAS', 'PRICE_INCREASE_CONSENT_REQUIRED', 'PRICE_INCREASE_CONSENT_APPROVED', 'EXPERIMENT_ENROLLMENT', 'INVOICE_ISSUANCE', 'VIRTUAL_CURRENCY_TRANSACTION', 'PURCHASE_REDEEMED'],
  handle: async () => 'IGNORED',
};

export class WebhookStrategyRegistry {
  private readonly byType = new Map<string, WebhookStrategy>();
  constructor(strategies: readonly WebhookStrategy[] = DEFAULT_STRATEGIES) {
    for (const s of strategies) for (const t of s.types) this.byType.set(t, s);
  }
  /** Type inconnu (ajout futur RevenueCat) : aucune action locale, réconciliation seulement. */
  resolve(type: string): WebhookStrategy {
    return this.byType.get(type) ?? reconcileOnly;
  }
}

export const DEFAULT_STRATEGIES: readonly WebhookStrategy[] = [activation, cancellation, billingIssue, expiration, nonRenewing, refundReversed, reconcileOnly];

/** Le produit de l'événement relève-t-il de l'abonnement Blowy+ ? */
export function isPlusSubscriptionEvent(e: NormalizedWebhookEvent, product: StoreProductRecord | undefined): boolean {
  if (product) return product.kind === 'SUBSCRIPTION' && product.entitlementId === BLOWY_PLUS_ENTITLEMENT;
  return e.entitlementIds.includes(BLOWY_PLUS_ENTITLEMENT);
}
