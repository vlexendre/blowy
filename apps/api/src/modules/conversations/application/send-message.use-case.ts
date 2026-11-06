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
import type { VoiceMessageGate } from './ports/moderation.gateway.js';

export interface ConsentFacts {
  listConsents(userId: string): Promise<ConsentFact[]>;
}

const MAX_PER_MINUTE = 20;

const clientMessageIdReused = () =>
  new AppError('IDEMPOTENCY_CONFLICT', 'Ce clientMessageId a déjà servi pour un autre contenu', { detailsSafe: { reason: 'CLIENT_MESSAGE_ID_REUSED' } });

export class SendMessageUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: ConversationRepository,
    private readonly blocks: BlockReader,
    private readonly consents: ConsentFacts,
    private readonly random: RandomSource,
    private readonly now: () => Date,
    private readonly voiceGate: VoiceMessageGate | null = null,
  ) {}

  /** Message vocal (§9.2) : mêmes contrôles + porte média (≥ N3, droit VOICE, type/durée vérifiés). */
  async executeVoice(actorId: string, conversationId: string, commandId: string, req: { clientMessageId: string; mediaId: string }) {
    if (!this.voiceGate) throw new AppError('NOT_CONFIGURED', 'Messages vocaux indisponibles');
    await this.voiceGate.assertCanSend(actorId, conversationId, req.mediaId);
    return this.execute(actorId, conversationId, commandId, { clientMessageId: req.clientMessageId, body: '' }, req.mediaId);
  }

  async execute(actorId: string, conversationId: string, commandId: string, req: SendMessageRequest, voiceMediaId: string | null = null) {
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
      operation: voiceMediaId ? 'conversations.send_voice' : 'conversations.send_message',
      commandId,
      payload: { conversationId, ...req, ...(voiceMediaId ? { mediaId: voiceMediaId } : {}) },
      handle: async (scope) => {
        // Déduplication par clientMessageId (double tap / renvoi hors ligne avec autre commandId).
        // Verrou auteur : deux envois simultanés du même clientMessageId (deux appareils) sont
        // sérialisés, le second voit le premier au lieu d'échouer sur l'unicité.
        await scope.lock.users([actorId]);
        const dup = await this.repo.findByClientId(scope, actorId, req.clientMessageId);
        if (dup) {
          // Même clientMessageId = même message : tout autre contenu (autre conversation, autre
          // texte, autre média) est un conflit explicite, jamais un remplacement ni un doublon (B8).
          const sameContent =
            dup.conversationId === conversationId &&
            (voiceMediaId ? dup.mediaId === voiceMediaId : dup.kind !== 'VOICE' && (dup.body === null || dup.body === req.body));
          if (!sameContent) throw clientMessageIdReused();
          return toMessageView(dup, actorId)!;
        }
        const id = this.random.uuid();
        await this.repo.insertPending(scope, { id, conversationId, authorId: actorId, clientMessageId: req.clientMessageId, body: req.body, kind: voiceMediaId ? 'VOICE' : 'TEXT', mediaId: voiceMediaId });
        await scope.outbox.emit({ topic: 'message.submitted', aggregateType: 'Message', aggregateId: id, payload: { messageId: id, conversationId } });
        return toMessageView((await this.repo.loadMessage(scope, id, actorId))!, actorId)!;
      },
    });
    return result;
  }
}
