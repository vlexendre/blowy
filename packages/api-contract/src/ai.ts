/** Contrats IA visibles par l'utilisateur : consentements, suggestions, signal d'humeur (propriétaire : agent E). */
import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const AI_PURPOSES = ['AI_MODERATION', 'AI_SUGGESTIONS', 'AI_NARRATION'] as const;

/** Information préalable (§9.6) : usages, types de données, fournisseur, version. */
export const AiConsentDisclosureSchema = z.object({
  purpose: z.enum(AI_PURPOSES),
  required: z.boolean(),
  usages: z.array(z.string()),
  dataTypes: z.array(z.string()),
  provider: z.string(),
  version: z.string(),
  granted: z.boolean(),
  recordedAt: IsoDateTimeSchema.nullable(),
});
export const AiConsentStateSchema = z.object({ items: z.array(AiConsentDisclosureSchema), providerMode: z.enum(['LIVE', 'LOCAL_DEMO', 'NOT_CONFIGURED']) });

export const RecordAiConsentRequestSchema = z.object({ purpose: z.enum(AI_PURPOSES), version: z.string().min(1).max(32), granted: z.boolean() });

export const SuggestionViewSchema = z.object({
  id: z.string(),
  /** « Idée de message » : l'utilisateur choisit, modifie ou ignore ; jamais envoyée seule. */
  text: z.string().max(160),
  tone: z.enum(['gentle', 'playful', 'direct']),
  reasonCode: z.string(),
  memoryRefs: z.array(z.string()),
});
export const SuggestionSetViewSchema = z.object({
  conversationId: UuidSchema,
  source: z.enum(['AI', 'EDITORIAL']),
  items: z.array(SuggestionViewSchema).max(3),
  createdAt: IsoDateTimeSchema,
});
export type SuggestionSetView = z.infer<typeof SuggestionSetViewSchema>;

export const RequestSuggestionsSchema = z.object({ conversationId: UuidSchema });

export const ConversationSignalViewSchema = z.object({
  tone: z.enum(['warm', 'playful', 'neutral', 'tense', 'uncertain']),
  /** Proposition narrative ; le moteur décide de la réaction réellement jouée. */
  proposedReaction: z.enum(['neutral', 'joyful', 'proud', 'surprised', 'affectionate', 'pouting']).nullable(),
  expiresAt: IsoDateTimeSchema,
});
