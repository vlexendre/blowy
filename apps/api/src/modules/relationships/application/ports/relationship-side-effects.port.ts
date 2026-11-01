/**
 * Effets interdomaines appliqués dans la même transaction (ports implémentés par
 * conversations et pets) : message système pré-écrit, révocation de rooms, retour des pets.
 */
import type { TxScope } from '../../../../shared/application/unit-of-work.js';

export interface ConversationAdmin {
  create(scope: TxScope, input: { id: string; contextId: string; kind: 'DATE'; memberIds: string[] }): Promise<void>;
  postSystemMessage(scope: TxScope, conversationId: string, template: string): Promise<{ messageId: string; seq: number }>;
  close(scope: TxScope, conversationId: string): Promise<void>;
  revokeMember(scope: TxScope, conversationId: string, userId: string): Promise<void>;
}
export const CONVERSATION_ADMIN = Symbol('ConversationAdmin');

export interface PetPlacement {
  /** Ramène le pet à son lieu autorisé s'il était dans ce contexte (sans perte de tenue/XP). */
  returnHomeIfIn(scope: TxScope, petId: string, contextId: string): Promise<void>;
  moveToSharedHome(scope: TxScope, petIds: string[], contextId: string): Promise<void>;
}
export const PET_PLACEMENT = Symbol('PetPlacement');
