/**
 * Variables du chantier « plateforme » (IA, push, minuteur), validées au démarrage avec le reste de la configuration.
 * Les secrets (ANTHROPIC_API_KEY, EXPO_ACCESS_TOKEN, INTERNAL_TICK_SECRET) ne viennent que de `apps/api/.env`
 * (ou des variables de l'hébergeur) ; ils ne sont jamais journalisés.
 */
import { type AiFeatureKey, type AiPrice, type AiTier, DEFAULT_AI_PRICES, dollarsToMicros, parseAiBudgets } from '@blowy/domain';
import { DEFAULT_AI_PROCESSOR } from '@blowy/content';
import { z } from 'zod';
import type { BlowyEnv } from './env';

const emptyToUndefined = (v: unknown): unknown => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const prices = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*$/, 'quatre nombres : entrée,sortie,écriture cache,lecture cache ($ par million de jetons)')
    .optional(),
);

const PlateformeSchema = z.object({
  ANTHROPIC_API_KEY: optionalString,
  AI_PROVIDER: z.preprocess(emptyToUndefined, z.enum(['anthropic', 'memory', 'off']).optional()),
  /** Identifiants de modèle par palier (docs : https://platform.claude.com/docs/en/models/overview). */
  /**
   * Prestataire d'IA nommé dans les textes vus par les gens (accord de lecture des chats, accord des preuves) :
   * doit rester celui de la politique de confidentialité (`apps/web/src/config/legal.ts`, `PROCESSORS.ai`).
   */
  AI_PROVIDER_NAME: z.preprocess(emptyToUndefined, z.string().max(60).optional()),
  /** Pays où ce prestataire traite les données (code ISO 3166-1 alpha-2, « US »). */
  AI_PROVIDER_COUNTRY: z.preprocess(emptyToUndefined, z.string().regex(/^[A-Za-z]{2}$/, 'code pays ISO à deux lettres').optional()),
  AI_MODEL_SMALL: z.preprocess(emptyToUndefined, z.string().default('claude-haiku-5-5')),
  AI_MODEL_MEDIUM: z.preprocess(emptyToUndefined, z.string().default('claude-sonnet-5-5')),
  AI_KILL_SWITCH: z.preprocess(emptyToUndefined, z.enum(['0', '1']).default('0')),
  AI_DAILY_CEILING_USD: z.preprocess(emptyToUndefined, z.coerce.number().min(0).default(3)),
  /** « chat_remark=4,habit_proof=6,weekly_review=1,moderation=4 » (appels par personne et par jour). */
  AI_USER_BUDGETS: optionalString,
  AI_PRICES_SMALL: prices,
  AI_PRICES_MEDIUM: prices,
  AI_EUR_PER_USD: z.preprocess(emptyToUndefined, z.coerce.number().positive().default(0.9)),
  PUSH_PROVIDER: z.preprocess(emptyToUndefined, z.enum(['expo', 'memory', 'off']).optional()),
  EXPO_ACCESS_TOKEN: optionalString,
  INTERNAL_TICK_SECRET: z.preprocess(emptyToUndefined, z.string().min(24, 'au moins 24 caractères').optional()),
  TICK_BUDGET_MS: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1000).max(120_000).default(20_000)),
  /** Activités en direct iOS : clé APNs `.p8` (contenu PEM ; « \n » littéraux acceptés), son identifiant, l'équipe. */
  APNS_KEY_P8: optionalString,
  APNS_KEY_ID: z.preprocess(emptyToUndefined, z.string().length(10, '10 caractères').optional()),
  APNS_TEAM_ID: z.preprocess(emptyToUndefined, z.string().length(10, '10 caractères').optional()),
  /** production : api.push.apple.com (TestFlight, App Store) · sandbox : builds de développement. */
  APNS_ENVIRONMENT: z.preprocess(emptyToUndefined, z.enum(['production', 'sandbox']).default('production')),
});

export interface PlateformeEnv {
  ai: {
    provider: 'anthropic' | 'memory' | 'off';
    apiKey: string | null;
    models: Record<AiTier, string>;
    prices: Record<AiTier, AiPrice>;
    killSwitch: boolean;
    dailyCeilingMicros: number;
    userBudgets: Record<AiFeatureKey, number>;
    eurPerUsd: number;
    /** Prestataire nommé dans les textes (nom, pays ISO). */
    processor: { name: string; country: string };
  };
  push: { provider: 'expo' | 'memory' | 'off'; accessToken: string | null };
  tick: { secret: string | null; budgetMs: number };
  /** Activités en direct : apns (clé présente) · memory (adaptateurs mémoire, sans clé) · off. */
  liveActivities: { provider: 'apns' | 'memory' | 'off'; apns: { keyP8: string; keyId: string; teamId: string; environment: 'production' | 'sandbox' } | null };
}

const parsePrices = (raw: string | undefined, base: AiPrice): AiPrice => {
  if (!raw) return base;
  const [input = base.input, output = base.output, cacheWrite = base.cacheWrite, cacheRead = base.cacheRead] = raw.split(',').map((s) => Number(s.trim()));
  return { input, output, cacheWrite, cacheRead };
};

/** Lit et valide les variables ; lève une erreur lisible (sans valeur de secret) si elles sont incohérentes. */
export function loadPlateformeEnv(source: Record<string, string | undefined>, blowyEnv: BlowyEnv, adapters: 'memory' | 'supabase'): PlateformeEnv {
  const parsed = PlateformeSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'env'} : ${i.message}`).join(' ; ');
    throw new Error(`configuration invalide — ${details}`);
  }
  const e = parsed.data;
  const aiProvider = e.AI_PROVIDER ?? (e.ANTHROPIC_API_KEY ? 'anthropic' : adapters === 'memory' ? 'memory' : 'off');
  const pushProvider = e.PUSH_PROVIDER ?? (adapters === 'memory' ? 'memory' : 'expo');
  const problems: string[] = [];
  if (aiProvider === 'anthropic' && !e.ANTHROPIC_API_KEY) problems.push('AI_PROVIDER=anthropic demande ANTHROPIC_API_KEY');
  if (blowyEnv === 'production' && aiProvider === 'memory') problems.push('la production refuse AI_PROVIDER=memory');
  if (blowyEnv === 'production' && pushProvider === 'memory') problems.push('la production refuse PUSH_PROVIDER=memory');
  const apnsParts = [e.APNS_KEY_P8, e.APNS_KEY_ID, e.APNS_TEAM_ID].filter((v) => v !== undefined).length;
  if (apnsParts > 0 && apnsParts < 3) problems.push('APNS_KEY_P8, APNS_KEY_ID et APNS_TEAM_ID vont ensemble (activités en direct)');
  if (problems.length > 0) throw new Error(`configuration invalide — ${problems.join(' ; ')}`);
  const apns = e.APNS_KEY_P8 && e.APNS_KEY_ID && e.APNS_TEAM_ID ? { keyP8: e.APNS_KEY_P8, keyId: e.APNS_KEY_ID, teamId: e.APNS_TEAM_ID, environment: e.APNS_ENVIRONMENT } : null;
  return {
    ai: {
      provider: aiProvider,
      apiKey: e.ANTHROPIC_API_KEY ?? null,
      models: { small: e.AI_MODEL_SMALL, medium: e.AI_MODEL_MEDIUM },
      prices: { small: parsePrices(e.AI_PRICES_SMALL, DEFAULT_AI_PRICES.small), medium: parsePrices(e.AI_PRICES_MEDIUM, DEFAULT_AI_PRICES.medium) },
      killSwitch: e.AI_KILL_SWITCH === '1',
      dailyCeilingMicros: dollarsToMicros(e.AI_DAILY_CEILING_USD),
      userBudgets: parseAiBudgets(e.AI_USER_BUDGETS),
      eurPerUsd: e.AI_EUR_PER_USD,
      processor: { name: e.AI_PROVIDER_NAME ?? DEFAULT_AI_PROCESSOR.name, country: (e.AI_PROVIDER_COUNTRY ?? DEFAULT_AI_PROCESSOR.country).toUpperCase() },
    },
    push: { provider: pushProvider, accessToken: e.EXPO_ACCESS_TOKEN ?? null },
    tick: { secret: e.INTERNAL_TICK_SECRET ?? null, budgetMs: e.TICK_BUDGET_MS },
    liveActivities: { provider: apns ? 'apns' : adapters === 'memory' ? 'memory' : 'off', apns },
  };
}
