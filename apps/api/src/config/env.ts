/** Variables d'environnement validées au démarrage : l'API refuse de démarrer si elles sont incohérentes. */
import { z } from 'zod';

const emptyToUndefined = (v: unknown): unknown => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const EnvSchema = z
  .object({
    BLOWY_ENV: z.enum(['local', 'production']).default('local'),
    BLOWY_ADAPTERS: z.enum(['memory', 'supabase']).default('memory'),
    BLOWY_DEMO: z.preprocess(emptyToUndefined, z.enum(['0', '1']).default('0')),
    PORT: z.coerce.number().int().min(0).max(65535).default(3000),
    /** URL publique de l'API (sert aux liens d'envoi et de lecture des photos en mode mémoire). */
    API_URL: optionalString,
    SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    RESEND_API_KEY: optionalString,
    MAIL_FROM: z.string().default('Blowy <hello@blowy.app>'),
    WEB_URL: z.string().url().default('https://blowy.app'),
    CORS_ORIGINS: z.string().default(''),
  })
  .superRefine((env, ctx) => {
    if (env.BLOWY_ENV === 'production' && env.BLOWY_ADAPTERS === 'memory') {
      ctx.addIssue({ code: 'custom', message: 'la production refuse les adaptateurs mémoire (BLOWY_ADAPTERS=supabase)' });
    }
    if (env.BLOWY_ADAPTERS === 'supabase' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
      ctx.addIssue({ code: 'custom', message: 'SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis avec BLOWY_ADAPTERS=supabase' });
    }
  });

export interface Env {
  env: 'local' | 'production';
  adapters: 'memory' | 'supabase';
  demo: boolean;
  port: number;
  apiUrl: string;
  supabase: { url: string; serviceRoleKey: string } | null;
  resendApiKey: string | null;
  mailFrom: string;
  webUrl: string;
  corsOrigins: string[];
}

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'env'} : ${i.message}`).join(' ; ');
    throw new Error(`configuration invalide — ${details}`);
  }
  const e = parsed.data;
  return {
    env: e.BLOWY_ENV,
    adapters: e.BLOWY_ADAPTERS,
    demo: e.BLOWY_DEMO === '1' && e.BLOWY_ENV === 'local' && e.BLOWY_ADAPTERS === 'memory',
    port: e.PORT,
    apiUrl: (e.API_URL ?? `http://localhost:${e.PORT}`).replace(/\/$/, ''),
    supabase: e.SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY ? { url: e.SUPABASE_URL, serviceRoleKey: e.SUPABASE_SERVICE_ROLE_KEY } : null,
    resendApiKey: e.RESEND_API_KEY ?? null,
    mailFrom: e.MAIL_FROM,
    webUrl: e.WEB_URL.replace(/\/$/, ''),
    corsOrigins: e.CORS_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0),
  };
}
