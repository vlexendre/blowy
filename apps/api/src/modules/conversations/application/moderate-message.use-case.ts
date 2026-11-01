/**
 * Consommateur `message.submitted` (worker) : modération HORS transaction (appel réseau
 * éventuel), puis application de la décision sous verrou, avec revalidation (relation
 * toujours ouverte, membre non révoqué). Publication → séquence visible, projection pour
 * les destinataires, aller-retour XP via le moteur. Panne IA → PROCESSING_FAILED (jamais publié).
 */
import type { EventPublisher } from '../../../shared/application/event-publisher.js';
import type { LinkProgressPort } from '../../../shared/application/ports/link-progress.port.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import type { LoggerPort as Logger } from '../../../shared/application/logger.port.js';
import { canTransition, countsForExchange, statusForAction, visibleToRecipient, type MessageStatus } from '../domain/message-policy.js';
import { toMessageView } from './message.serializer.js';
import type { ConversationRepository } from './ports/conversation.repository.js';
import type { ModerationGateway, ModerationVerdict } from './ports/moderation.gateway.js';

export class ModerateMessageUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly repo: ConversationRepository,
    private readonly moderation: ModerationGateway,
    private readonly events: EventPublisher,
    private readonly link: LinkProgressPort,
    private readonly logger: Logger,
  ) {}

  async execute(messageId: string): Promise<MessageStatus | null> {
    const msg = await this.repo.loadMessage(null, messageId);
    if (!msg || msg.status !== 'PENDING_MODERATION' || !msg.body || !msg.authorUserId) return msg?.status ?? null;
    let verdict: ModerationVerdict | null = null;
    try {
      verdict = await this.moderation.moderateText({ text: msg.body, conversationId: msg.conversationId, authorId: msg.authorUserId });
    } catch (err) {
      this.logger.warn({ messageId, provider: this.moderation.provider, err: (err as Error).name }, 'moderation_failed');
    }
    return this.apply(messageId, verdict);
  }

  /** Applique une décision (aussi utilisé par une décision humaine / correction). */
  async apply(messageId: string, verdict: ModerationVerdict | null): Promise<MessageStatus | null> {
    return this.uow.run(async (scope) => {
      const pre = await this.repo.loadMessage(scope, messageId);
      if (!pre) return null;
      const conv = await this.repo.load(scope, pre.conversationId);
      if (!conv) return null;
      await scope.lock.users(conv.members.map((m) => m.userId));
      if (conv.contextId) await scope.lock.relationships([conv.contextId]);
      const msg = (await this.repo.loadMessage(scope, messageId))!;
      const target: MessageStatus = verdict ? statusForAction(verdict.action) : 'PROCESSING_FAILED';
      if (!canTransition(msg.status, target)) return msg.status;
      // Résultat tardif : la relation a été close ou l'auteur révoqué → jamais publié.
      const author = conv.members.find((m) => m.userId === msg.authorUserId);
      const closed = !!conv.closedAt || !author || !!author.revokedAt;
      const finalStatus: MessageStatus = closed && visibleToRecipient(target) ? 'HUMAN_REVIEW' : target;
      if (verdict) {
        await this.repo.recordDecision(scope, { messageId, action: verdict.action, source: verdict.source, policyVersion: verdict.policyVersion, provider: verdict.provider, reasonCode: closed ? 'CONTEXT_CLOSED' : verdict.reasonCode, signals: verdict.signals });
      }
      const seq = await this.repo.setStatus(scope, messageId, finalStatus, visibleToRecipient(finalStatus));
      const published = (await this.repo.loadMessage(scope, messageId))!;
      // Auteur : statut de son message (toujours). Destinataires : seulement si visible.
      const recipients = conv.members.filter((m) => !m.revokedAt);
      await this.events.publish(scope, {
        sourceEventId: messageId,
        type: visibleToRecipient(finalStatus) ? (finalStatus === 'WARNED' ? 'message.warned' : 'message.published') : 'message.status',
        aggregateId: conv.id,
        room: `conversation:${conv.id}`,
        recipients: recipients
          .filter((m) => m.userId === msg.authorUserId || visibleToRecipient(finalStatus))
          .map((m) => ({ userId: m.userId, payload: { message: toMessageView(published, m.userId) } })),
      });
      if (countsForExchange(finalStatus) && seq !== null && conv.contextId && msg.authorUserId) {
        const prev = await this.repo.previousPublishedHuman(scope, conv.id, seq);
        await this.link.onHumanMessagePublished(scope, {
          contextId: conv.contextId,
          authorId: msg.authorUserId,
          messageId,
          previousOtherMessageAt: prev?.publishedAt ?? null,
          previousAuthorId: prev?.authorUserId ?? null,
        });
      }
      return finalStatus;
    });
  }
}
