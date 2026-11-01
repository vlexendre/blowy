/**
 * Commande conversations.send_message (§9.1 étapes 1-2) : authentifie, vérifie appartenance,
 * blocage, consentement social, débit ; enregistre un message PENDING dédupliqué par
 * clientMessageId + événement outbox `message.submitted`, dans la même transaction.
 * Le destinataire ne reçoit RIEN à ce stade.
 */
import type { SendMessageRequest } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { BlockReader } from '../../../shared/application/ports/block-reader.port.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { socialAllowed, type ConsentFact } from '../../users/domain/consents.js';
import { toMessageView } from './message.serializer.js';
import type { ConversationRepository } from './ports/conversation.repository.js';

export interface ConsentFacts {
  listConsents(userId: string): Promise<ConsentFact[]>;
}

const MAX_PER_MINUTE = 20;

export class SendMessageUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: ConversationRepository,
    private readonly blocks: BlockReader,
    private readonly consents: ConsentFacts,
    private readonly random: RandomSource,
    private readonly now: () => Date,
  ) {}

  async execute(actorId: string, conversationId: string, commandId: string, req: SendMessageRequest) {
    const conv = await this.repo.load(null, conversationId);
    const me = conv?.members.find((m) => m.userId === actorId && !m.revokedAt);
    if (!conv || !me) throw Errors.notFound('Conversation');
    if (conv.closedAt) throw Errors.precondition('CONVERSATION_CLOSED');
    for (const other of conv.members.filter((m) => m.userId !== actorId)) {
      if (await this.blocks.isBlockedBetween(actorId, other.userId)) throw new AppError('BLOCKED', 'Conversation indisponible');
    }
    if (!socialAllowed(await this.consents.listConsents(actorId))) throw new AppError('CONSENT_REQUIRED', 'Consentement de modération requis pour discuter');
    if ((await this.repo.recentCountByAuthor(actorId, new Date(this.now().getTime() - 60_000))) >= MAX_PER_MINUTE) throw new AppError('RATE_LIMITED', 'Trop de messages');

    const { result } = await this.bus.execute({
      actorId,
      operation: 'conversations.send_message',
      commandId,
      payload: { conversationId, ...req },
      handle: async (scope) => {
        // Déduplication par clientMessageId (double tap / renvoi hors ligne avec autre commandId).
        const dup = await this.repo.findByClientId(scope, actorId, req.clientMessageId);
        if (dup) {
          if (dup.conversationId !== conversationId) throw Errors.conflict('CLIENT_MESSAGE_ID_REUSED');
          return toMessageView(dup, actorId)!;
        }
        const id = this.random.uuid();
        await this.repo.insertPending(scope, { id, conversationId, authorId: actorId, clientMessageId: req.clientMessageId, body: req.body });
        await scope.outbox.emit({ topic: 'message.submitted', aggregateType: 'Message', aggregateId: id, payload: { messageId: id, conversationId } });
        return toMessageView((await this.repo.loadMessage(scope, id, actorId))!, actorId)!;
      },
    });
    return result;
  }
}
