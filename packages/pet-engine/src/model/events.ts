/** Événements métier acceptés par `reduce`. `eventId` est attribué par le serveur. */
import type { VirtualLocationRef } from '@blowy/domain';
import type { Side } from '../shared/index.js';
import type { Interval } from '../time/index.js';
import type { ProgressionGates } from './state.js';

export interface EngineEventBase {
  eventId: string;
}

export type EngineEvent =
  | (EngineEventBase & { type: 'ADVANCE' })
  | (EngineEventBase & { type: 'CALL_PET'; petId: string; to: VirtualLocationRef; purpose: 'MEET' | 'CARE' | 'HOME' })
  | (EngineEventBase & { type: 'HUG'; relationshipId: string; actorSide: Side })
  | (EngineEventBase & { type: 'PLAY'; relationshipId: string; actorSide: Side })
  | (EngineEventBase & { type: 'MESSAGE_PUBLISHED'; relationshipId: string; authorSide: Side; messageId: string; human: boolean })
  | (EngineEventBase & { type: 'MISSION_VALIDATED'; petId: string; missionId: string; relationshipId: string | null; boost: 'SATIETY' | 'MOOD'; weekendEntitlement: boolean })
  | (EngineEventBase & { type: 'GIFT'; relationshipId: string; actorSide: Side; itemId: string; itemDebited: boolean })
  | (EngineEventBase & { type: 'FEED_PET'; petId: string; weekendEntitlement: boolean })
  | (EngineEventBase & { type: 'HEAL_PET'; petId: string })
  | (EngineEventBase & { type: 'FEED_FRIEND'; neighborhoodId: string; donorPetId: string })
  | (EngineEventBase & { type: 'GATES_UPDATED'; relationshipId: string; gates: Partial<ProgressionGates> })
  | (EngineEventBase & { type: 'PAUSE_SET'; scope: 'PET' | 'RELATIONSHIP'; targetId: string; interval: Interval })
  | (EngineEventBase & { type: 'MOVE_IN'; relationshipId: string })
  | (EngineEventBase & { type: 'RELATIONSHIP_ENDED'; relationshipId: string })
  | (EngineEventBase & { type: 'EGG_SESSION_OPEN'; eggId: string })
  | (EngineEventBase & { type: 'EGG_ANSWER'; eggId: string; night: number; question: number; side: Side; choice: string })
  | (EngineEventBase & { type: 'EGG_TAP'; eggId: string; side: Side })
  | (EngineEventBase & { type: 'EGG_NAME_VOTE'; eggId: string; side: Side; name: string });

export type EngineEventType = EngineEvent['type'];
export type EventOf<T extends EngineEventType> = Extract<EngineEvent, { type: T }>;

/** Événement sans identifiant (distributif sur l'union), pour les fabriques d'événements. */
export type EventInput = EngineEvent extends infer E ? (E extends EngineEvent ? Omit<E, 'eventId'> : never) : never;
