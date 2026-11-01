/**
 * Configuration validée par Zod au démarrage (fail-fast).
 * Stratégie de sélection d'adaptateurs par environnement : la production refuse
 * tout adaptateur local/factice et DEV_AUTH_BYPASS.
 */
import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .optional()
  .transform((v) => v === 'true' || v === '1');

export const BLOWY_ENVS = ['local', 'test', 'staging', 'production'] as const;
export type BlowyEnv = (typeof BLOWY_ENVS)[number];

const RawEnvSchema = z.object({
  BLOWY_ENV: z.enum(BLOWY_ENVS).default('local'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: z.string().default(''),
  /** Fournisseur d'authentification : firebase (réel ou émulateur) | local (déterministe, hors production). */
  AUTH_PROVIDER: z.enum(['firebase', 'local']).default('local'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  /** Secret HMAC des jetons de session opaques (≥ 32 caractères). */
  SESSION_SECRET: z.string().min(32),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(60),
  DEV_AUTH_BYPASS: bool,
  MODERATION_PROVIDER: z.enum(['local', 'external']).default('local'),
  VERIFICATION_PROVIDER: z.enum(['local_demo', 'veriff']).default('local_demo'),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(120),
  WORKER_OUTBOX_POLL_MS: z.coerce.number().int().min(50).default(500),
  ENABLE_SCHEDULERS: bool,
});

export type AppConfig = z.infer<typeof RawEnvSchema> & { isProduction: boolean; corsOrigins: string[] };

export class ConfigError extends Error {}

/** Valide l'environnement et applique les interdits de production. */
/** Valeurs par défaut appliquées UNIQUEMENT en local/test (clone neuf sans .env). */
const LOCAL_DEFAULTS: Record<string, string> = {
  DATABASE_URL: 'postgresql://blowy:blowy@localhost:5432/blowy',
  SESSION_SECRET: 'local-only-session-secret-not-for-production-0001',
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const blowyEnv = env.BLOWY_ENV ?? 'local';
  const withDefaults = blowyEnv === 'local' || blowyEnv === 'test' ? { ...LOCAL_DEFAULTS, ...stripEmpty(env) } : env;
  const parsed = RawEnvSchema.safeParse(withDefaults);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ConfigError(`Configuration invalide : ${issues}`);
  }
  const c = parsed.data;
  const isProduction = c.BLOWY_ENV === 'production';
  if (isProduction) {
    const violations: string[] = [];
    if (c.DEV_AUTH_BYPASS) violations.push('DEV_AUTH_BYPASS interdit en production');
    if (c.AUTH_PROVIDER !== 'firebase') violations.push('AUTH_PROVIDER=local interdit en production');
    if (c.FIREBASE_AUTH_EMULATOR_HOST) violations.push('émulateur Firebase interdit en production');
    if (!c.FIREBASE_PROJECT_ID) violations.push('FIREBASE_PROJECT_ID requis');
    if (c.MODERATION_PROVIDER === 'local') violations.push('MODERATION_PROVIDER=local interdit en production');
    if (c.VERIFICATION_PROVIDER === 'local_demo') violations.push('VERIFICATION_PROVIDER=local_demo interdit en production');
    if (violations.length) throw new ConfigError(`Production refusée : ${violations.join('; ')}`);
  }
  if (c.AUTH_PROVIDER === 'firebase' && !c.FIREBASE_PROJECT_ID) {
    throw new ConfigError('AUTH_PROVIDER=firebase exige FIREBASE_PROJECT_ID');
  }
  return {
    ...c,
    isProduction,
    corsOrigins: c.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  };
}

export const APP_CONFIG = Symbol('AppConfig');

function stripEmpty(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(Object.entries(env).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== ''));
}
