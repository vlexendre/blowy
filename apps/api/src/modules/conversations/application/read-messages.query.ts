import type { ConversationView, MessageView } from '@blowy/api-contract';
import { decodeCursor, encodeCursor } from '../../../shared/application/pagination.js';
import { Errors } from '../../../shared/domain/errors.js';
import { toMessageView } from './message.serializer.js';
import type { ConversationRepository } from './ports/conversation.repository.js';

export class ReadMessagesQuery {
  constructor(private readonly repo: ConversationRepository) {}

  async conversations(userId: string): Promise<ConversationView[]> {
    const rows = await this.repo.listForUser(userId);
    return rows.map((c) => {
      const me = c.members.find((m) => m.userId === userId)!;
      return { id: c.id, kind: c.kind, relationshipId: c.contextId, lastSeq: c.lastSeq, lastReadSeq: me.lastReadSeq, closed: !!c.closedAt, canSend: !c.closedAt && !me.revokedAt };
    });
  }

  async messages(userId: string, conversationId: string, cursor: string | undefined, limit: number): Promise<{ items: MessageView[]; nextCursor: string | null }> {
    const conv = await this.repo.load(null, conversationId);
    const me = conv?.members.find((m) => m.userId === userId);
    // Accès révoqué (départ, blocage) : plus aucune lecture.
    if (!conv || !me || me.revokedAt) throw Errors.notFound('Conversation');
    const c = decodeCursor(cursor);
    const before = c && typeof c[0] === 'number' && typeof c[1] === 'string' ? { createdAt: new Date(c[0]), id: c[1] } : null;
    const rows = await this.repo.page(conversationId, userId, before, limit + 1);
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map((m) => toMessageView(m, userId)).filter((m): m is MessageView => m !== null),
      nextCursor: hasMore && last ? encodeCursor([last.createdAt.getTime(), last.id]) : null,
    };
  }
}
