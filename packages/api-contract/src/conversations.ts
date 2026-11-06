/** Contrats /v1/conversations, /v1/messages (propriétaire : agent C). */
import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const MESSAGE_MAX_CHARS = 2000;

export const SendMessageRequestSchema = z.object({
  /** Identifiant client de déduplication (hors-ligne, double tap). */
  clientMessageId: z.string().min(8).max(64),
  body: z.string().trim().min(1).max(MESSAGE_MAX_CHARS),
  /** V5 : réponse « 3 mots » à une question soufflée du pet (≤ 3 mots, ≤ 40 caractères, validé serveur). */
  promptId: z.string().regex(/^[a-z0-9_.]{1,64}$/).optional(),
});
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

/**
 * Message vu par un participant.
 *  - auteur : voit ses propres messages dans tous les statuts (body inclus) ;
 *  - destinataire : PUBLISHED (body) ou WARNED (placeholder, body null tant que non révélé).
 *    Jamais PENDING/REJECTED/QUARANTINED/HUMAN_REVIEW/PROCESSING_FAILED.
 */
export const MessageViewSchema = z.object({
  id: UuidSchema,
  conversationId: UuidSchema,
  clientMessageId: z.string().nullable(),
  kind: z.enum(['TEXT', 'VOICE', 'SYSTEM']),
  mine: z.boolean(),
  status: z.enum(['PENDING_MODERATION', 'PUBLISHED', 'WARNED', 'QUARANTINED', 'REJECTED', 'HUMAN_REVIEW', 'PROCESSING_FAILED', 'WITHDRAWN']),
  body: z.string().nullable(),
  /** Clé i18n d'un message système pré-écrit (présenté comme tel). */
  systemTemplate: z.string().nullable(),
  warned: z.boolean(),
  seq: z.number().int().nullable(),
  createdAt: IsoDateTimeSchema,
  publishedAt: IsoDateTimeSchema.nullable(),
  /** Message vocal : média servi par GET /v1/media/:id/content?variant=audio (ACL à chaque accès). Ajout agent E. */
  mediaId: UuidSchema.nullable().default(null),
});
export type MessageView = z.infer<typeof MessageViewSchema>;

export const MessagePageSchema = z.object({ items: z.array(MessageViewSchema), nextCursor: z.string().nullable() });

export const ConversationViewSchema = z.object({
  id: UuidSchema,
  /** V5 : + OUTING (chat de groupe pré-sortie), DUO, BAND (spec-v5 §2.7, §2.11–2.12). */
  kind: z.enum(['DATE', 'NEIGHBORHOOD', 'GROUP', 'COPARENT', 'OUTING', 'DUO', 'BAND']),
  relationshipId: UuidSchema.nullable(),
  outingId: UuidSchema.optional(),
  duoId: UuidSchema.optional(),
  bandLinkId: UuidSchema.optional(),
  lastSeq: z.number().int(),
  lastReadSeq: z.number().int(),
  closed: z.boolean(),
  canSend: z.boolean(),
});
export type ConversationView = z.infer<typeof ConversationViewSchema>;
export const ConversationListSchema = z.object({ items: z.array(ConversationViewSchema) });

export const MarkReadRequestSchema = z.object({ seq: z.number().int().min(0) });

/** Déplacés dans `core/ws.ts` (propriétaire A, V5 : salles `outing:`/`duo:`) ; réexportés pour compatibilité. */
export { WS_EVENT_TYPES, WsAuthenticateSchema, WsJoinSchema, type WsEventType } from './core/ws.js';
