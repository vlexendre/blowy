import type { StoreEvent } from '@blowy/domain';
import { type PlusProducts, type VerifiedNotification, type VerifiedRenewal, type VerifiedTransaction, planOfProduct } from '../ports';

const isoOf = (ms: number | null): string | null => (ms === null ? null : new Date(ms).toISOString());

/**
 * Ramène une transaction Apple vérifiée (et, si connus, son renouvellement et sa notification) à un événement
 * du domaine. Null si le produit n'est pas un abonnement Blowy+.
 */
export function appleStoreEvent(
  products: PlusProducts,
  tx: VerifiedTransaction,
  renewal: VerifiedRenewal | null,
  notification: VerifiedNotification | null,
): StoreEvent | null {
  const plan = planOfProduct(products, tx.productId);
  if (!plan) return null;
  // Offre d'introduction gratuite : `offerDiscountType` = FREE_TRIAL ; les magasins plus anciens ne donnent que
  // `offerType` = 1 (introduction), et la seule offre d'introduction de Blowy+ est l'essai gratuit.
  const freeTrial = tx.offerDiscountType === 'FREE_TRIAL' || (tx.offerDiscountType === null && tx.offerType === 1);
  const usableRenewal = renewal && renewal.originalTransactionId === tx.originalTransactionId ? renewal : null;
  return {
    store: 'apple',
    kind: notification?.notificationType ?? null,
    subtype: notification?.subtype ?? null,
    signedAt: new Date(notification?.signedDate ?? Math.max(tx.signedDate, usableRenewal?.signedDate ?? 0)).toISOString(),
    originalTransactionId: tx.originalTransactionId,
    transactionId: tx.transactionId,
    productId: tx.productId,
    plan,
    purchasedAt: new Date(tx.purchaseDate).toISOString(),
    expiresAt: isoOf(tx.expiresDate),
    freeTrial,
    revokedAt: isoOf(tx.revocationDate),
    storeStatus: notification?.status ?? null,
    renewal: usableRenewal
      ? { autoRenew: usableRenewal.autoRenewStatus, inBillingRetry: usableRenewal.isInBillingRetryPeriod, graceUntil: isoOf(usableRenewal.gracePeriodExpiresDate) }
      : null,
  };
}
