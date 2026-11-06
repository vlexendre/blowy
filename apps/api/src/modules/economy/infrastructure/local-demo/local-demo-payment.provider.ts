/**
 * Paiement de DÉMONSTRATION locale (étiqueté `LOCAL_DEMO`, jamais en production — refusé au
 * démarrage) : aucune carte, aucun débit. La place est confirmée immédiatement (comportement T2) ;
 * les remboursements sont réglés immédiatement.
 */
import type { PaymentProvider } from '../../application/payments/ports.js';

export class LocalDemoPaymentProvider implements PaymentProvider {
  readonly kind = 'LOCAL_DEMO' as const;
  readonly environment = 'LOCAL_DEMO' as const;
  readonly confirmsImmediately = true;

  constructor(env: string) {
    if (env === 'production') throw new Error('LocalDemoPaymentProvider interdit en production');
  }

  async createSeatIntent(i: { seatId: string }) {
    return { providerPaymentId: `local_demo:${i.seatId}`, clientSecret: `local_demo_${i.seatId}` };
  }

  async refund(i: { seatId: string }) {
    return { refundId: `local_demo_refund:${i.seatId}`, status: 'SUCCEEDED' as const };
  }
}
