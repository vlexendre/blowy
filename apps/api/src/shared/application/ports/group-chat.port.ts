/**
 * Port des conversations V5 (chat de groupe d'une sortie, chat de bande, chat de duo) — implémenté par
 * le module `conversations` (seul écrivain de ses tables), consommé par `outings` dans SA transaction.
 * Les messages humains passent par les routes `conversations` existantes (modération comprise).
 */
import type { TxScope } from '../unit-of-work.js';

export interface GroupChatPort {
  /** Chat de groupe d'une sortie (créé au passage FORMING ; membres = places confirmées). */
  openOutingChat(scope: TxScope, i: { conversationId: string; outingId: string; memberIds: string[] }): Promise<void>;
  /** Chat 1:1 d'un lien de bande ou d'un duo. */
  openLinkChat(scope: TxScope, i: { conversationId: string; kind: 'BAND' | 'DUO'; friendshipId?: string; duoId?: string; memberIds: [string, string] }): Promise<void>;
  /** Ajoute (ou réactive) un membre. */
  addMember(scope: TxScope, conversationId: string, userId: string): Promise<void>;
  /** Retire l'accès (lecture comprise). */
  revokeMember(scope: TxScope, conversationId: string, userId: string): Promise<void>;
  /** Message système publié (clé de gabarit `@blowy/content`, rendu côté client). */
  postSystem(scope: TxScope, conversationId: string, template: string): Promise<{ messageId: string; seq: number }>;
  /** Fermeture en écriture (lecture encore possible pour les membres non révoqués). */
  close(scope: TxScope, conversationId: string): Promise<void>;
  conversationOfOuting(scope: TxScope | null, outingId: string): Promise<string | null>;
  conversationOfFriendship(scope: TxScope | null, friendshipId: string): Promise<string | null>;
  /** Purge des corps de messages (rétention §8.5). */
  purgeBodies(scope: TxScope, conversationId: string): Promise<number>;
}
export const GROUP_CHAT_PORT = Symbol('GroupChatPort');
