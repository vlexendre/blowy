/**
 * Adapter réel : Stripe PaymentSheet (Apple Pay en tête, carte en repli dans la même feuille).
 * Ne journalise jamais le secret client ni le moyen de paiement.
 */
import type { PaymentOutcome, PaymentPort, PaymentRequest } from '../model/payment.port';
import type { StripeSheet } from './stripe-sheet';

export class StripePaymentAdapter implements PaymentPort {
  readonly kind = 'STRIPE' as const;
  applePay = false;
  private ready: Promise<void> | null = null;
  constructor(
    private readonly sheet: StripeSheet,
    private readonly opts: { publishableKey: string; merchantIdentifier?: string },
  ) {}

  private init() {
    this.ready ??= this.sheet.init(this.opts.publishableKey, this.opts.merchantIdentifier).then(async () => {
      this.applePay = await this.sheet.applePaySupported().catch(() => false);
    });
    return this.ready;
  }

  async pay(req: PaymentRequest): Promise<PaymentOutcome> {
    if (req.provider !== 'STRIPE') return { status: 'FAILED', reason: 'PROVIDER_MISMATCH' };
    try {
      await this.init();
      const setup = await this.sheet.setup({ clientSecret: req.clientSecret, label: req.label, amountCents: req.amountCents, currency: req.currency, recurring: !!req.recurring, testEnv: !this.opts.publishableKey.startsWith('pk_live_') });
      if (setup.error) return { status: 'FAILED', reason: 'UNAVAILABLE' };
      const r = await this.sheet.present();
      if (!r.error) return { status: 'PAID' };
      if (r.error.code === 'Canceled') return { status: 'CANCELED' };
      return { status: 'FAILED', reason: r.error.code === 'Failed' ? 'DECLINED' : 'UNKNOWN' };
    } catch {
      return { status: 'FAILED', reason: 'UNKNOWN' };
    }
  }
}
