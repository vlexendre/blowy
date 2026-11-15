import type { Plan, Store, SubscriptionState } from '@blowy/domain';

export type AppleEnvironment = 'Production' | 'Sandbox' | 'Xcode' | 'LocalTesting';

/** Transaction signée par Apple, vérifiée puis décodée (JWSTransactionDecodedPayload ; dates en ms). */
export interface VerifiedTransaction {
  environment: AppleEnvironment;
  bundleId: string;
  originalTransactionId: string;
  transactionId: string;
  productId: string;
  /** `Auto-Renewable Subscription`, `Non-Consumable`… */
  type: string;
  purchaseDate: number;
  expiresDate: number | null;
  /** 1 offre d'introduction, 2 promotionnelle, 3 code, 4 reconquête. */
  offerType: number | null;
  /** `FREE_TRIAL`, `PAY_AS_YOU_GO`, `PAY_UP_FRONT`, `ONE_TIME` (absent des anciens magasins). */
  offerDiscountType: string | null;
  revocationDate: number | null;
  /** UUID passé par l'app à l'achat (`appAccountToken`) : l'identifiant Blowy de la personne. */
  appAccountToken: string | null;
  signedDate: number;
}

/** Informations de renouvellement signées (JWSRenewalInfoDecodedPayload). */
export interface VerifiedRenewal {
  environment: AppleEnvironment;
  originalTransactionId: string;
  autoRenewStatus: boolean;
  autoRenewProductId: string | null;
  isInBillingRetryPeriod: boolean;
  gracePeriodExpiresDate: number | null;
  signedDate: number;
}

/** Notification App Store Server Notifications V2, vérifiée (responseBodyV2DecodedPayload). */
export interface VerifiedNotification {
  notificationUUID: string;
  notificationType: string;
  subtype: string | null;
  signedDate: number;
  environment: AppleEnvironment | null;
  /** Statut de l'abonnement au moment de la signature (1 à 5), si fourni. */
  status: 1 | 2 | 3 | 4 | 5 | null;
  transaction: VerifiedTransaction | null;
  renewal: VerifiedRenewal | null;
}

/** Données signées refusées (signature, chaîne de certificats, app ou environnement). */
export class BillingVerificationError extends Error {
  constructor(readonly reason: string) {
    super(`vérification refusée : ${reason}`);
    this.name = 'BillingVerificationError';
  }
}

/**
 * Port `Billing` d'un magasin. L'adaptateur réel d'Apple vérifie les JWS localement (chaîne x5c jusqu'à
 * l'autorité racine Apple, signature ES256) : aucun intermédiaire, aucun appel réseau.
 */
export interface Billing {
  readonly store: Store;
  verifyTransaction(jws: string): Promise<VerifiedTransaction>;
  verifyRenewal(jws: string): Promise<VerifiedRenewal>;
  verifyNotification(signedPayload: string): Promise<VerifiedNotification>;
}

export interface SubscriptionRecord extends SubscriptionState {
  userId: string | null;
  environment: string;
  /** Fin d'essai pour laquelle le rappel du jour 5 est parti. */
  trialReminderFor: string | null;
}

export interface SubscriptionsRepository {
  find(store: Store, originalTransactionId: string): Promise<SubscriptionRecord | null>;
  /** Abonnement le plus pertinent d'une personne (le plus lointain en échéance). */
  latestForUser(userId: string): Promise<SubscriptionRecord | null>;
  save(record: SubscriptionRecord): Promise<void>;
  /** Écrit `profiles.plus_until` (seule source de `hasPlus`). */
  setPlusUntil(userId: string, plusUntil: string | null): Promise<void>;
  /** Essais en cours, qui se renouvellent, finissant avant `endsBefore`, dont le rappel n'est pas parti. */
  trialsEndingBefore(endsBefore: string, limit: number): Promise<SubscriptionRecord[]>;
  markTrialReminded(store: Store, originalTransactionId: string, trialEndsAt: string): Promise<void>;
  /** Un essai a-t-il déjà été utilisé par cette personne ? */
  trialUsedBy(userId: string): Promise<boolean>;
}

export interface StoreNotificationRecord {
  store: Store;
  notificationId: string;
  type: string;
  subtype: string | null;
  originalTransactionId: string | null;
  environment: string | null;
  signedAt: string;
  receivedAt: string;
  processedAt: string | null;
  outcome: string | null;
}

export interface StoreNotificationsRepository {
  /** Enregistre la notification ; faux si elle était déjà traitée (renvoi d'Apple). */
  begin(record: StoreNotificationRecord): Promise<boolean>;
  finish(store: Store, notificationId: string, outcome: string, at: string): Promise<void>;
  /** Purge des notifications reçues avant `before`. */
  purge(before: string): Promise<number>;
}

/** Correspondance produit → offre, depuis la configuration (`PLUS_PRODUCT_YEARLY`, `PLUS_PRODUCT_MONTHLY`). */
export interface PlusProducts {
  yearly: string;
  monthly: string;
}
export const planOfProduct = (products: PlusProducts, productId: string): Plan | null =>
  productId === products.yearly ? 'yearly' : productId === products.monthly ? 'monthly' : null;
