/**
 * Sélection des adaptateurs par configuration (Strategy). Production : OpenAI obligatoire,
 * adaptateurs locaux refusés ; clé absente → `null` (l'API branche alors les ports
 * « indisponibles » : rien n'est approuvé).
 */
import { z } from 'zod';
import { parsePriceTable } from './cost.js';
import { LocalContentModerationProvider, LocalMissionVisionProvider, LocalNarrationProvider, LocalSignalProvider, LocalSuggestionProvider, LocalTranscriptionProvider } from './local/local-adapters.js';
import { createOpenAiProviders } from './openai/openai-adapters.js';
import type { AiProviders } from './providers.js';

export const AiEnvSchema = z.object({
  AI_PROVIDER: z.enum(['local', 'openai', 'none']).default('local'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODERATION_MODEL: z.string().default('omni-moderation-latest'),
  /** Aucun nom de modèle génératif par défaut : à choisir dans la doc actuelle (docs/ai/policy.md). */
  OPENAI_TEXT_MODEL: z.string().optional(),
  OPENAI_VISION_MODEL: z.string().optional(),
  OPENAI_TRANSCRIPTION_MODEL: z.string().optional(),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(15_000),
  OPENAI_BASE_URL: z.string().url().optional(),
  AI_PRICE_TABLE_JSON: z.string().optional(),
});
export type AiEnv = z.infer<typeof AiEnvSchema>;

export class AiConfigError extends Error {}

export function createAiProviders(env: AiEnv, isProduction: boolean): AiProviders | null {
  if (env.AI_PROVIDER === 'local') {
    if (isProduction) throw new AiConfigError('AI_PROVIDER=local interdit en production');
    return {
      moderation: new LocalContentModerationProvider(false),
      vision: new LocalMissionVisionProvider(false),
      suggestions: new LocalSuggestionProvider(false),
      signals: new LocalSignalProvider(false),
      narration: new LocalNarrationProvider(false),
      transcription: new LocalTranscriptionProvider(false),
    };
  }
  if (env.AI_PROVIDER === 'none') return null;
  const missing = (['OPENAI_API_KEY', 'OPENAI_TEXT_MODEL', 'OPENAI_VISION_MODEL', 'OPENAI_TRANSCRIPTION_MODEL'] as const).filter((k) => !env[k]);
  if (missing.length) throw new AiConfigError(`AI_PROVIDER=openai exige ${missing.join(', ')}`);
  return createOpenAiProviders({
    apiKey: env.OPENAI_API_KEY!,
    moderationModel: env.OPENAI_MODERATION_MODEL,
    textModel: env.OPENAI_TEXT_MODEL!,
    visionModel: env.OPENAI_VISION_MODEL!,
    transcriptionModel: env.OPENAI_TRANSCRIPTION_MODEL!,
    timeoutMs: env.OPENAI_TIMEOUT_MS,
    prices: parsePriceTable(env.AI_PRICE_TABLE_JSON),
    ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {}),
  });
}
