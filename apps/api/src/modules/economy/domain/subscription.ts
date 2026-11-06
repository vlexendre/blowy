import type { SubscriptionState } from '@blowy/domain';

/**
 * Machine d'états d'abonnement Blowy+.
 *
 * Autorité : l'état fournisseur (RevenueCat GET /v1/subscribers) obtenu par réconciliation.
 * Les webhooks ne sont que des « indices » ordonnés par `event_timestamp_ms` : un indice plus
 * ancien que le dernier appliqué est ignoré (événements désordonnés), puis une réconciliation
 * est TOUJOURS déclenchée et remplace l'état par celui du fournisseur.
 */
export type BillingEnvironment = 'PRODUCTION' | 'SANDBOX' | 'LOCAL_DEMO';
/** V5.4 (C.10) : `STRIPE` = Blowy+ via Stripe Billing (abonnement aux sorties, hors store). */
export type BillingProviderKind = 'REVENUECAT' | 'LOCAL_DEMO' | 'STRIPE';

export const ACTIVE_STATES: ReadonlySet<SubscriptionState> = new Set(['TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'CANCELLED_PENDING_EXPIRY']);
/** États « payants » ouvrant les bénéfices mensuels (l'essai gratuit n'en ouvre pas). */
export const PAYING_STATES: ReadonlySet<SubscriptionState> = new Set(['ACTIVE', 'GRACE_PERIOD', 'CANCELLED_PENDING_EXPIRY']);

export const isActiveState = (s: SubscriptionState) => ACTIVE_STATES.has(s);

export interface SubscriptionRecord {
  readonly id: string;
  readonly userId: string;
  readonly provider: BillingProviderKind;
  readonly environment: BillingEnvironment;
  readonly entitlementId: string;
  readonly state: SubscriptionState;
  readonly productId: string | null;
  readonly store: string | null;
  readonly periodType: string | null;
  readonly currentPeriodEndsAt: Date | null;
  readonly gracePeriodEndsAt: Date | null;
  readonly lastProviderEventAt: Date | null;
  readonly lastReconciledAt: Date | null;
  readonly version: number;
}

/** Abonnement normalisé tel que décrit par le fournisseur (snapshot autoritaire). */
export interface ProviderSubscription {
  readonly productId: string;
  readonly store: string;
  readonly environment: BillingEnvironment;
  readonly periodType: string | null;
  readonly purchasedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly gracePeriodExpiresAt: Date | null;
  readonly unsubscribeDetectedAt: Date | null;
  readonly billingIssuesDetectedAt: Date | null;
  readonly refundedAt: Date | null;
  readonly storeTransactionId: string | null;
}

export interface ProviderEntitlement {
  readonly entitlementId: string;
  readonly productId: string;
  readonly expiresAt: Date | null;
  readonly gracePeriodExpiresAt: Date | null;
}

export interface ProviderConsumable {
  readonly productId: string;
  readonly environment: BillingEnvironment;
  readonly store: string;
  /** Identifiant de transaction STORE (même clé que le webhook). null => non créditable ici. */
  readonly storeTransactionId: string | null;
  readonly purchasedAt: Date;
}

export interface ProviderCustomerSnapshot {
  readonly appUserId: string;
  readonly fetchedAt: Date;
  readonly entitlements: readonly ProviderEntitlement[];
  readonly subscriptions: readonly ProviderSubscription[];
  readonly consumables: readonly ProviderConsumable[];
}

export interface DerivedSubscriptionState {
  readonly environment: BillingEnvironment;
  readonly state: SubscriptionState;
  readonly productId: string | null;
  readonly store: string | null;
  readonly periodType: string | null;
  readonly currentPeriodEndsAt: Date | null;
  readonly gracePeriodEndsAt: Date | null;
}

const after = (d: Date | null, now: Date) => d !== null && d.getTime() > now.getTime();

/**
 * Dérive l'état d'un entitlement (ex. `blowy_plus`) par environnement à partir du snapshot
 * fournisseur. Fonction pure, testée unitairement.
 */
export function deriveStateFromSnapshot(
  snapshot: ProviderCustomerSnapshot,
  entitlementId: string,
  entitlementProductIds: ReadonlySet<string>,
  now: Date,
): DerivedSubscriptionState[] {
  const ent = snapshot.entitlements.find((e) => e.entitlementId === entitlementId) ?? null;
  const byEnv = new Map<BillingEnvironment, ProviderSubscription[]>();
  for (const s of snapshot.subscriptions) {
    if (!entitlementProductIds.has(s.productId)) continue;
    byEnv.set(s.environment, [...(byEnv.get(s.environment) ?? []), s]);
  }
  const out: DerivedSubscriptionState[] = [];
  for (const [environment, subs] of byEnv) {
    // Abonnement le plus récent (expiration la plus tardive) de l'environnement.
    const sub = [...subs].sort((a, b) => (b.expiresAt?.getTime() ?? Infinity) - (a.expiresAt?.getTime() ?? Infinity))[0]!;
    const entitlementCoversThis = ent !== null && ent.productId === sub.productId;
    const live = after(sub.expiresAt, now) || sub.expiresAt === null;
    const inGrace = after(sub.gracePeriodExpiresAt, now) || (entitlementCoversThis && after(ent.gracePeriodExpiresAt, now));
    let state: SubscriptionState;
    if (sub.refundedAt !== null) state = 'REFUNDED';
    else if (live && !entitlementCoversThis && ent === null && sub.expiresAt !== null) state = 'REVOKED'; // ex. transfert
    else if (live) {
      if (sub.periodType === 'TRIAL') state = 'TRIAL';
      else if (sub.unsubscribeDetectedAt !== null) state = 'CANCELLED_PENDING_EXPIRY';
      else state = 'ACTIVE';
    } else if (inGrace) state = 'GRACE_PERIOD';
    else state = 'EXPIRED';
    out.push({
      environment,
      state,
      productId: sub.productId,
      store: sub.store,
      periodType: sub.periodType,
      currentPeriodEndsAt: sub.expiresAt,
      gracePeriodEndsAt: sub.gracePeriodExpiresAt ?? (entitlementCoversThis ? ent.gracePeriodExpiresAt : null),
    });
  }
  return out;
}

/** Indice d'état issu d'un webhook (appliqué seulement s'il est plus récent). */
export interface SubscriptionHint {
  readonly state: SubscriptionState;
  readonly productId: string | null;
  readonly store: string | null;
  readonly periodType: string | null;
  readonly currentPeriodEndsAt: Date | null;
  readonly gracePeriodEndsAt: Date | null;
  readonly eventAt: Date;
}

/** Ordre des événements : un indice antérieur au dernier appliqué est ignoré. */
export function shouldApplyHint(current: Pick<SubscriptionRecord, 'lastProviderEventAt'> | null, hint: SubscriptionHint): boolean {
  if (current === null || current.lastProviderEventAt === null) return true;
  return hint.eventAt.getTime() > current.lastProviderEventAt.getTime();
}

/** Échéance effective du droit : fin de période, prolongée par la période de grâce. */
export function effectiveEndsAt(s: Pick<DerivedSubscriptionState, 'currentPeriodEndsAt' | 'gracePeriodEndsAt' | 'state'>): Date | null {
  if (s.state === 'GRACE_PERIOD') return s.gracePeriodEndsAt ?? s.currentPeriodEndsAt;
  return s.currentPeriodEndsAt;
}
