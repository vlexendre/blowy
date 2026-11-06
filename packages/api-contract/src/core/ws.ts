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

/**
 * Salles WS. V5 (spec-v5 §3.3) : `outing:<id>` (places confirmées, jointure revalidée) et
 * `duo:<id>`. `relationship:` reste accepté pour l'historique V4.
 */
export const WS_ROOM_KINDS = ['user', 'conversation', 'relationship', 'outing', 'duo'] as const;
export type WsRoomKind = (typeof WS_ROOM_KINDS)[number];
export const WS_ROOM_PATTERN = /^(user|conversation|relationship|outing|duo):[0-9a-f-]{36}$/;
export const wsRoom = (kind: WsRoomKind, id: string): string => `${kind}:${id}`;
export function parseWsRoom(room: string): { kind: WsRoomKind; id: string } | null {
  if (!WS_ROOM_PATTERN.test(room)) return null;
  const i = room.indexOf(':');
  return { kind: room.slice(0, i) as WsRoomKind, id: room.slice(i + 1) };
}

export const WsAuthenticateSchema = z.object({ token: z.string().min(10) });
export const WsJoinSchema = z.object({ room: z.string().regex(WS_ROOM_PATTERN) });

export const WsResyncRequestSchema = z.object({
  room: z.string(),
  sinceCursor: z.string().nullable(),
});

/** Événements V4 (toujours émis tant que les modules V4 tournent). */
export const WS_EVENT_TYPES_V4 = [
  'message.published',
  'message.warned',
  'message.status',
  'relationship.updated',
  'relationship.ended',
  'match.created',
  'pet.updated',
  'access.revoked',
] as const;

/**
 * Événements V5 (spec-v5 §7.6). Aucun événement n'est émis à la saisie d'un vote ; les payloads
 * sont des projections du destinataire (schémas dans les fichiers de module).
 */
export const WS_EVENT_TYPES_V5 = [
  'outing.invited',
  'outing.updated',
  'outing.seat_updated',
  'outing.checkin_updated',
  'outing.votes_opened',
  'outing.votes_closed',
  'connection.revealed',
  'band.updated',
  'duo.updated',
  'reliability.updated',
  'safety.alert_ack',
] as const;

/** Types d'événements WS v1 (type de l'enveloppe `WsEnvelope`). */
export const WS_EVENT_TYPES = [...WS_EVENT_TYPES_V4, ...WS_EVENT_TYPES_V5] as const;
export type WsEventType = (typeof WS_EVENT_TYPES)[number];
