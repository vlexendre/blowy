/**
 * Souvenirs du pet V5 (spec-v5 §2.13) — implémenté par `pets` (moteur pur `reduceV5`, tables
 * `PetMemory`, `PetAccessory`, `PetState.engineStateV5`), appelé par `outings` dans SA transaction
 * (verrou pets pris par l'appelant dans l'ordre global). Idempotent par `dedupKey`.
 */
import type { PetMemoryKind } from '@blowy/domain';
import type { TxScope } from '../unit-of-work.js';

export interface MemoryInput {
  userId: string;
  kind: PetMemoryKind;
  refType: string;
  refId: string;
  /** Données minimales, jamais une donnée d'autrui non déjà visible. */
  data: Record<string, unknown>;
  /** Présence comptée (paliers « parole tenue »). */
  attended?: boolean;
}

export interface MemoryOutcome {
  petId: string;
  added: boolean;
  memoryId: string | null;
  stage: string;
  accessoriesUnlocked: string[];
  milestones: number[];
}

export interface PetMemoryPort {
  /** Pets principaux des personnes (pour le verrouillage ordonné par l'appelant). */
  primaryPetIds(scope: TxScope, userIds: string[]): Promise<Map<string, string>>;
  record(scope: TxScope, input: MemoryInput): Promise<MemoryOutcome | null>;
}
export const PET_MEMORY_PORT = Symbol('PetMemoryPort');
