/**
 * RevenueCat (achat intégré) : DÉSACTIVÉ en V5.4 (§C11, Blowy+ payé par Stripe comme les places).
 * Code conservé, plus monté par AppProviders ni importé par un écran.
 */
/** API publique de la feature achats (agent G). Les écrans n'importent que depuis ce fichier. */
export type { PurchasesPort, Offerings, StoreOffering, StorePackage, IntroOffer, PurchaseOutcome, PackagePeriod } from './model/purchases.port';
export { PurchasesProvider, usePurchases, useOfferings, useEntitlements, useWallet } from './model/purchases.context';
export { selectPaywall, computeDiscountPercent, LATER_OFFER_PLACEMENT, type PaywallSelection } from './model/offer-selection';
export { createPurchasesApi, type PurchasesApi, type HttpTransport } from './api/purchases.api';
export { selectPurchasesAdapter, type PurchasesEnv } from './adapters/select-purchases-adapter';
