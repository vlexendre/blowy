/** Contrats /v1/conversations, /v1/messages (propriétaire : agent C). */
import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const MESSAGE_MAX_CHARS = 2000;

export const SendMessageRequestSchema = z.object({
  /** Identifiant client de déduplication (hors-ligne, double tap). */
  clientMessageId: z.string().min(8).max(64),
  body: z.string().trim().min(1).max(MESSAGE_MAX_CHARS),
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
});
export type MessageView = z.infer<typeof MessageViewSchema>;

export const MessagePageSchema = z.object({ items: z.array(MessageViewSchema), nextCursor: z.string().nullable() });

export const ConversationViewSchema = z.object({
  id: UuidSchema,
  kind: z.enum(['DATE', 'NEIGHBORHOOD', 'GROUP', 'COPARENT']),
  relationshipId: UuidSchema.nullable(),
  lastSeq: z.number().int(),
  lastReadSeq: z.number().int(),
  closed: z.boolean(),
  canSend: z.boolean(),
});
export type ConversationView = z.infer<typeof ConversationViewSchema>;
export const ConversationListSchema = z.object({ items: z.array(ConversationViewSchema) });

export const MarkReadRequestSchema = z.object({ seq: z.number().int().min(0) });

/** Événements WS v1 (type de l'enveloppe WsEnvelope). */
export const WS_EVENT_TYPES = [
  'message.published',
  'message.warned',
  'message.status',
  'relationship.updated',
  'relationship.ended',
  'match.created',
  'pet.updated',
  'access.revoked',
] as const;
export type WsEventType = (typeof WS_EVENT_TYPES)[number];

export const WsAuthenticateSchema = z.object({ token: z.string().min(10) });
export const WsJoinSchema = z.object({ room: z.string().regex(/^(conversation|relationship|user):[0-9a-f-]{36}$/) });
