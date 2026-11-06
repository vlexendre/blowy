/**
 * Implémente GroupChatPort (V5) : conversations OUTING / BAND / DUO, écrites par le module
 * `conversations` (seul écrivain de ses tables) dans la transaction de l'appelant.
 */
import { uuidv7, type Db } from '@blowy/database';
import type { GroupChatPort } from '../../../shared/application/ports/group-chat.port.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { ConversationRepository } from '../application/ports/conversation.repository.js';

export class PrismaGroupChat implements GroupChatPort {
  constructor(
    private readonly db: Db,
    private readonly repo: ConversationRepository,
  ) {}

  async openOutingChat(scope: TxScope, i: { conversationId: string; outingId: string; memberIds: string[] }) {
    await txOf(scope).conversation.create({
      data: { id: i.conversationId, kind: 'OUTING', outingId: i.outingId, createdAt: scope.now, members: { create: i.memberIds.map((userId) => ({ userId, joinedAt: scope.now })) } },
    });
  }

  async openLinkChat(scope: TxScope, i: { conversationId: string; kind: 'BAND' | 'DUO'; friendshipId?: string; duoId?: string; memberIds: [string, string] }) {
    await txOf(scope).conversation.create({
      data: {
        id: i.conversationId,
        kind: i.kind,
        friendshipId: i.friendshipId ?? null,
        duoId: i.duoId ?? null,
        createdAt: scope.now,
        members: { create: i.memberIds.map((userId) => ({ userId, joinedAt: scope.now })) },
      },
    });
  }

  async addMember(scope: TxScope, conversationId: string, userId: string) {
    await txOf(scope).conversationMember.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId, joinedAt: scope.now },
      update: { revokedAt: null },
    });
  }

  revokeMember(scope: TxScope, conversationId: string, userId: string) {
    return this.repo.revokeMember(scope, conversationId, userId);
  }

  async postSystem(scope: TxScope, conversationId: string, template: string) {
    const messageId = uuidv7(scope.now.getTime());
    const seq = await this.repo.insertSystem(scope, { id: messageId, conversationId, template });
    return { messageId, seq };
  }

  close(scope: TxScope, conversationId: string) {
    return this.repo.close(scope, conversationId);
  }

  async conversationOfOuting(scope: TxScope | null, outingId: string) {
    const c = await (scope ? txOf(scope) : this.db).conversation.findUnique({ where: { outingId }, select: { id: true } });
    return c?.id ?? null;
  }

  async conversationOfFriendship(scope: TxScope | null, friendshipId: string) {
    const c = await (scope ? txOf(scope) : this.db).conversation.findUnique({ where: { friendshipId }, select: { id: true } });
    return c?.id ?? null;
  }

  async purgeBodies(scope: TxScope, conversationId: string) {
    const r = await txOf(scope).messageContent.updateMany({ where: { purgedAt: null, message: { conversationId } }, data: { body: '', purgedAt: scope.now } });
    return r.count;
  }
}
