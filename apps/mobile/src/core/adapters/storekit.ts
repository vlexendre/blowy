/** Hors iPhone : pas de StoreKit (Metro choisit `storekit.ios.ts` sur iOS). */
import type { PurchasesPort } from '../ports';
import { noPurchases } from './purchases';

export const storeKitPurchases = (): PurchasesPort => noPurchases;
