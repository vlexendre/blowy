import type { PurchasesPort } from '../ports';

/** Achats non branchés dans cette version : l'écran Blowy+ présente l'offre sans vendre. */
export const noPurchases: PurchasesPort = {
  available: false,
  purchase: async () => false,
  restore: async () => false,
};
