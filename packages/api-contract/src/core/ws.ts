import { z } from 'zod';

/**
 * Enveloppe WS. `projectionCursor` est opaque et propre à la projection autorisée du
 * destinataire : il ne révèle pas les événements privés omis (votes, etc.).
 */
export const WsEnvelopeSchema = z.object({
  eventId: z.string(),
  type: z.string(),
  aggregateId: z.string(),
  projectionCursor: z.string(),
  occurredAt: z.string(),
  schemaVersion: z.number().int().positive(),
  payload: z.unknown(),
});
export type WsEnvelope = z.infer<typeof WsEnvelopeSchema>;

export const WS_CLIENT_EVENTS = ['authenticate', 'join', 'leave', 'heartbeat', 'resync'] as const;

export const WsResyncRequestSchema = z.object({
  room: z.string(),
  sinceCursor: z.string().nullable(),
});
