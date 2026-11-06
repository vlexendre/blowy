/** Port de paiement de l'app (un seul, choisi au démarrage selon l'environnement). */
import { env } from '../../../core/config/env';
import { selectPaymentAdapter } from '../adapters/select-payment-adapter';
import { loadStripeSheet } from '../adapters/stripe-sheet';
import type { PaymentPort } from './payment.port';

let port: PaymentPort | null | undefined;

export function usePaymentPort(): PaymentPort | null {
  port ??= selectPaymentAdapter(env, loadStripeSheet());
  return port;
}
