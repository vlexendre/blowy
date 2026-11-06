/**
 * Sélection de l'adapter de paiement (une seule fonction, testée) :
 * - clé publiable Stripe + SDK natif → Stripe PaymentSheet (Apple Pay) ;
 * - sinon LOCAL_DEMO uniquement hors production (l'API confirme la place sans débit) ;
 * - production sans Stripe → `null` : paiement « indisponible », jamais de fausse transaction.
 */
import type { PaymentPort } from '../model/payment.port';
import { LocalDemoPaymentAdapter } from './local-demo-payment.adapter';
import { StripePaymentAdapter } from './stripe-payment.adapter';
import type { StripeSheet } from './stripe-sheet';

export interface PaymentEnv {
  blowyEnv: string;
  stripePublishableKey?: string;
  appleMerchantId?: string;
}

export function selectPaymentAdapter(env: PaymentEnv, sheet: StripeSheet | null): PaymentPort | null {
  if (env.stripePublishableKey && sheet) return new StripePaymentAdapter(sheet, { publishableKey: env.stripePublishableKey, merchantIdentifier: env.appleMerchantId });
  if (env.blowyEnv === 'production') return null;
  return new LocalDemoPaymentAdapter(env.blowyEnv);
}
