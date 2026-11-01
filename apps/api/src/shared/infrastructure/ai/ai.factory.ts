/** Composition des services IA selon la configuration (Strategy par environnement). */
import { AiEnvSchema, AiRunner, DEFAULT_AI_LIMITS, createAiProviders } from '@blowy/ai';
import type { Db } from '@blowy/database';
import type { AppConfig } from '../../../config/env.js';
import type { Clock } from '../../application/clock.js';
import type { AiServices } from '../../application/ports/ai.port.js';
import { PrismaAiJournal } from './prisma-ai-journal.js';

export function createAiServices(cfg: AppConfig, db: Db, clock: Clock): AiServices {
  const env = AiEnvSchema.parse({
    AI_PROVIDER: cfg.AI_PROVIDER,
    OPENAI_API_KEY: cfg.OPENAI_API_KEY,
    OPENAI_MODERATION_MODEL: cfg.OPENAI_MODERATION_MODEL,
    OPENAI_TEXT_MODEL: cfg.OPENAI_TEXT_MODEL,
    OPENAI_VISION_MODEL: cfg.OPENAI_VISION_MODEL,
    OPENAI_TRANSCRIPTION_MODEL: cfg.OPENAI_TRANSCRIPTION_MODEL,
    OPENAI_TIMEOUT_MS: cfg.OPENAI_TIMEOUT_MS,
    AI_PRICE_TABLE_JSON: cfg.AI_PRICE_TABLE_JSON,
  });
  const providers = createAiProviders(env, cfg.isProduction);
  const runner = new AiRunner({
    journal: new PrismaAiJournal(db),
    limits: { ...DEFAULT_AI_LIMITS, timeoutMs: cfg.OPENAI_TIMEOUT_MS + 5000, perUserPerDay: cfg.AI_PER_USER_PER_DAY, globalCostMicrosPerDay: cfg.AI_GLOBAL_COST_MICROS_PER_DAY, backoffBaseMs: cfg.BLOWY_ENV === 'test' ? 1 : 500 },
    now: () => clock.now(),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  });
  const mode = !providers ? 'NOT_CONFIGURED' : env.AI_PROVIDER === 'openai' ? 'LIVE' : 'LOCAL_DEMO';
  return { providers, runner, mode, providerLabel: mode === 'LIVE' ? 'OpenAI (API, serveur)' : mode === 'LOCAL_DEMO' ? 'Démonstration locale (aucun envoi externe)' : 'Aucun fournisseur configuré' };
}
