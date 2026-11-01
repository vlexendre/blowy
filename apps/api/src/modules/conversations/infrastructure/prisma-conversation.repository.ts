import { uuidv7, type Db } from '@blowy/database';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { MessageStatus } from '../domain/message-policy.js';
import type { ConversationRepository, ConversationRow, MessageRow } from '../application/ports/conversation.repository.js';

type MsgWith = {
  id: string;
  conversationId: string;
  authorUserId: string | null;
  clientMessageId: string | null;
  kind: 'TEXT' | 'VOICE' | 'SYSTEM';
  status: string;
  seq: number | null;
  systemTemplate: string | null;
  createdAt: Date;
  publishedAt: Date | null;
  content: { body: string; purgedAt: Date | null } | null;
  receipts?: { revealedAt: Date | null }[];
};

function toMsg(m: MsgWith): MessageRow {
  return {
    id: m.id,
    conversationId: m.conversationId,
    authorUserId: m.authorUserId,
    clientMessageId: m.clientMessageId,
    kind: m.kind,
    status: m.status as MessageStatus,
    seq: m.seq,
    systemTemplate: m.systemTemplate,
    body: m.content && !m.content.purgedAt ? m.content.body : null,
    createdAt: m.createdAt,
    publishedAt: m.publishedAt,
    revealedByViewer: !!m.receipts?.some((r) => r.revealedAt),
  };
}

export class PrismaConversationRepository implements ConversationRepository {
  constructor(private readonly db: Db) {}
  private c(scope: TxScope | null) {
    return scope ? txOf(scope) : this.db;
  }

  async load(scope: TxScope | null, id: string): Promise<ConversationRow | null> {
    const c = await this.c(scope).conversation.findUnique({ where: { id }, include: { members: true } });
    return c ? { id: c.id, kind: c.kind, contextId: c.contextId, lastSeq: c.lastSeq, closedAt: c.closedAt, members: c.members.map((m) => ({ userId: m.userId, revokedAt: m.revokedAt, lastReadSeq: m.lastReadSeq })) } : null;
  }

  async listForUser(userId: string): Promise<ConversationRow[]> {
    const rows = await this.db.conversation.findMany({ where: { members: { some: { userId, revokedAt: null } } }, include: { members: true }, orderBy: { createdAt: 'desc' } });
    return rows.map((c) => ({ id: c.id, kind: c.kind, contextId: c.contextId, lastSeq: c.lastSeq, closedAt: c.closedAt, members: c.members.map((m) => ({ userId: m.userId, revokedAt: m.revokedAt, lastReadSeq: m.lastReadSeq })) }));
  }

  async create(scope: TxScope, i: { id: string; contextId: string; kind: 'DATE'; memberIds: string[] }) {
    await txOf(scope).conversation.create({ data: { id: i.id, kind: i.kind, contextId: i.contextId, createdAt: scope.now, members: { create: i.memberIds.map((userId) => ({ userId, joinedAt: scope.now })) } } });
  }

  async close(scope: TxScope, id: string) {
    await txOf(scope).conversation.updateMany({ where: { id, closedAt: null }, data: { closedAt: scope.now } });
  }

  async revokeMember(scope: TxScope, id: string, userId: string) {
    await txOf(scope).conversationMember.updateMany({ where: { conversationId: id, userId, revokedAt: null }, data: { revokedAt: scope.now } });
  }

  async findByClientId(scope: TxScope, authorId: string, clientMessageId: string) {
    const m = await txOf(scope).message.findUnique({ where: { authorUserId_clientMessageId: { authorUserId: authorId, clientMessageId } }, include: { content: true } });
    return m ? toMsg(m) : null;
  }

  async insertPending(scope: TxScope, m: { id: string; conversationId: string; authorId: string; clientMessageId: string; body: string }) {
    await txOf(scope).message.create({
      data: { id: m.id, conversationId: m.conversationId, authorUserId: m.authorId, clientMessageId: m.clientMessageId, kind: 'TEXT', status: 'PENDING_MODERATION', createdAt: scope.now, content: { create: { body: m.body } } },
    });
  }

  private async nextSeq(scope: TxScope, conversationId: string): Promise<number> {
    const { lastSeq } = await txOf(scope).conversation.update({ where: { id: conversationId }, data: { lastSeq: { increment: 1 } }, select: { lastSeq: true } });
    return lastSeq;
  }

  async insertSystem(scope: TxScope, m: { id: string; conversationId: string; template: string }) {
    const seq = await this.nextSeq(scope, m.conversationId);
    await txOf(scope).message.create({ data: { id: m.id, conversationId: m.conversationId, kind: 'SYSTEM', status: 'PUBLISHED', systemTemplate: m.template, seq, createdAt: scope.now, publishedAt: scope.now } });
    return seq;
  }

  async loadMessage(scope: TxScope | null, id: string, viewerId?: string) {
    const m = await this.c(scope).message.findUnique({ where: { id }, include: { content: true, receipts: viewerId ? { where: { userId: viewerId } } : false } });
    return m ? toMsg(m as MsgWith) : null;
  }

  async setStatus(scope: TxScope, id: string, status: MessageStatus, publish: boolean) {
    const tx = txOf(scope);
    const m = await tx.message.findUniqueOrThrow({ where: { id }, select: { conversationId: true, seq: true } });
    const seq = publish && m.seq === null ? await this.nextSeq(scope, m.conversationId) : m.seq;
    await tx.message.update({ where: { id }, data: { status, decidedAt: scope.now, ...(publish && m.seq === null ? { seq, publishedAt: scope.now } : {}) } });
    return seq;
  }

  async recordDecision(scope: TxScope, d: Parameters<ConversationRepository['recordDecision']>[1]) {
    await txOf(scope).moderationDecision.create({
      data: { id: uuidv7(scope.now.getTime()), subjectType: 'MESSAGE', subjectId: d.messageId, messageId: d.messageId, action: d.action as never, source: d.source as never, policyVersion: d.policyVersion, provider: d.provider, reasonCode: d.reasonCode, signals: (d.signals ?? undefined) as object | undefined, createdAt: scope.now },
    });
  }

  async page(conversationId: string, viewerId: string, before: { createdAt: Date; id: string } | null, limit: number) {
    const rows = await this.db.message.findMany({
      where: {
        conversationId,
        AND: [
          // Filtrage en base : un destinataire ne lit jamais pending/rejected/quarantined/review/failed.
          { OR: [{ authorUserId: viewerId }, { kind: 'SYSTEM' }, { status: { in: ['PUBLISHED', 'WARNED'] } }] },
          ...(before ? [{ OR: [{ createdAt: { lt: before.createdAt } }, { createdAt: before.createdAt, id: { lt: before.id } }] }] : []),
        ],
      },
      include: { content: true, receipts: { where: { userId: viewerId } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
    return rows.map((m) => toMsg(m as MsgWith));
  }

  async previousPublishedHuman(scope: TxScope, conversationId: string, beforeSeq: number) {
    const m = await txOf(scope).message.findFirst({ where: { conversationId, kind: { not: 'SYSTEM' }, status: 'PUBLISHED', seq: { lt: beforeSeq } }, orderBy: { seq: 'desc' }, select: { authorUserId: true, publishedAt: true } });
    return m && m.authorUserId && m.publishedAt ? { authorUserId: m.authorUserId, publishedAt: m.publishedAt } : null;
  }

  async markRevealed(scope: TxScope, messageId: string, userId: string) {
    await txOf(scope).messageReceipt.upsert({ where: { messageId_userId: { messageId, userId } }, create: { messageId, userId, revealedAt: scope.now }, update: { revealedAt: scope.now } });
  }

  async markRead(scope: TxScope, conversationId: string, userId: string, seq: number) {
    await txOf(scope).conversationMember.updateMany({ where: { conversationId, userId, lastReadSeq: { lt: seq } }, data: { lastReadSeq: seq } });
  }

  async recentCountByAuthor(authorId: string, since: Date) {
    return this.db.message.count({ where: { authorUserId: authorId, createdAt: { gte: since } } });
  }
}
