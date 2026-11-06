/**
 * Table type → schéma de payload des événements WS V5 (spec-v5 §7.6). Les gateways diffusent la
 * projection du destinataire, jamais l'événement brut ; aucun événement à la saisie d'un vote.
 */
import type { z } from 'zod';
import type { WS_EVENT_TYPES_V5 } from './core/ws.js';
import { BandUpdatedEventSchema, ConnectionRevealedEventSchema, DuoUpdatedEventSchema } from './connections.js';
import {
  OutingCheckinUpdatedEventSchema,
  OutingInvitedEventSchema,
  OutingSeatUpdatedEventSchema,
  OutingUpdatedEventSchema,
  OutingVotesClosedEventSchema,
  OutingVotesOpenedEventSchema,
  ReliabilityUpdatedEventSchema,
} from './outings.js';
import { SafetyAlertAckEventSchema } from './safety.js';

export const WS_EVENT_PAYLOAD_SCHEMAS_V5: { readonly [K in (typeof WS_EVENT_TYPES_V5)[number]]: z.ZodType } = {
  'outing.invited': OutingInvitedEventSchema,
  'outing.updated': OutingUpdatedEventSchema,
  'outing.seat_updated': OutingSeatUpdatedEventSchema,
  'outing.checkin_updated': OutingCheckinUpdatedEventSchema,
  'outing.votes_opened': OutingVotesOpenedEventSchema,
  'outing.votes_closed': OutingVotesClosedEventSchema,
  'connection.revealed': ConnectionRevealedEventSchema,
  'band.updated': BandUpdatedEventSchema,
  'duo.updated': DuoUpdatedEventSchema,
  'reliability.updated': ReliabilityUpdatedEventSchema,
  'safety.alert_ack': SafetyAlertAckEventSchema,
};
