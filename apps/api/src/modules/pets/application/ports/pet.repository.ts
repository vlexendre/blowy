import type { Species } from '@blowy/domain';
import type { PetSnapshot } from '../../../../shared/application/ports/engine.gateway.js';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { StoredVision } from '../../domain/pet.js';

export interface PetAggregate {
  id: string;
  kind: 'PRIMARY' | 'CHILD';
  species: Species;
  stage: 'BABY' | 'YOUNG' | 'ADULT';
  name: string;
  primaryOwnerId: string | null;
  ownerIds: string[];
  vision: StoredVision | null;
  snapshot: PetSnapshot;
  rngSeed: string;
  rngCounter: number;
  lastCallRefused: boolean;
  location: { kind: 'HOME' | 'DATE_SPOT' | 'SHARED_HOME' | 'FRIEND_HOME' | 'GROUP_LOCAL' | 'CUSTODY_HOME'; contextId: string | null; since: Date };
  version: number;
  ownerTimezone: string;
}

export interface NewPet {
  id: string;
  ownerId: string;
  species: Species;
  name: string;
  vision: StoredVision;
  snapshot: PetSnapshot;
  rngSeed: string;
}

export interface PetRepository {
  findPrimaryOf(userId: string): Promise<string | null>;
  load(scope: TxScope | null, petId: string): Promise<PetAggregate | null>;
  create(scope: TxScope, p: NewPet): Promise<void>;
  saveState(scope: TxScope, petId: string, s: PetSnapshot, extra?: { rngCounter?: number; lastCallRefused?: boolean; petXpMilli?: number }): Promise<void>;
  moveTo(scope: TxScope, petId: string, kind: PetAggregate['location']['kind'], contextId: string | null): Promise<void>;
  recordCare(scope: TxScope, e: { petId: string; actorUserId: string; action: string; contextId: string | null; commandId: string; effects: Record<string, unknown>; engineVersion: string; tuningVersion: string }): Promise<void>;
  globalPauses(userId: string, from: Date, to: Date): Promise<{ from: Date; to: Date }[]>;
  /** Pets dont l'état doit avancer (tick) : propriétaires actifs depuis < `activeSince`. */
  dueForTick(advancedBefore: Date, activeSince: Date, limit: number): Promise<string[]>;
}
export const PET_REPOSITORY = Symbol('PetRepository');
