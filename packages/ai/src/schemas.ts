/**
 * Schémas stricts des sorties IA (Structured Outputs + validation Zod serveur).
 * Toutes les clés sont requises (exigence du mode strict) ; les valeurs « vides » sont
 * des tableaux vides ou null explicites. Un résultat conforme n'est pas forcément correct :
 * la politique métier (policy.ts) décide, jamais la sortie brute.
 */
import { z } from 'zod';

/** §9.3 — reasonCode versionné (MISSION_REASONS_VERSION). */
export const MISSION_REASONS_VERSION = 'mission-reasons-2026.11.0';
export const MISSION_REASON_CODES = [
  'CRITERIA_VISIBLE',
  'CRITERIA_PARTIAL',
  'CRITERIA_ABSENT',
  'OFF_TOPIC',
  'LOW_QUALITY',
  'SCREEN_OR_REPRINT',
  'TEXT_INSTRUCTIONS_IGNORED',
  'UNREADABLE',
  'OTHER',
] as const;

export const MissionAssessmentSchema = z
  .object({
    status: z.enum(['consistent', 'inconsistent', 'uncertain']),
    visibleEvidence: z.array(z.string().max(120)).max(8),
    missingEvidence: z.array(z.string().max(120)).max(8),
    qualityIssues: z.array(z.string().max(120)).max(8),
    confidenceSignal: z.number().min(0).max(1),
    requiresReview: z.boolean(),
    reasonCode: z.enum(MISSION_REASON_CODES),
  })
  .strict();
export type MissionAssessment = z.infer<typeof MissionAssessmentSchema>;

/** §9.5 */
export const ConversationSignalSchema = z
  .object({
    tone: z.enum(['warm', 'playful', 'neutral', 'tense', 'uncertain']),
    evidenceEventIds: z.array(z.string().max(64)).max(10),
    proposedReaction: z.enum(['neutral', 'joyful', 'proud', 'surprised', 'affectionate', 'pouting']).nullable(),
    confidenceSignal: z.number().min(0).max(1),
    ttlSeconds: z.number().int().min(0).max(3600),
  })
  .strict();
export type ConversationSignal = z.infer<typeof ConversationSignalSchema>;

/** §9.4 */
export const SUGGESTION_MAX_CHARS = 160;
export const SUGGESTION_REASON_CODES = ['SHARED_MEMORY', 'DAILY_MISSION', 'PUBLIC_VISION', 'OPEN_QUESTION', 'LIGHT_HUMOR', 'FOLLOW_UP'] as const;
export const SuggestionItemSchema = z
  .object({
    text: z.string().min(1).max(SUGGESTION_MAX_CHARS),
    tone: z.enum(['gentle', 'playful', 'direct']),
    reasonCode: z.enum(SUGGESTION_REASON_CODES),
    memoryRefs: z.array(z.string().max(64)).max(3),
  })
  .strict();
export const SuggestionSetSchema = z.object({ suggestions: z.array(SuggestionItemSchema).max(3) }).strict();
export type SuggestionItem = z.infer<typeof SuggestionItemSchema>;

/** Analyse contextuelle limitée (§9.1 étape 4) : argent, coercition, harcèlement répété, contournement. */
export const CONTEXT_RISKS = ['none', 'money_request', 'coercion', 'harassment_repeated', 'circumvention', 'distress'] as const;
export const ContextRiskSchema = z
  .object({
    risk: z.enum(CONTEXT_RISKS),
    confidenceSignal: z.number().min(0).max(1),
    targetMessageIsRequest: z.boolean(),
    rationaleCode: z.enum(['ORDINARY_MENTION', 'EXPLICIT_REQUEST', 'PRESSURE', 'REPEATED_UNWANTED', 'OFF_PLATFORM_PUSH', 'HELP_SEEKING', 'UNCLEAR']),
  })
  .strict();
export type ContextRisk = z.infer<typeof ContextRiskSchema>;

/** Narration (réplique sélectionnée dans la bibliothèque, jamais un texte libre au nom d'une personne). */
export const NarrationChoiceSchema = z.object({ lineId: z.string().max(32), reaction: z.enum(['neutral', 'joyful', 'proud', 'surprised', 'affectionate', 'pouting']).nullable() }).strict();
export type NarrationChoice = z.infer<typeof NarrationChoiceSchema>;
