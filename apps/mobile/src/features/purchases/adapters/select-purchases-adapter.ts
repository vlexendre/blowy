/**
 * Strategy de sélection de l'adapter achats (une seule fonction, utilisée par le Provider racine).
 * - Clé publique présente → RevenueCat réel (SANDBOX hors build production).
 * - Pas de clé : LOCAL_DEMO uniquement en développement ; en production → null (fonctionnalité
 *   indisponible, jamais de fausse transaction).
 */
import type { PurchasesApi } from '../api/purchases.api';
import type { PurchasesPort } from '../model/purchases.port';
import { LocalDemoPurchasesAdapter } from './local-demo-purchases.adapter';
import { RevenueCatPurchasesAdapter } from './revenuecat-purchases.adapter';

export interface PurchasesEnv {
  platform: 'ios' | 'android' | 'web';
  /** process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY (clé PUBLIQUE SDK, pas un secret). */
  iosKey?: string;
  /** process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY. */
  androidKey?: string;
  /** process.env.EXPO_PUBLIC_BLOWY_ENV : 'local' | 'test' | 'staging' | 'production'. */
  blowyEnv: string;
}

export function selectPurchasesAdapter(
  env: PurchasesEnv,
  api: PurchasesApi,
  newCommandId: () => string,
): PurchasesPort | null {
  const key =
    env.platform === 'ios' ? env.iosKey : env.platform === 'android' ? env.androidKey : undefined;
  if (key && env.platform !== 'web') {
    return new RevenueCatPurchasesAdapter({
      apiKey: key,
      platform: env.platform,
      mode: env.blowyEnv === 'production' ? 'LIVE' : 'SANDBOX',
    });
  }
  if (env.blowyEnv === 'production') return null;
  return new LocalDemoPurchasesAdapter(api, newCommandId);
}
