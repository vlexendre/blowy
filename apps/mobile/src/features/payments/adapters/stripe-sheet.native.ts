/** Implémentation native de `StripeSheet` (Stripe PaymentSheet, Apple Pay en premier). */
import { initPaymentSheet, initStripe, isPlatformPaySupported, presentPaymentSheet } from '@stripe/stripe-react-native';
import type { StripeSheet } from './stripe-sheet';

const euros = (cents: number) => (cents / 100).toFixed(2);

export function loadStripeSheet(): StripeSheet {
  return {
    init: (publishableKey, merchantIdentifier) => initStripe({ publishableKey, merchantIdentifier, urlScheme: 'blowy' }),
    setup: ({ clientSecret, label, amountCents, recurring, testEnv }) =>
      initPaymentSheet({
        merchantDisplayName: 'Blowy',
        paymentIntentClientSecret: clientSecret,
        returnURL: 'blowy://stripe-redirect',
        applePay: {
          merchantCountryCode: 'FR',
          cartItems: [recurring ? { paymentType: 'Recurring', label, amount: euros(amountCents), intervalUnit: 'month', intervalCount: 1 } : { paymentType: 'Immediate', label, amount: euros(amountCents) }],
        },
        googlePay: { merchantCountryCode: 'FR', currencyCode: 'EUR', testEnv },
      }),
    present: () => presentPaymentSheet(),
    applePaySupported: () => isPlatformPaySupported(),
  };
}
