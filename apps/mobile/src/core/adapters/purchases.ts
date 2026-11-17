import { Platform } from 'react-native';

import type { PurchasesPort, SignedPurchase } from '../ports';

/**
 * Pas de magasin ici (web, Android tant que Google Play n'est pas branché) : l'offre est présentée avec les prix de
 * référence de l'API, sans bouton d'achat ; rien n'est vendu.
 */
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
/** Prix que le magasin simulé du mode local annonce (ceux d'App Store Connect en France). Jamais utilisés sur un iPhone. */
const SIM_PRICES = { yearly: 59.88, monthly: 14.99, weekly: 2.99 } as const;
/** Durée d'une période (ou de l'essai de l'annuelle) dans le magasin simulé, en jours. */
const SIM_DAYS = { yearly: 7, monthly: 30, weekly: 7 } as const;
type SimPlan = keyof typeof SIM_PRICES;
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
 * aurait signée (annuel avec 7 jours d'essai, mensuel et hebdomadaire sans essai), pour tester tout le parcours sans Apple.
 * Rien n'est facturé ; une API réelle refuse ces transactions.
 */
export function simulatedPurchases(
  products: Readonly<Record<SimPlan, string>> = { yearly: 'app.blowy.plus.yearly', monthly: 'app.blowy.plus.monthly', weekly: 'app.blowy.plus.weekly' },
): PurchasesPort {
  let last: SignedPurchase | null = null;
  const planOf = (productId: string): SimPlan | undefined => (Object.keys(products) as SimPlan[]).find((k) => products[k] === productId);
  const make = (productId: string, accountToken: string | null): SignedPurchase => {
    const now = Date.now();
    const plan = planOf(productId) ?? 'monthly';
    const yearly = plan === 'yearly';
    const id = `local-${now}`;
    const signedTransaction = memoryJws({
      transactionId: id,
      originalTransactionId: `local-original-${accountToken ?? 'x'}`,
      bundleId: LOCAL_BUNDLE,
      productId,
      purchaseDate: now,
      expiresDate: now + SIM_DAYS[plan] * DAY,
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
    async products(productIds) {
      // Ce que StoreKit répondrait en France (le magasin du mode local). Banc d'essai : `noprices` (le magasin ne répond
      // pas), `slowprices` (il met 20 s).
      const sim = (globalThis as { __BLOWY_IAP_SIM__?: string }).__BLOWY_IAP_SIM__;
      if (sim === 'slowprices') await new Promise((r) => setTimeout(r, 20_000));
      if (sim === 'noprices') throw new Error('store_unavailable');
      const euros = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(n);
      return productIds.flatMap((productId) => {
        const plan = planOf(productId);
        if (!plan) return [];
        const price = SIM_PRICES[plan];
        return [{ productId, displayPrice: euros(price), price, currency: 'EUR', introEligible: null, trialDays: plan === 'yearly' ? 7 : 0 }];
      });
    },
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
