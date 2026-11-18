/** Jetons d'injection du module Minimoa+ (chantier « facturation-admin »). */

/** Port `Billing` d'Apple : vérifie les transactions, renouvellements et notifications signés (JWS). */
export const APPLE_BILLING = Symbol('APPLE_BILLING');
/** Port `Billing` de Google Play : emplacement réservé (Android viendra plus tard). */
export const GOOGLE_BILLING = Symbol('GOOGLE_BILLING');
export const SUBSCRIPTIONS = Symbol('SUBSCRIPTIONS');
export const STORE_NOTIFICATIONS = Symbol('STORE_NOTIFICATIONS');
/** Relais des notifications Apple vers RevenueCat (`REVENUECAT_APPLE_NOTIFICATIONS_URL`), désactivé sans URL. */
export const APPLE_NOTIFICATION_RELAY = Symbol('APPLE_NOTIFICATION_RELAY');

/**
 * Nombre réel de personnes compatibles dans la zone d'une personne, pour le paywall.
 * Fourni par le chantier « vision » s'il expose ce service ; sinon une valeur par défaut qui rend 0
 * (et l'app cache le bloc). Voir `billing.module.ts`.
 */
export const COMPATIBLE_NEARBY = Symbol('COMPATIBLE_NEARBY');
export interface CompatibleNearby {
  count(userId: string): Promise<number>;
}
