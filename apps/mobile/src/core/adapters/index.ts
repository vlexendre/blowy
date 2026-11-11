import { config } from '../config';
import type { Ports } from '../ports';
import { localAuth, localMedia, pollingRealtime } from './local';
import { noPurchases } from './purchases';
import { createSupabase, supabaseAuth, supabaseMedia, supabaseRealtime } from './supabase';

/** Racine de composition : choisit les adaptateurs selon la configuration. */
export function createPorts(): Ports {
  if (config.auth === 'local') {
    return { auth: localAuth(), realtime: pollingRealtime(), media: localMedia(), purchases: noPurchases };
  }
  const sb = createSupabase();
  return { auth: supabaseAuth(sb), realtime: supabaseRealtime(sb), media: supabaseMedia(sb), purchases: noPurchases };
}
