import { z } from 'zod';

/**
 * Configuration paiements V5 (Strategy de sélection, validée au démarrage) :
 * - `PAYMENT_PROVIDER=stripe` : `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` requis ; en production,
 *   clé LIVE (`sk_live_`/`rk_live_`) exigée et événements de test refusés ; hors production, clé
 *   live refusée (aucun débit réel par erreur).
 * - `PAYMENT_PROVIDER=local_demo` : refusé si `BLOWY_ENV=production` (démarrage impossible).
 * - Défaut : stripe si une clé existe ; sinon `local_demo` hors production, `none` en production
 *   (paiement indisponible → 503 PROVIDER_UNAVAILABLE / 501 NOT_CONFIGURED, jamais de démo).
 * Les secrets ne sont jamais loggés ni renvoyés.
 */
const EnvSchema = z.object({
  BLOWY_ENV: z.enum(['local', 'test', 'staging', 'production']).default('local'),
  PAYMENT_PROVIDER: z.enum(['stripe', 'local_demo', 'none']).optional(),
  STRIPE_SECRET_KEY: z.string().regex(/^(sk|rk)_(test|live)_[A-Za-z0-9_]{8,}$/, 'format de clé Stripe invalide').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_[A-Za-z0-9_]{8,}$/, 'format de secret webhook Stripe invalide').optional(),
  STRIPE_API_BASE_URL: z.string().url().default('https://api.stripe.com'),
  STRIPE_API_VERSION: z.string().regex(/^\d{4}-\d{2}-\d{2}(\.[a-z]+)?$/).optional(),
  STRIPE_TIMEOUT_MS: z.coerce.number().int().min(500).max(30_000).default(8_000),
  STRIPE_WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().min(30).max(600).default(300),
  /** V5.4 (C.10) : prix Stripe Billing de Blowy+ (`price_…`, 9,99 €/mois) ; absent → Blowy+ indisponible (503). */
  STRIPE_PLUS_PRICE_ID: z.string().regex(/^price_[A-Za-z0-9_]{4,}$/, 'format de prix Stripe invalide').optional(),
});

export type PaymentsConfig =
  | { env: string; provider: 'none' }
  | { env: string; provider: 'local_demo' }
  | {
      env: string;
      provider: 'stripe';
      stripe: { secretKey: string; webhookSecret: string; baseUrl: string; apiVersion: string | null; timeoutMs: number; toleranceSeconds: number; livemode: boolean; plusPriceId: string | null };
    };

export class PaymentsConfigError extends Error {}

export function loadPaymentsConfig(env: NodeJS.ProcessEnv = process.env): PaymentsConfig {
  const parsed = EnvSchema.safeParse(env);
  // Message sans valeur : seuls les noms de variables apparaissent (jamais un secret).
  if (!parsed.success) throw new PaymentsConfigError(`Configuration paiements invalide : ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`);
  const c = parsed.data;
  const prod = c.BLOWY_ENV === 'production';
  const provider = c.PAYMENT_PROVIDER ?? (c.STRIPE_SECRET_KEY ? 'stripe' : prod ? 'none' : 'local_demo');
  if (provider === 'local_demo') {
    if (prod) throw new PaymentsConfigError('Production refusée : PAYMENT_PROVIDER=local_demo interdit en production');
    return { env: c.BLOWY_ENV, provider };
  }
  if (provider === 'none') return { env: c.BLOWY_ENV, provider };
  const missing = [!c.STRIPE_SECRET_KEY && 'STRIPE_SECRET_KEY', !c.STRIPE_WEBHOOK_SECRET && 'STRIPE_WEBHOOK_SECRET'].filter(Boolean);
  if (missing.length) throw new PaymentsConfigError(`PAYMENT_PROVIDER=stripe exige ${missing.join(', ')}`);
  const livemode = /^(sk|rk)_live_/.test(c.STRIPE_SECRET_KEY!);
  if (prod && !livemode) throw new PaymentsConfigError('Production refusée : clé Stripe de test');
  if (!prod && livemode) throw new PaymentsConfigError(`Clé Stripe LIVE refusée hors production (BLOWY_ENV=${c.BLOWY_ENV})`);
  return {
    env: c.BLOWY_ENV,
    provider,
    stripe: {
      secretKey: c.STRIPE_SECRET_KEY!,
      webhookSecret: c.STRIPE_WEBHOOK_SECRET!,
      baseUrl: c.STRIPE_API_BASE_URL,
      apiVersion: c.STRIPE_API_VERSION ?? null,
      timeoutMs: c.STRIPE_TIMEOUT_MS,
      toleranceSeconds: c.STRIPE_WEBHOOK_TOLERANCE_SECONDS,
      livemode,
      plusPriceId: c.STRIPE_PLUS_PRICE_ID ?? null,
    },
  };
}
