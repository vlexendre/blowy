/**
 * Achats intégrés Apple (StoreKit 2) avec `expo-iap` (module Expo maintenu, compatible SDK 58). La vérification se
 * fait sur notre API, qui lit elle-même les transactions signées par Apple (aucun intermédiaire payant) :
 * l'app envoie la transaction signée (JWS, `purchaseToken` sur iOS) puis la termine une fois l'API d'accord.
 * - Achat : `appAccountToken` = identifiant de la personne (lie l'achat au compte Blowy).
 * - Restaurer : `AppStore.sync()` (`restorePurchases`) puis les abonnements en cours (`getAvailablePurchases`).
 * - Mises à jour (renouvellement, achat « en attente » validé, autre appareil) : `purchaseUpdatedListener`.
 */
import {
  deepLinkToSubscriptions,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isEligibleForIntroOfferIOS,
  type Purchase,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
} from 'expo-iap';

import type { PurchasesPort, SignedPurchase, StoreProduct } from '../ports';

let connecting: Promise<unknown> | null = null;
const connect = (): Promise<unknown> => {
  connecting ??= initConnection().catch((e: unknown) => {
    connecting = null;
    throw e;
  });
  return connecting;
};

/** Une transaction StoreKit → ce que l'API attend. Sans JWS (cas anormal) : ignorée. */
function signed(p: Purchase): SignedPurchase | null {
  const jws = p.purchaseToken;
  if (!jws || p.purchaseState === 'pending') return null;
  return {
    productId: p.productId,
    signedTransaction: jws,
    finish: async () => {
      await finishTransaction({ purchase: p, isConsumable: false });
    },
  };
}

const isCancel = (e: unknown): boolean => (e as { code?: string }).code === 'user-cancelled';

export function storeKitPurchases(): PurchasesPort {
  return {
    available: true,
    simulated: false,
    async products(productIds) {
      try {
        await connect();
        const list = (await fetchProducts({ skus: [...productIds], type: 'subs' })) ?? [];
        const out: StoreProduct[] = [];
        for (const p of list as readonly { id: string; displayPrice: string; price?: number | null; currency?: string; subscriptionGroupIdIOS?: string | null }[]) {
          let introEligible: boolean | null = null;
          if (p.subscriptionGroupIdIOS) introEligible = await isEligibleForIntroOfferIOS(p.subscriptionGroupIdIOS).catch(() => null);
          out.push({ productId: p.id, displayPrice: p.displayPrice, price: p.price ?? null, currency: p.currency ?? null, introEligible });
        }
        return out;
      } catch {
        return [];
      }
    },
    async purchase(productId, accountToken) {
      await connect();
      try {
        const result = await requestPurchase({ request: { apple: { sku: productId, appAccountToken: accountToken } }, type: 'subs' });
        const first = Array.isArray(result) ? result[0] : result;
        if (!first) return { status: 'pending' };
        const s = signed(first);
        return s ? { status: 'purchased', purchase: s } : { status: 'pending' };
      } catch (e) {
        if (isCancel(e)) return { status: 'cancelled' };
        throw e;
      }
    },
    async restore() {
      await connect();
      await restorePurchases().catch(() => undefined);
      const list = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
      return list.map(signed).filter((s): s is SignedPurchase => s !== null);
    },
    onUpdates(listener) {
      void connect().catch(() => undefined);
      const sub = purchaseUpdatedListener((p) => {
        const s = signed(p);
        if (s) listener(s);
      });
      return () => sub.remove();
    },
    async manageSubscriptions() {
      try {
        await deepLinkToSubscriptions({});
        return true;
      } catch {
        return false;
      }
    },
  };
}
