import { Platform } from 'react-native';

import type { PurchasesPort, SignedPurchase } from '../ports';

/** Pas de magasin ici (web, Android tant que Google Play n'est pas branché) : l'offre est présentée, rien n'est vendu. */
export const noPurchases: PurchasesPort = {
  available: false,
  simulated: false,
  products: async () => [],
  purchase: async () => ({ status: 'cancelled' }),
  restore: async () => [],
  onUpdates: () => () => undefined,
  manageSubscriptions: async () => false,
};

const DAY = 86_400_000;
/** Même identifiant d'app que l'API en mémoire (`APPLE_BUNDLE_ID`, `app.blowy` par défaut). */
const LOCAL_BUNDLE = process.env.EXPO_PUBLIC_BUNDLE_ID ?? 'app.blowy';

/** base64url d'une chaîne UTF-8, sans dépendre de `Buffer` (absent du web et d'Hermes). */
function base64url(text: string): string {
  const bytes = unescape(encodeURIComponent(text));
  const b64 = typeof btoa === 'function' ? btoa(bytes) : '';
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** « JWS » de l'adaptateur mémoire de l'API (`memory.<base64url(json)>`) : refusé par toute API réelle. */
const memoryJws = (payload: Record<string, unknown>): string => `memory.${base64url(JSON.stringify(payload))}`;

/**
 * Achat simulé du mode local (API en mémoire, `EXPO_PUBLIC_AUTH=local`) : fabrique la transaction que StoreKit
 * aurait signée (annuel avec 7 jours d'essai, mensuel sans essai), pour tester tout le parcours sans Apple.
 * Rien n'est facturé ; une API réelle refuse ces transactions.
 */
export function simulatedPurchases(products: { yearly: string; monthly: string } = { yearly: 'app.blowy.plus.yearly', monthly: 'app.blowy.plus.monthly' }): PurchasesPort {
  let last: SignedPurchase | null = null;
  const make = (productId: string, accountToken: string | null): SignedPurchase => {
    const now = Date.now();
    const yearly = productId === products.yearly;
    const id = `local-${now}`;
    const signedTransaction = memoryJws({
      transactionId: id,
      originalTransactionId: `local-original-${accountToken ?? 'x'}`,
      bundleId: LOCAL_BUNDLE,
      productId,
      purchaseDate: now,
      expiresDate: now + (yearly ? 7 : 30) * DAY,
      signedDate: now,
      environment: 'Sandbox',
      type: 'Auto-Renewable Subscription',
      ...(yearly ? { offerType: 1, offerDiscountType: 'FREE_TRIAL' } : {}),
      ...(accountToken ? { appAccountToken: accountToken } : {}),
    });
    const signedRenewalInfo = memoryJws({
      originalTransactionId: `local-original-${accountToken ?? 'x'}`,
      autoRenewStatus: 1,
      autoRenewProductId: productId,
      isInBillingRetryPeriod: false,
      signedDate: now,
      environment: 'Sandbox',
    });
    return { productId, signedTransaction, signedRenewalInfo, finish: async () => undefined };
  };
  return {
    available: true,
    simulated: true,
    products: async () => [],
    async purchase(productId, accountToken) {
      // Le temps d'une feuille de paiement : on voit l'état « en cours » du bouton.
      await new Promise((r) => setTimeout(r, 600));
      const sim = (globalThis as { __BLOWY_IAP_SIM__?: string }).__BLOWY_IAP_SIM__;
      if (sim === 'cancel') return { status: 'cancelled' };
      if (sim === 'pending') return { status: 'pending' };
      if (sim === 'fail') throw new Error('purchase_failed');
      last = make(productId, accountToken);
      return { status: 'purchased', purchase: last };
    },
    restore: async () => (last ? [last] : []),
    onUpdates: () => () => undefined,
    manageSubscriptions: async () => Platform.OS !== 'web',
  };
}
