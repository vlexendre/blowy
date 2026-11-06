/**
 * V5.4 (C.10) — Blowy+ = abonnement aux SORTIES (toutes tes sorties, 9,99 €/mois) payé par Apple Pay / carte
 * via **Stripe Billing**, comme les places : un service consommé hors de l'app, sans fonction numérique.
 * Règles PURES : traduction de l'état d'un abonnement Stripe en état Blowy+.
 * L'achat intégré RevenueCat (V5.3) est désactivé pour Blowy+ (code gardé, `[T] plus.billing`).
 */
import type { SubscriptionState } from '@blowy/domain';

/** Statuts `Subscription.status` de l'API Stripe. */
export type StripeSubscriptionStatus = 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';

/**
 * État Blowy+ d'un abonnement Stripe : `active`/`trialing` → ACTIVE (ou CANCELLED_PENDING_EXPIRY si la
 * résiliation est programmée à l'échéance) ; `past_due` → GRACE_PERIOD (relance de paiement, droits gardés
 * jusqu'à `gracePeriodEndsAt`) ; `incomplete` → NONE (1ᵉʳ paiement pas encore fait : aucun droit) ;
 * `canceled`/`unpaid`/`incomplete_expired`/`paused` → EXPIRED.
 */
export function plusStateFromStripe(status: string, cancelAtPeriodEnd: boolean): SubscriptionState {
  switch (status as StripeSubscriptionStatus) {
    case 'active':
    case 'trialing':
      return cancelAtPeriodEnd ? 'CANCELLED_PENDING_EXPIRY' : 'ACTIVE';
    case 'past_due':
      return 'GRACE_PERIOD';
    case 'incomplete':
      return 'NONE';
    default:
      return 'EXPIRED';
  }
}

/** Délai de grâce d'un abonnement `past_due` (relances Stripe) : droits gardés au plus N jours après l'échéance. */
export const PLUS_PAST_DUE_GRACE_DAYS = 7;

export interface StripeSubscriptionSnapshot {
  readonly subscriptionId: string;
  readonly customerId: string | null;
  readonly status: string;
  readonly cancelAtPeriodEnd: boolean;
  readonly currentPeriodEnd: Date | null;
  readonly priceId: string | null;
}

/** Lit un objet `subscription` Stripe (webhook) ; `current_period_end` au niveau racine ou de l'item (API ≥ 2025-03). */
export function readStripeSubscription(o: Record<string, unknown>): StripeSubscriptionSnapshot | null {
  const id = typeof o.id === 'string' && o.id.startsWith('sub_') ? o.id : null;
  if (!id || typeof o.status !== 'string') return null;
  const items = (o.items as { data?: { current_period_end?: unknown; price?: { id?: unknown } }[] } | undefined)?.data ?? [];
  const end = typeof o.current_period_end === 'number' ? o.current_period_end : typeof items[0]?.current_period_end === 'number' ? (items[0].current_period_end as number) : null;
  const price = typeof items[0]?.price?.id === 'string' ? (items[0].price.id as string) : null;
  return {
    subscriptionId: id,
    customerId: typeof o.customer === 'string' ? o.customer : null,
    status: o.status,
    cancelAtPeriodEnd: o.cancel_at_period_end === true,
    currentPeriodEnd: end ? new Date(end * 1000) : null,
    priceId: price,
  };
}
