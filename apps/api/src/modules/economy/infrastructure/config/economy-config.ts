import { z } from 'zod';

/**
 * Configuration économie validée au démarrage (Strategy de sélection d'adaptateur).
 * - BILLING_PROVIDER=revenuecat : REVENUECAT_SECRET_API_KEY + REVENUECAT_WEBHOOK_AUTH requis.
 * - BILLING_PROVIDER=local_demo : interdit si BLOWY_ENV=production (démarrage refusé).
 * - REVENUECAT_ACCEPT_SANDBOX : droits issus d'achats sandbox acceptés (staging, revue App Store) ;
 *   en production, les droits sandbox sont refusés sauf activation explicite.
 */
const bool = z
  .enum(['true', 'false', '1', '0'])
  .optional()
  .transform((v) => v === 'true' || v === '1');

const EconomyEnvSchema = z.object({
  BLOWY_ENV: z.enum(['local', 'test', 'staging', 'production']).default('local'),
  BILLING_PROVIDER: z.enum(['revenuecat', 'local_demo']).optional(),
  REVENUECAT_SECRET_API_KEY: z.string().min(10).optional(),
  /** Valeur EXACTE du header Authorization configuré dans le dashboard RevenueCat (webhook). */
  REVENUECAT_WEBHOOK_AUTH: z.string().min(24).optional(),
  REVENUECAT_API_BASE_URL: z.string().url().default('https://api.revenuecat.com/v1'),
  REVENUECAT_ACCEPT_SANDBOX: bool,
  REVENUECAT_TIMEOUT_MS: z.coerce.number().int().min(500).max(30_000).default(8_000),
});

export type EconomyConfig = {
  env: 'local' | 'test' | 'staging' | 'production';
  provider: 'revenuecat' | 'local_demo';
  revenueCat: { secretApiKey: string; webhookAuth: string; baseUrl: string; acceptSandbox: boolean; timeoutMs: number } | null;
  /** Webhook local de démonstration : secret dérivé de l'env (jamais en production). */
  localWebhookAuth: string | null;
};

export class EconomyConfigError extends Error {}

export function loadEconomyConfig(env: NodeJS.ProcessEnv = process.env): EconomyConfig {
  const parsed = EconomyEnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new EconomyConfigError(`Configuration économie invalide : ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  const c = parsed.data;
  const isProduction = c.BLOWY_ENV === 'production';
  // Par défaut : revenuecat si la clé existe, sinon démo locale (hors production).
  const provider = c.BILLING_PROVIDER ?? (c.REVENUECAT_SECRET_API_KEY ? 'revenuecat' : isProduction ? 'revenuecat' : 'local_demo');
  if (provider === 'local_demo') {
    if (isProduction) throw new EconomyConfigError('Production refusée : BILLING_PROVIDER=local_demo interdit en production');
    return { env: c.BLOWY_ENV, provider, revenueCat: null, localWebhookAuth: c.REVENUECAT_WEBHOOK_AUTH ?? null };
  }
  const missing = [
    !c.REVENUECAT_SECRET_API_KEY && 'REVENUECAT_SECRET_API_KEY',
    !c.REVENUECAT_WEBHOOK_AUTH && 'REVENUECAT_WEBHOOK_AUTH',
  ].filter(Boolean);
  if (missing.length) throw new EconomyConfigError(`BILLING_PROVIDER=revenuecat exige ${missing.join(', ')}`);
  return {
    env: c.BLOWY_ENV,
    provider,
    revenueCat: {
      secretApiKey: c.REVENUECAT_SECRET_API_KEY!,
      webhookAuth: c.REVENUECAT_WEBHOOK_AUTH!,
      baseUrl: c.REVENUECAT_API_BASE_URL,
      acceptSandbox: isProduction ? c.REVENUECAT_ACCEPT_SANDBOX : true,
      timeoutMs: c.REVENUECAT_TIMEOUT_MS,
    },
    localWebhookAuth: null,
  };
}

export const ECONOMY_CONFIG = Symbol('EconomyConfig');
