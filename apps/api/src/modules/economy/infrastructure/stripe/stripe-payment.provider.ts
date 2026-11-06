/**
 * Adaptateur Stripe du port `PaymentProvider` (D-018 : hors IAP, service consommé hors de l'app) :
 * - place : PaymentIntent (montant serveur en centimes, EUR, `automatic_payment_methods` sans
 *   redirection → carte + Apple Pay / Google Pay via PaymentSheet), métadonnées `seatId/userId/purpose` ;
 * - remboursement : Refund intégral sur le PaymentIntent.
 * Blowy+ n'est pas vendu par Stripe (V5.3 C.10 : achat intégré via RevenueCat).
 * Chaque POST porte une clé d'idempotence ; aucun secret n'est loggé.
 */
import type { PaymentProvider, ProviderRefund, SeatIntent } from '../../application/payments/ports.js';
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

  async refund(i: { providerPaymentId: string; seatId: string; amountCents: number; idempotencyKey: string }): Promise<ProviderRefund> {
    const r = await this.client.post<RefundRes>('/v1/refunds', { payment_intent: i.providerPaymentId, amount: i.amountCents, reason: 'requested_by_customer', metadata: { seatId: i.seatId } }, i.idempotencyKey);
    return { refundId: r.id, status: r.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING' };
  }
}
