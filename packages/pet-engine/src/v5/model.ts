/**
 * Moteur pet V5 (spec-v5 §5.2, D-021) : souvenirs et accessoires, sans jauge, sans perte, sans
 * gel, sans décroissance, sans multiplicateur payant. États JSON purs ; XP en milli-points.
 */
import type { AccessorySource, PetMemoryKind, PetPose, ReactionPose, Species, Stage } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';

export const ENGINE_VERSION_V5 = 'engine-2026.12.0';

export interface ReactionV5 {
  pose: ReactionPose;
  untilMs: number;
}

export interface PetStateV5 {
  id: string;
  species: Species;
  stage: Stage;
  xpMilli: number;
  memoryCount: number;
  /** Compteurs par type de souvenir (déblocages « n-ième souvenir de ce type »). */
  memoriesByKind: Partial<Record<PetMemoryKind, number>>;
  /** Présences cumulées (paliers « parole tenue »). */
  attendedCount: number;
  unlockedAccessories: string[];
  /** ≤ `accessories.maxEquipped`. */
  equipped: string[];
  reaction: ReactionV5 | null;
  /** Idempotence locale (la contrainte unique DB reste l'autorité). */
  recentEventIds: string[];
}

interface EventBase {
  /** Identifiant serveur de l'événement (idempotence). */
  eventId: string;
  petId: string;
}

export type PetEventV5 =
  | (EventBase & { type: 'MEMORY_RECORDED'; memoryKind: PetMemoryKind; refId: string; attended?: boolean })
  | (EventBase & { type: 'ACCESSORY_GRANTED'; accessoryId: string; source: AccessorySource })
  | (EventBase & { type: 'ACCESSORY_EQUIP'; accessoryIds: string[] })
  | (EventBase & { type: 'REACT'; pose: ReactionPose });

export type PetEventTypeV5 = PetEventV5['type'];
export type PetEventOfV5<T extends PetEventTypeV5> = Extract<PetEventV5, { type: T }>;

export type RejectReasonV5 =
  | 'UNKNOWN_EVENT'
  | 'DUPLICATE_EVENT'
  | 'PET_MISMATCH'
  | 'ACCESSORY_NOT_UNLOCKED'
  | 'ACCESSORY_ALREADY_UNLOCKED'
  | 'TOO_MANY_EQUIPPED'
  | 'DUPLICATE_ACCESSORY'
  | 'INVALID_POSE';

export type EffectV5 =
  | { type: 'MEMORY_ADDED'; petId: string; memoryKind: PetMemoryKind }
  | { type: 'PET_XP_GAINED'; petId: string; milli: number }
  | { type: 'STAGE_GROWN'; petId: string; stage: Stage }
  | { type: 'ACCESSORY_UNLOCKED'; petId: string; accessoryId: string; source: AccessorySource }
  | { type: 'REACTION'; petId: string; pose: PetPose; untilMs: number }
  | { type: 'MILESTONE_REACHED'; petId: string; kind: 'PROMISE_KEPT'; n: number }
  | { type: 'ACTION_REJECTED'; reason: RejectReasonV5 };

export interface EngineContextV5 {
  now: number;
  /** Graine serveur persistée (aucun aléa n'est utilisé par les règles V5 actuelles). */
  seed: string;
  engineVersion: string;
  tuning: Tuning;
}

export interface ReduceResultV5 {
  state: PetStateV5;
  effects: EffectV5[];
}
