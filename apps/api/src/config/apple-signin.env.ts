/**
 * Révocation des jetons de Sign in with Apple à la suppression d'un compte (exigence d'Apple, voir docs/CONNEXION.md).
 * Clé « Sign in with Apple » (.p8, créée dans Certificates, Identifiers & Profiles → Keys), son identifiant et
 * l'identifiant d'équipe ; l'identifiant client est celui de l'app (bundle iOS). Seulement dans `apps/api/.env` (ou
 * les variables de l'hébergeur), jamais journalisés. Sans elles, la révocation est désactivée (rien n'est bloqué).
 */
import { z } from 'zod';

const emptyToUndefined = (v: unknown): unknown => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const AppleSignInSchema = z.object({
  /** Contenu PEM (PKCS#8) de la clé `.p8` ; « \n » littéraux acceptés. */
  APPLE_SIGNIN_KEY_P8: z.preprocess(emptyToUndefined, z.string().optional()),
  APPLE_SIGNIN_KEY_ID: z.preprocess(emptyToUndefined, z.string().length(10, '10 caractères').optional()),
  APPLE_SIGNIN_TEAM_ID: z.preprocess(emptyToUndefined, z.string().length(10, '10 caractères').optional()),
  /** `client_id` des appels à Apple : l'identifiant de l'app qui a reçu le code (connexion native : le bundle iOS). */
  APPLE_SIGNIN_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
});

export interface AppleSignInEnv {
  /** apple : clé présente · memory : adaptateurs mémoire sans clé (tests, local) · off : rien. */
  provider: 'apple' | 'memory' | 'off';
  apple: { keyP8: string; keyId: string; teamId: string; clientId: string } | null;
}

export function loadAppleSignInEnv(source: Record<string, string | undefined>, adapters: 'memory' | 'supabase', bundleId: string): AppleSignInEnv {
  const parsed = AppleSignInSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'env'} : ${i.message}`).join(' ; ');
    throw new Error(`configuration invalide — ${details}`);
  }
  const e = parsed.data;
  const parts = [e.APPLE_SIGNIN_KEY_P8, e.APPLE_SIGNIN_KEY_ID, e.APPLE_SIGNIN_TEAM_ID].filter((v) => v !== undefined).length;
  if (parts > 0 && parts < 3) throw new Error('configuration invalide — APPLE_SIGNIN_KEY_P8, APPLE_SIGNIN_KEY_ID et APPLE_SIGNIN_TEAM_ID vont ensemble');
  if (e.APPLE_SIGNIN_KEY_P8 && e.APPLE_SIGNIN_KEY_ID && e.APPLE_SIGNIN_TEAM_ID) {
    return {
      provider: 'apple',
      apple: { keyP8: e.APPLE_SIGNIN_KEY_P8, keyId: e.APPLE_SIGNIN_KEY_ID, teamId: e.APPLE_SIGNIN_TEAM_ID, clientId: e.APPLE_SIGNIN_CLIENT_ID ?? bundleId },
    };
  }
  return { provider: adapters === 'memory' ? 'memory' : 'off', apple: null };
}
