/**
 * V5.4 (C.10) — Blowy+ = abonnement aux SORTIES payé par Apple Pay / carte via **Stripe Billing** (service
 * consommé hors de l'app, aucune fonction numérique : le Duo est gratuit pour tous). Remplace l'achat intégré
 * RevenueCat de V5.3 (code gardé, désactivé : `[T] plus.billing = STRIPE_BILLING`).
 *  - `checkout` : crée l'abonnement Stripe (`default_incomplete`) APRÈS lecture, hors verrou, avec une clé
 *    idempotente ; renvoie le secret client de la 1ʳᵉ facture (PaymentSheet / Apple Pay). Aucun droit n'est
 *    accordé ici : seul le webhook signé `customer.subscription.*` active Blowy+.
 *  - `cancel` : résiliation EN APP, à l'échéance (`cancel_at_period_end`) ; places déjà confirmées gardées.
 *  - `applyStripeSubscription` : appelé par le webhook (transaction, verrou users) ; ordre des événements
 *    respecté (`lastProviderEventAt`).
 * Démo locale (hors production) : même chemin que V5.3 (fournisseur de démo), activation immédiate.
 */
import type { EntitlementKey } from '@blowy/domain';
import type { Clock } from '../../../../shared/application/clock.js';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import { AppError } from '../../../../shared/domain/errors.js';
import { PLUS_PAST_DUE_GRACE_DAYS, plusStateFromStripe, type BillingEnvironment, type PaymentsParams, type StripeSubscriptionSnapshot } from '../../domain/index.js';
import type { EntitlementStateService } from '../entitlement-state.service.js';
import type { PaymentProvider } from './ports.js';
import { plusActive } from './seat-funding.service.js';

export interface PlusBillingStore {
  stripeOf(userId: string, environment: BillingEnvironment): Promise<{ customerRef: string | null; subscriptionRef: string | null; state: string; currentPeriodEndsAt: Date | null; lastProviderEventAt: Date | null } | null>;
  remember(scope: TxScope, i: { userId: string; environment: BillingEnvironment; customerRef: string | null; subscriptionRef: string }): Promise<void>;
}

type KeysOf = (userId: string, at: Date) => Promise<ReadonlySet<EntitlementKey>>;
type Uow = { run<T>(fn: (scope: TxScope) => Promise<T>): Promise<T> };

export type PlusCheckoutResult = { provider: 'STRIPE' | 'LOCAL_DEMO'; clientSecret: string; subscriptionId?: string };

export class PlusBillingUseCases {
  constructor(
    private readonly uow: Uow,
    private readonly provider: PaymentProvider | null,
    private readonly plusPriceId: string | null,
    private readonly store: PlusBillingStore,
    private readonly state: EntitlementStateService,
    private readonly keysOf: KeysOf,
    /** Démo locale V5.3 (fournisseur de démo) ; null hors démo. */
    private readonly localDemo: { subscribe: (userId: string, commandId: string) => Promise<void>; cancel: (userId: string, commandId: string) => Promise<void> } | null,
    private readonly params: () => PaymentsParams,
    private readonly clock: Clock,
  ) {}

  private get env(): BillingEnvironment {
    return this.provider?.environment === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
  }

  async checkout(userId: string, commandId: string): Promise<PlusCheckoutResult> {
    if (plusActive(await this.keysOf(userId, this.clock.now()))) throw new AppError('CONFLICT', 'Blowy+ déjà actif', { detailsSafe: { reason: 'PLUS_ALREADY_ACTIVE' } });
    if (this.params().plusBilling === 'IN_APP_PURCHASE') {
      // Ancien canal (V5.3) : achat intégré RevenueCat, conservé derrière le tuning.
      if (!this.localDemo) throw new AppError('NOT_CONFIGURED', 'Blowy+ s’achète dans l’app', { detailsSafe: { reason: 'PLUS_VIA_IN_APP_PURCHASE' } });
      await this.localDemo.subscribe(userId, commandId);
      return { provider: 'LOCAL_DEMO', clientSecret: `local_demo_plus_${userId}` };
    }
    if (this.provider?.kind === 'LOCAL_DEMO' && this.localDemo) {
      await this.localDemo.subscribe(userId, commandId);
      return { provider: 'LOCAL_DEMO', clientSecret: `local_demo_plus_${userId}` };
    }
    if (!this.provider?.createPlusSubscription || !this.plusPriceId) throw new AppError('PROVIDER_UNAVAILABLE', 'Blowy+ indisponible pour le moment', { detailsSafe: { reason: 'PLUS_UNAVAILABLE' } });
    const known = await this.store.stripeOf(userId, this.env);
    // Réseau hors transaction ; clé idempotente par commande (un double tap = un seul abonnement Stripe).
    const intent = await this.provider.createPlusSubscription({ userId, customerRef: known?.customerRef ?? null, priceId: this.plusPriceId, idempotencyKey: `plus-sub:${userId}:${commandId}` });
    await this.uow.run(async (scope) => {
      await scope.lock.users([userId]);
      const cur = await this.store.stripeOf(userId, this.env);
      if (!cur) {
        // Ligne d'abonnement sans droit (NONE) : le webhook signé la fera passer ACTIVE.
        await this.state.applyState(scope, userId, { environment: this.env, state: 'NONE', productId: this.plusPriceId, store: 'stripe', periodType: 'NORMAL', currentPeriodEndsAt: null, gracePeriodEndsAt: null }, { eventAt: new Date(0) }, 'STRIPE');
      }
      await this.store.remember(scope, { userId, environment: this.env, customerRef: intent.customerRef, subscriptionRef: intent.subscriptionRef });
    });
    if (!intent.clientSecret) throw new AppError('PROVIDER_UNAVAILABLE', 'Paiement Blowy+ indisponible', { detailsSafe: { reason: 'PLUS_UNAVAILABLE' }, retryable: true });
    return { provider: 'STRIPE', clientSecret: intent.clientSecret, subscriptionId: intent.subscriptionRef };
  }

  /** Résiliation en app (Stripe, hors store) : fin à l'échéance ; l'état définitif vient du webhook. */
  async cancel(userId: string, commandId: string): Promise<{ state: 'CANCELLED_PENDING_EXPIRY' | 'EXPIRED' | 'NONE'; currentPeriodEndsAt: string | null }> {
    if (this.provider?.kind === 'LOCAL_DEMO' && this.localDemo) {
      if (!plusActive(await this.keysOf(userId, this.clock.now()))) throw new AppError('PRECONDITION_FAILED', 'Aucun abonnement Blowy+ actif', { detailsSafe: { reason: 'PLUS_NOT_ACTIVE' } });
      await this.localDemo.cancel(userId, commandId);
      return { state: 'CANCELLED_PENDING_EXPIRY', currentPeriodEndsAt: null };
    }
    const cur = await this.store.stripeOf(userId, this.env);
    if (!cur?.subscriptionRef || !this.provider?.cancelPlusSubscription || !['ACTIVE', 'TRIAL', 'GRACE_PERIOD', 'CANCELLED_PENDING_EXPIRY'].includes(cur.state)) {
      throw new AppError('PRECONDITION_FAILED', 'Aucun abonnement Blowy+ actif', { detailsSafe: { reason: 'PLUS_NOT_ACTIVE' } });
    }
    if (cur.state !== 'CANCELLED_PENDING_EXPIRY') await this.provider.cancelPlusSubscription({ subscriptionRef: cur.subscriptionRef, idempotencyKey: `plus-cancel:${userId}:${commandId}` });
    return { state: 'CANCELLED_PENDING_EXPIRY', currentPeriodEndsAt: cur.currentPeriodEndsAt?.toISOString() ?? null };
  }

  /**
   * Webhook `customer.subscription.created|updated|deleted` (signé, idempotent par `event.id`) : applique l'état
   * Blowy+ dérivé de l'abonnement Stripe. Un événement plus ancien que le dernier appliqué est ignoré.
   */
  async applyStripeSubscription(scope: TxScope, userId: string, s: StripeSubscriptionSnapshot, eventAt: Date, deleted: boolean, livemode: boolean): Promise<'PROCESSED' | 'IGNORED'> {
    await scope.lock.users([userId]);
    const environment: BillingEnvironment = livemode ? 'PRODUCTION' : 'SANDBOX';
    const cur = await this.store.stripeOf(userId, environment);
    if (cur?.lastProviderEventAt && cur.lastProviderEventAt.getTime() > eventAt.getTime()) return 'IGNORED';
    if (cur?.subscriptionRef && cur.subscriptionRef !== s.subscriptionId && deleted) return 'IGNORED'; // fin d'un ancien abonnement
    const keysBefore = await this.state.keysOf(userId, scope.now, scope);
    const st = deleted ? 'EXPIRED' : plusStateFromStripe(s.status, s.cancelAtPeriodEnd);
    const grace = st === 'GRACE_PERIOD' && s.currentPeriodEnd ? new Date(s.currentPeriodEnd.getTime() + PLUS_PAST_DUE_GRACE_DAYS * 86_400_000) : null;
    await this.state.applyState(scope, userId, { environment, state: st, productId: s.priceId ?? this.plusPriceId, store: 'stripe', periodType: 'NORMAL', currentPeriodEndsAt: s.currentPeriodEnd, gracePeriodEndsAt: grace }, { eventAt }, 'STRIPE');
    await this.store.remember(scope, { userId, environment, customerRef: s.customerId, subscriptionRef: s.subscriptionId });
    await this.state.emitChanged(scope, userId, keysBefore);
    return 'PROCESSED';
  }
}
