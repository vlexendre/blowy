/** Création d'une relation de rendez-vous à partir d'un match (implémentée par relationships). */
import type { TxScope } from '../unit-of-work.js';

export interface RelationshipCreator {
  /** Verrous déjà pris par l'appelant (users, pets). Crée paire, contexte, côtés, conversation. */
  createDate(scope: TxScope, input: { users: [string, string]; pets: [string, string]; affinity: number; dateSpotKey: string | null; timezone: string }): Promise<{ contextId: string; conversationId: string }>;
  /** Capacité restante (rendez-vous actifs < slots) et absence d'exclusivité. */
  canStartDate(scope: TxScope, userId: string, slots: number): Promise<{ ok: boolean; reason?: 'EXCLUSIVE' | 'CAPACITY' }>;
}
export const RELATIONSHIP_CREATOR = Symbol('RelationshipCreator');
