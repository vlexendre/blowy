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
  /** IA (agent E) : local (déterministe, hors prod) | openai | none (rien n'est approuvé). */
  AI_PROVIDER: z.enum(['local', 'openai', 'none']).default('local'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODERATION_MODEL: z.string().default('omni-moderation-latest'),
  OPENAI_TEXT_MODEL: z.string().optional(),
  OPENAI_VISION_MODEL: z.string().optional(),
  OPENAI_TRANSCRIPTION_MODEL: z.string().optional(),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(15_000),
  AI_PRICE_TABLE_JSON: z.string().optional(),
  AI_GLOBAL_COST_MICROS_PER_DAY: z.coerce.number().int().min(0).default(50_000_000),
  AI_PER_USER_PER_DAY: z.coerce.number().int().min(1).default(400),
  /** Veriff (agent E) — secrets serveur uniquement. */
  VERIFF_API_KEY: z.string().optional(),
  VERIFF_SHARED_SECRET: z.string().optional(),
  VERIFF_BASE_URL: z.string().url().optional(),
  VERIFF_CALLBACK_URL: z.string().url().optional(),
  /** Stockage objets (agent E) : s3 (MinIO/S3 privé) | fs (tests/local sans Docker, interdit en prod). */
  STORAGE_DRIVER: z.enum(['s3', 'fs']).default('fs'),
  STORAGE_FS_ROOT: z.string().default('.local/storage'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET: z.string().optional(),
  S3_FORCE_PATH_STYLE: bool,
  /** URL publique de l'API (liens d'upload/contenu signés). */
  PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  /** Secret HMAC des jetons médias / liens d'export (défaut dérivé de SESSION_SECRET hors prod). */
  MEDIA_TOKEN_SECRET: z.string().min(32).optional(),
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
    if (c.AI_PROVIDER === 'local') violations.push('AI_PROVIDER=local interdit en production');
    if (c.STORAGE_DRIVER === 'fs') violations.push('STORAGE_DRIVER=fs interdit en production');
    if (!c.MEDIA_TOKEN_SECRET) violations.push('MEDIA_TOKEN_SECRET requis');
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
