/**
 * Variables publiques (EXPO_PUBLIC_*), lues statiquement pour que Metro les inline.
 * Validées par Zod au démarrage : une URL invalide échoue tôt plutôt qu'en plein écran.
 */
import { z } from 'zod';

const EnvSchema = z.object({
  apiUrl: z.string().url(),
  wsUrl: z.string().url(),
  blowyEnv: z.enum(['local', 'test', 'staging', 'production']),
  /** Mode d'auth annoncé : `local` (LocalAuthProvider de l'API, comptes de démo) ou `firebase`. */
  authMode: z.enum(['local', 'firebase']),
  revenueCatIosKey: z.string().optional(),
  revenueCatAndroidKey: z.string().optional(),
  /** Clé PUBLIABLE Stripe (pk_…) : publique par construction, jamais une clé secrète (sk_/rk_ refusées). */
  stripePublishableKey: z.string().regex(/^pk_(test|live)_/).optional(),
  /** Identifiant marchand Apple Pay (merchant.…), public. */
  appleMerchantId: z.string().optional(),
  firebase: z.object({ apiKey: z.string().optional(), projectId: z.string().optional(), appId: z.string().optional() }),
});
export type AppEnv = z.infer<typeof EnvSchema>;

const blank = (v: string | undefined) => (v && v.length > 0 ? v : undefined);

export function readEnv(source: Record<string, string | undefined>): AppEnv {
  return EnvSchema.parse({
    apiUrl: source.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
    wsUrl: source.EXPO_PUBLIC_WS_URL ?? source.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
    blowyEnv: source.EXPO_PUBLIC_BLOWY_ENV ?? 'local',
    authMode: source.EXPO_PUBLIC_AUTH_MODE ?? 'local',
    revenueCatIosKey: blank(source.EXPO_PUBLIC_REVENUECAT_IOS_KEY),
    revenueCatAndroidKey: blank(source.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY),
    stripePublishableKey: blank(source.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    appleMerchantId: blank(source.EXPO_PUBLIC_APPLE_MERCHANT_ID),
    firebase: {
      apiKey: blank(source.EXPO_PUBLIC_FIREBASE_API_KEY),
      projectId: blank(source.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
      appId: blank(source.EXPO_PUBLIC_FIREBASE_APP_ID),
    },
  });
}

export const env: AppEnv = readEnv({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_WS_URL: process.env.EXPO_PUBLIC_WS_URL,
  EXPO_PUBLIC_BLOWY_ENV: process.env.EXPO_PUBLIC_BLOWY_ENV,
  EXPO_PUBLIC_AUTH_MODE: process.env.EXPO_PUBLIC_AUTH_MODE,
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_APPLE_MERCHANT_ID: process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID,
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

export const isProduction = env.blowyEnv === 'production';

/** Connexion locale (comptes de démo du seed) : jamais en production, quel que soit le réglage. */
export const localAuthEnabled = (e: Pick<AppEnv, 'blowyEnv' | 'authMode'>): boolean => e.blowyEnv !== 'production' && e.authMode === 'local';
