/**
 * Adaptateur Stripe du port `PaymentProvider` (D-018 : hors IAP, service consommé hors de l'app) :
 * - place : PaymentIntent (montant serveur en centimes, EUR, `automatic_payment_methods` sans
 *   redirection → carte + Apple Pay / Google Pay via PaymentSheet), métadonnées `seatId/userId/purpose` ;
 * - remboursement : Refund intégral sur le PaymentIntent.
 * - V5.4 (C.10) : Blowy+ = abonnement Stripe Billing (`payment_behavior=default_incomplete`, 1ʳᵉ facture
 *   payée par PaymentSheet / Apple Pay) ; activé seulement par le webhook signé `customer.subscription.*`.
 * Chaque POST porte une clé d'idempotence ; aucun secret n'est loggé.
 */
import type { PaymentProvider, PlusSubscriptionIntent, ProviderRefund, SeatIntent } from '../../application/payments/ports.js';
import { StripeClient } from './stripe-client.js';

export interface StripeProviderConfig {
  secretKey: string;
  baseUrl: string;
  apiVersion: string | null;
  timeoutMs: number;
  livemode: boolean;
}

type PaymentIntentRes = { id: string; client_secret: string; status: string };
type RefundRes = { id: string; status: string };
type SubscriptionRes = { id: string; status: string; latest_invoice?: { confirmation_secret?: { client_secret?: string } | null; payment_intent?: { client_secret?: string } | null } | string | null };

export class StripePaymentProvider implements PaymentProvider {
  readonly kind = 'STRIPE' as const;
  readonly confirmsImmediately = false;
  readonly environment: 'PRODUCTION' | 'SANDBOX';
  private readonly client: StripeClient;

  constructor(
    private readonly cfg: StripeProviderConfig,
    fetchImpl: typeof fetch = fetch,
  ) {
    this.client = new StripeClient({ secretKey: cfg.secretKey, baseUrl: cfg.baseUrl, apiVersion: cfg.apiVersion, timeoutMs: cfg.timeoutMs }, fetchImpl);
    this.environment = cfg.livemode ? 'PRODUCTION' : 'SANDBOX';
  }

  async createSeatIntent(i: { seatId: string; userId: string; amountCents: number; currency: 'EUR'; idempotencyKey: string }): Promise<SeatIntent> {
    const pi = await this.client.post<PaymentIntentRes>(
      '/v1/payment_intents',
      {
        amount: i.amountCents,
        currency: i.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        description: 'Blowy — place de sortie',
        metadata: { purpose: 'SEAT', seatId: i.seatId, userId: i.userId },
      },
      i.idempotencyKey,
    );
    return { providerPaymentId: pi.id, clientSecret: pi.client_secret };
  }

  async createPlusSubscription(i: { userId: string; customerRef: string | null; priceId: string; idempotencyKey: string }): Promise<PlusSubscriptionIntent> {
    const customer = i.customerRef ?? (await this.client.post<{ id: string }>('/v1/customers', { metadata: { userId: i.userId, purpose: 'PLUS' } }, `plus-customer:${i.userId}`)).id;
    // API récentes (≥ 2025-03) : `latest_invoice.confirmation_secret` ; anciennes : `latest_invoice.payment_intent`.
    const legacy = this.cfg.apiVersion !== null && this.cfg.apiVersion < '2025-03-31';
    const sub = await this.client.post<SubscriptionRes>(
      '/v1/subscriptions',
      {
        customer,
        items: [{ price: i.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        description: 'Blowy+ — toutes tes sorties',
        metadata: { purpose: 'PLUS', userId: i.userId },
        expand: [legacy ? 'latest_invoice.payment_intent' : 'latest_invoice.confirmation_secret'],
      },
      i.idempotencyKey,
    );
    const inv = sub.latest_invoice && typeof sub.latest_invoice === 'object' ? sub.latest_invoice : null;
    const clientSecret = inv?.confirmation_secret?.client_secret ?? inv?.payment_intent?.client_secret ?? null;
    return { customerRef: customer, subscriptionRef: sub.id, clientSecret };
  }

  async cancelPlusSubscription(i: { subscriptionRef: string; idempotencyKey: string }): Promise<void> {
    await this.client.post(`/v1/subscriptions/${encodeURIComponent(i.subscriptionRef)}`, { cancel_at_period_end: true }, i.idempotencyKey);
  }

  async refund(i: { providerPaymentId: string; seatId: string; amountCents: number; idempotencyKey: string }): Promise<ProviderRefund> {
    const r = await this.client.post<RefundRes>('/v1/refunds', { payment_intent: i.providerPaymentId, amount: i.amountCents, reason: 'requested_by_customer', metadata: { seatId: i.seatId } }, i.idempotencyKey);
    return { refundId: r.id, status: r.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING' };
  }
}
