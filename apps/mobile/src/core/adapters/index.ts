import { config } from '../config';
import type { Ports } from '../ports';
import { localAuth, localMedia, pollingRealtime } from './local';
import { simulatedPurchases } from './purchases';
import { storeKitPurchases } from './storekit';
import { createSupabase, supabaseAuth, supabaseMedia, supabaseRealtime } from './supabase';

/** Racine de composition : choisit les adaptateurs selon la configuration. */
export function createPorts(): Ports {
  if (config.auth === 'local') {
    // Mode local : achat simulé (API en mémoire), pour tester Blowy+ de bout en bout sans Apple.
    return { auth: localAuth(), realtime: pollingRealtime(), media: localMedia(), purchases: simulatedPurchases() };
  }
  const sb = createSupabase();
  // StoreKit sur iPhone ; ailleurs, aucun achat (`storekit.ts`).
  return { auth: supabaseAuth(sb), realtime: supabaseRealtime(sb), media: supabaseMedia(sb), purchases: storeKitPurchases() };
}
