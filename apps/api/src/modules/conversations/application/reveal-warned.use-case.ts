/** « Afficher quand même » : WARNED uniquement, destinataire membre, action explicite. Aucun XP. */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import { Errors } from '../../../shared/domain/errors.js';
import { toMessageView } from './message.serializer.js';
import type { ConversationRepository } from './ports/conversation.repository.js';

export class RevealWarnedUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: ConversationRepository,
  ) {}
  async execute(actorId: string, messageId: string, commandId: string) {
    const { result } = await this.bus.execute({
      actorId,
      operation: 'conversations.reveal_warned',
      commandId,
      payload: { messageId },
      handle: async (scope) => {
        const msg = await this.repo.loadMessage(scope, messageId, actorId);
        const conv = msg ? await this.repo.load(scope, msg.conversationId) : null;
        const me = conv?.members.find((m) => m.userId === actorId && !m.revokedAt);
        if (!msg || !conv || !me || msg.authorUserId === actorId || (msg.status !== 'WARNED' && msg.status !== 'PUBLISHED')) throw Errors.notFound('Message');
        if (msg.status !== 'WARNED') throw Errors.precondition('NOT_WARNED');
        await this.repo.markRevealed(scope, messageId, actorId);
        return toMessageView((await this.repo.loadMessage(scope, messageId, actorId))!, actorId, null, !(await this.repo.facesRevealed(scope, conv.id, scope.now)))!;
      },
    });
    return result;
  }
}

export class MarkReadUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: ConversationRepository,
  ) {}
  async execute(actorId: string, conversationId: string, commandId: string, seq: number) {
    return this.bus.execute({
      actorId,
      operation: 'conversations.mark_read',
      commandId,
      payload: { conversationId, seq },
      handle: async (scope) => {
        const conv = await this.repo.load(scope, conversationId);
        if (!conv || !conv.members.some((m) => m.userId === actorId && !m.revokedAt)) throw Errors.notFound('Conversation');
        await this.repo.markRead(scope, conversationId, actorId, Math.min(seq, conv.lastSeq));
        return { ok: true };
      },
    });
  }
}
