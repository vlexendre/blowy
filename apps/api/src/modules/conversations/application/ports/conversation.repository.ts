import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { MessageStatus } from '../../domain/message-policy.js';

export interface MessageRow {
  id: string;
  conversationId: string;
  authorUserId: string | null;
  clientMessageId: string | null;
  kind: 'TEXT' | 'VOICE' | 'SYSTEM';
  status: MessageStatus;
  seq: number | null;
  systemTemplate: string | null;
  body: string | null;
  createdAt: Date;
  publishedAt: Date | null;
  revealedByViewer: boolean;
}

export interface ConversationRow {
  id: string;
  kind: 'DATE' | 'NEIGHBORHOOD' | 'GROUP' | 'COPARENT';
  contextId: string | null;
  lastSeq: number;
  closedAt: Date | null;
  members: { userId: string; revokedAt: Date | null; lastReadSeq: number }[];
}

export interface ConversationRepository {
  load(scope: TxScope | null, id: string): Promise<ConversationRow | null>;
  listForUser(userId: string): Promise<ConversationRow[]>;
  create(scope: TxScope, input: { id: string; contextId: string; kind: 'DATE'; memberIds: string[] }): Promise<void>;
  close(scope: TxScope, id: string): Promise<void>;
  revokeMember(scope: TxScope, id: string, userId: string): Promise<void>;
  findByClientId(scope: TxScope, authorId: string, clientMessageId: string): Promise<MessageRow | null>;
  insertPending(scope: TxScope, m: { id: string; conversationId: string; authorId: string; clientMessageId: string; body: string }): Promise<void>;
  insertSystem(scope: TxScope, m: { id: string; conversationId: string; template: string }): Promise<number>;
  loadMessage(scope: TxScope | null, id: string, viewerId?: string): Promise<MessageRow | null>;
  setStatus(scope: TxScope, id: string, status: MessageStatus, publish: boolean): Promise<number | null>;
  recordDecision(scope: TxScope, d: { messageId: string; action: string; source: string; policyVersion: string; provider: string; reasonCode: string; signals?: Record<string, number> | undefined }): Promise<void>;
  /** Messages lisibles par le viewer, ordre décroissant, pagination par curseur createdAt/id. */
  page(conversationId: string, viewerId: string, before: { createdAt: Date; id: string } | null, limit: number): Promise<MessageRow[]>;
  /** Dernier message humain PUBLIÉ avant `seq` (aller-retour). */
  previousPublishedHuman(scope: TxScope, conversationId: string, beforeSeq: number): Promise<{ authorUserId: string; publishedAt: Date } | null>;
  markRevealed(scope: TxScope, messageId: string, userId: string): Promise<void>;
  markRead(scope: TxScope, conversationId: string, userId: string, seq: number): Promise<void>;
  recentCountByAuthor(authorId: string, since: Date): Promise<number>;
}
export const CONVERSATION_REPOSITORY = Symbol('ConversationRepository');
