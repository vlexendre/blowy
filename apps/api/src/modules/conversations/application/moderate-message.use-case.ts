/**
 * Consommateur `message.submitted` (worker) : modération HORS transaction (appel réseau
 * éventuel), puis application de la décision sous verrou, avec revalidation (relation
 * toujours ouverte, membre non révoqué). Publication → séquence visible, projection pour
 * les destinataires, aller-retour XP via le moteur. Panne IA → PROCESSING_FAILED (jamais publié).
 */
import type { MessageAuthorResolver, MessageAuthorView } from '../../../shared/application/ports/message-author.port.js';
import type { EventPublisher } from '../../../shared/application/event-publisher.js';
import type { LinkProgressPort } from '../../../shared/application/ports/link-progress.port.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import type { LoggerPort as Logger } from '../../../shared/application/logger.port.js';
import { canHumanTransition, canTransition, countsForExchange, statusForAction, visibleToRecipient, type MessageStatus } from '../domain/message-policy.js';
import { toMessageView } from './message.serializer.js';
import type { ConversationRepository } from './ports/conversation.repository.js';
import type { ModerationCaseSink, ModerationGateway, ModerationVerdict } from './ports/moderation.gateway.js';

/** Verdict automatique ou humain (le staff peut aussi retirer un contenu publié). */
export type StaffOrAutoVerdict = Omit<ModerationVerdict, 'action'> & { action: ModerationVerdict['action'] | 'WITHDRAW' };

export class ModerateMessageUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly repo: ConversationRepository,
    private readonly moderation: ModerationGateway,
    private readonly events: EventPublisher,
    private readonly link: LinkProgressPort,
    private readonly logger: Logger,
    private readonly cases: ModerationCaseSink | null = null,
    private readonly authors: MessageAuthorResolver | null = null,
  ) {}

  async execute(messageId: string): Promise<MessageStatus | null> {
    const msg = await this.repo.loadMessage(null, messageId);
    if (!msg || msg.status !== 'PENDING_MODERATION' || !msg.authorUserId) return msg?.status ?? null;
    if (msg.kind === 'TEXT' && !msg.body) return msg.status;
    let verdict: ModerationVerdict | null = null;
    try {
      if (msg.kind === 'VOICE') {
        // §9.2 : transcription serveur puis modération ; sans implémentation → jamais publié.
        if (!this.moderation.moderateVoice || !msg.mediaId) throw new Error('voice moderation unavailable');
        verdict = await this.moderation.moderateVoice({ mediaId: msg.mediaId, conversationId: msg.conversationId, authorId: msg.authorUserId, messageId });
      } else {
        verdict = await this.moderation.moderateText({ text: msg.body!, conversationId: msg.conversationId, authorId: msg.authorUserId, messageId });
      }
    } catch (err) {
      this.logger.warn({ messageId, provider: this.moderation.provider, err: (err as Error).name }, 'moderation_failed');
    }
    return this.apply(messageId, verdict);
  }

  /** Décision humaine (staff) : correction append-only, aucun XP réattribué. */
  async applyHuman(messageId: string, verdict: StaffOrAutoVerdict, staffUserId: string): Promise<MessageStatus | null> {
    return this.apply(messageId, verdict, { staffUserId });
  }

  /** Applique une décision (automatique, ou humaine si `human` est fourni). */
  async apply(messageId: string, verdict: StaffOrAutoVerdict | null, human?: { staffUserId: string }): Promise<MessageStatus | null> {
    return this.uow.run(async (scope) => {
      const pre = await this.repo.loadMessage(scope, messageId);
      if (!pre) return null;
      const conv = await this.repo.load(scope, pre.conversationId);
      if (!conv) return null;
      await scope.lock.users(conv.members.map((m) => m.userId));
      if (conv.contextId) await scope.lock.relationships([conv.contextId]);
      const msg = (await this.repo.loadMessage(scope, messageId))!;
      const target: MessageStatus = !verdict ? 'PROCESSING_FAILED' : verdict.action === 'WITHDRAW' ? 'WITHDRAWN' : statusForAction(verdict.action);
      if (human ? !canHumanTransition(msg.status, target) : !canTransition(msg.status, target)) return msg.status;
      // Résultat tardif : la relation a été close ou l'auteur révoqué → jamais publié.
      const author = conv.members.find((m) => m.userId === msg.authorUserId);
      const closed = !!conv.closedAt || !author || !!author.revokedAt;
      const finalStatus: MessageStatus = closed && visibleToRecipient(target) ? 'HUMAN_REVIEW' : target;
      if (verdict) {
        const action = verdict.action === 'WITHDRAW' ? 'REJECT' : verdict.action;
        await this.repo.recordDecision(scope, { messageId, action, source: human ? 'HUMAN' : verdict.source, policyVersion: verdict.policyVersion, provider: verdict.provider, reasonCode: closed ? 'CONTEXT_CLOSED' : verdict.action === 'WITHDRAW' ? `WITHDRAWN:${verdict.reasonCode}` : verdict.reasonCode, signals: verdict.signals, decidedById: human?.staffUserId ?? null });
        if (!human && this.cases && (verdict.case || finalStatus === 'HUMAN_REVIEW')) {
          await this.cases.open(scope, { subjectType: 'MESSAGE', subjectId: messageId, subjectUserId: msg.authorUserId, reasonCode: closed ? 'CONTEXT_CLOSED' : verdict.reasonCode, priority: verdict.case?.priority ?? 3, restricted: verdict.case?.restricted ?? false });
        }
      }
      // Contenu visible retiré : effacement du corps pour les lectures futures (caches invalidés par l'état).
      if (finalStatus === 'WITHDRAWN') await this.repo.purgeBody(scope, messageId);
      const seq = await this.repo.setStatus(scope, messageId, finalStatus, visibleToRecipient(finalStatus));
      const published = (await this.repo.loadMessage(scope, messageId))!;
      // Auteur : statut de son message (toujours). Destinataires : seulement si visible.
      const recipients = conv.members.filter((m) => !m.revokedAt);
      // V5 chat de sortie : auteur signé par son pet (prénom après la confirmation), calculé par destinataire.
      const authorsByViewer = new Map<string, ReadonlyMap<string, MessageAuthorView> | null>();
      if (conv.kind === 'OUTING' && this.authors) for (const r of recipients) authorsByViewer.set(r.userId, await this.authors.authorsFor(conv.id, r.userId, scope.now));
      const maskPhones = !(await this.repo.facesRevealed(scope, conv.id, scope.now));
      await this.events.publish(scope, {
        sourceEventId: messageId,
        type: visibleToRecipient(finalStatus) ? (finalStatus === 'WARNED' ? 'message.warned' : 'message.published') : 'message.status',
        aggregateId: conv.id,
        room: `conversation:${conv.id}`,
        recipients: recipients
          .filter((m) => m.userId === msg.authorUserId || visibleToRecipient(finalStatus))
          .map((m) => ({ userId: m.userId, payload: { message: toMessageView(published, m.userId, authorsByViewer.get(m.userId) ?? null, maskPhones) } })),
      });
      // Une correction tardive ne réattribue jamais l'XP : `exchangeEvaluatedAt` est réclamé une seule fois.
      if (countsForExchange(finalStatus) && seq !== null && conv.contextId && msg.authorUserId && !closed && (await this.repo.claimExchange(scope, messageId))) {
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
