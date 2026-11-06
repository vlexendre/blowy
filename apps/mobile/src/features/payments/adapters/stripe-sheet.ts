/**
 * Accès au SDK Stripe isolé derrière une petite interface : `stripe-sheet.native.ts` charge
 * `@stripe/stripe-react-native` (iOS/Android) ; sur le web ce fichier renvoie `null` (le SDK n'a pas
 * de version web : le paiement y est « indisponible », jamais simulé).
 */
export interface StripeSheet {
  init(publishableKey: string, merchantIdentifier: string | undefined): Promise<void>;
  setup(p: { clientSecret: string; label: string; amountCents: number; currency: string; recurring: boolean; testEnv: boolean }): Promise<{ error?: { code: string } }>;
  present(): Promise<{ error?: { code: string } }>;
  applePaySupported(): Promise<boolean>;
}

export function loadStripeSheet(): StripeSheet | null {
  return null;
}
