/** Consentements de traitement versionnés /v1/consents (propriétaire : agent C). */
import { z } from 'zod';
import { IsoDateTimeSchema } from './core/common.js';

/** V5 : + SENSITIVE_PREFERENCES (genres recherchés, art. 9 RGPD — consentement explicite et révocable, V5.1 G.20). */
export const PROCESSING_PURPOSES = ['TERMS', 'PRIVACY', 'AI_MODERATION', 'AI_SUGGESTIONS', 'AI_NARRATION', 'SENSITIVE_PREFERENCES'] as const;
export const ProcessingPurposeSchema = z.enum(PROCESSING_PURPOSES);
/** Finalités nécessaires au flux social (sans elles : pet conservé, chat bloqué et expliqué). */
export const REQUIRED_SOCIAL_PURPOSES = ['TERMS', 'PRIVACY', 'AI_MODERATION'] as const;

export const ConsentItemSchema = z.object({
  purpose: ProcessingPurposeSchema,
  version: z.string().min(1).max(32),
  granted: z.boolean(),
});

export const RecordConsentsRequestSchema = z.object({ items: z.array(ConsentItemSchema).min(1).max(10) });
export type RecordConsentsRequest = z.infer<typeof RecordConsentsRequestSchema>;

export const ConsentStateSchema = z.object({
  items: z.array(ConsentItemSchema.extend({ recordedAt: IsoDateTimeSchema })),
  /** Versions courantes attendues par le serveur. */
  currentVersions: z.record(ProcessingPurposeSchema, z.string()),
  socialAllowed: z.boolean(),
});
export type ConsentState = z.infer<typeof ConsentStateSchema>;
