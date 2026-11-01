/** Effets émis par le moteur (consommés par le backend : outbox, ledger, notifications). */
import type { LedgerReason, LinkLevel, PetPose, Stage, VirtualLocationRef, NotificationCategoryRef } from './refs.js';
import type { Side } from '../shared/index.js';

export type RejectReason =
  | 'UNKNOWN_EVENT'
  | 'DUPLICATE_EVENT'
  | 'NOT_FOUND'
  | 'LEVEL_TOO_LOW'
  | 'NOT_SAME_PLACE'
  | 'COMPLICITY_TOO_LOW'
  | 'ACTION_CAP_REACHED'
  | 'RELATIONSHIP_INACTIVE'
  | 'RELATIONSHIP_PAUSED'
  | 'ITEM_NOT_DEBITED'
  | 'PAUSE_TOO_LONG'
  | 'ALREADY_AT_LOCATION'
  | 'MOVED_IN_LOCKED'
  | 'EGG_NOT_OPEN'
  | 'EGG_INVALID';

export type GainAction = 'HUG' | 'PLAY' | 'MESSAGE' | 'MISSION' | 'GIFT' | 'VISIT' | 'FEED' | 'FEED_FRIEND';

export type EngineEffect =
  | { type: 'ACTION_REJECTED'; reason: RejectReason }
  | { type: 'CALL_RESOLVED'; petId: string; refused: boolean; probability: number; forcedAccept: boolean }
  | { type: 'PET_MOVED'; petId: string; from: VirtualLocationRef; to: VirtualLocationRef }
  | { type: 'REACTION'; petId: string; pose: PetPose; untilMs: number }
  | { type: 'LINK_XP_GAINED'; relationshipId: string; source: GainAction; baseXp: number; kPermille: number; mPermille: number; milli: number }
  | { type: 'PET_XP_GAINED'; petId: string; source: GainAction; milli: number; weekendMultiplier: number }
  | { type: 'NO_GAIN_CAP_REACHED'; action: GainAction; relationshipId: string | null; petId: string | null }
  | { type: 'XP_FROZEN'; scope: 'LINK' | 'PET'; reason: 'SICK' | 'PAUSED'; relationshipId: string | null; petId: string | null }
  | { type: 'STAGE_GROWN'; petId: string; stage: Stage }
  | { type: 'LEVEL_ELIGIBLE'; relationshipId: string; level: LinkLevel }
  | { type: 'LEVEL_REACHED'; relationshipId: string; level: LinkLevel }
  | { type: 'COINS_CREDIT'; petId: string; amount: number; reason: LedgerReason; idempotencyKey: string }
  | { type: 'MISSION_CONTEXT_CREATED'; relationshipId: string; key: string; kPermille: number; mPermille: number }
  | { type: 'INACTIVITY_THRESHOLD_CROSSED'; relationshipId: string; atMs: number }
  | { type: 'MOOD_PENALTY'; petId: string; points: number; atMs: number; cappedFrom: number }
  | { type: 'ABSENCE_DAY'; relationshipId: string; atMs: number }
  | { type: 'RELIABILITY_PENALTY'; relationshipId: string; side: Side; points: number; atMs: number }
  | { type: 'RELIABILITY_RECOVERY_ELIGIBLE'; relationshipId: string; side: Side; dayKey: string }
  | { type: 'RELATIONSHIP_SILENCE_CLOSE'; relationshipId: string; atMs: number }
  | { type: 'PET_FELL_SICK'; petId: string }
  | { type: 'PET_RECOVERED'; petId: string }
  | { type: 'NOTIFY'; category: NotificationCategoryRef; template: string; key: string; atMs: number; relationshipId: string | null; petId: string | null }
  | { type: 'MEMORY_ADDED'; relationshipId: string; memory: string }
  | { type: 'EGG_SESSION_OPENED'; eggId: string; night: number; catchUp: boolean }
  | { type: 'EGG_ANSWERS_REVEALED'; eggId: string; night: number; question: number; same: boolean; heat: number }
  | { type: 'EGG_NIGHT_COMPLETED'; eggId: string; night: number }
  | { type: 'EGG_READY'; eggId: string }
  | { type: 'EGG_HATCHED'; eggId: string; atMs: number }
  | { type: 'EGG_NAMED'; eggId: string; name: string };
