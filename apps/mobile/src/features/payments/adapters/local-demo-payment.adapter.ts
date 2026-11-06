/**
 * Paiement de DÉMONSTRATION locale : aucune carte, aucun débit. L'API (`LocalDemoPaymentProvider`)
 * confirme la place immédiatement ; l'app se contente d'accepter. Interdit en production : le
 * constructeur refuse, et `selectPaymentAdapter` ne le choisit jamais quand `blowyEnv=production`.
 */
import type { PaymentOutcome, PaymentPort, PaymentRequest } from '../model/payment.port';

export class LocalDemoPaymentAdapter implements PaymentPort {
  readonly kind = 'LOCAL_DEMO' as const;
  readonly applePay = true;
  constructor(blowyEnv: string) {
    if (blowyEnv === 'production') throw new Error('LocalDemoPaymentAdapter interdit en production');
  }
  async pay(req: PaymentRequest): Promise<PaymentOutcome> {
    if (req.provider !== 'LOCAL_DEMO') return { status: 'FAILED', reason: 'PROVIDER_MISMATCH' };
    if (req.clientSecret.includes('declined')) return { status: 'FAILED', reason: 'DECLINED' };
    return { status: 'PAID' };
  }
}
