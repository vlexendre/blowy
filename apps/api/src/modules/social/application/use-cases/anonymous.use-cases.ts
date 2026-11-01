/**
 * Cas d'usage « Décris-moi en 3 mots ». Le visiteur n'a pas de compte : l'acteur est la cible
 * (CommandBus non applicable) ; l'idempotence repose sur le nonce de formulaire consommé une
 * seule fois et sur l'unicité (cible, empreinte visiteur).
 */
import type { PublicProfile, SubmitAnonymousResponseResult } from '@blowy/api-contract';
import { ANONYMOUS_WORD_ENTRIES } from '@blowy/content';
import { DEFAULT_TUNING } from '@blowy/tuning';
import { reputationScore } from '@blowy/matching';
import type { CommandBus } from '../../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../../shared/application/clock.js';
import type { UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import { AppError, Errors } from '../../../../shared/domain/errors.js';
import { ANONYMOUS_LIMITS, issueFormToken, normalizeWords, verifyFormToken, visitorHash, visitorQuotaKey } from '../../domain/anonymous.js';
import type { AnonymousRepository, QuotaCounter, SocialConfig } from '../ports/social.ports.js';

export const SOCIAL_TOPICS_OUT = {
  ANONYMOUS_RECEIVED: 'social.anonymous_response_received',
  ANONYMOUS_REPORTED: 'social.anonymous_response_reported',
} as const;

const DAY = 86_400;
const unavailable = () => Errors.notFound('Page');
const scoreMilli = (words: number) => Math.round(reputationScore(words, DEFAULT_TUNING) * 1000);

export class AnonymousResponsesUseCases {
  constructor(
    private readonly repo: AnonymousRepository,
    private readonly quota: QuotaCounter,
    private readonly uow: UnitOfWork,
    private readonly bus: CommandBus,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly cfg: SocialConfig,
  ) {}

  /** Profil public + jeton de formulaire à usage unique. Page désactivée/compte indisponible = 404 neutre. */
  async publicProfile(slug: string, visitorToken: string | null): Promise<PublicProfile> {
    const t = await this.repo.findTargetBySlug(slug);
    if (!t || t.status !== 'ACTIVE') throw unavailable();
    if (visitorToken) {
      const n = await this.quota.hit(`anon:form:${visitorQuotaKey(this.cfg.publicLinkSecret, visitorToken)}`, 3600);
      if (n > ANONYMOUS_LIMITS.formTokensPerVisitorPerHour) throw new AppError('RATE_LIMITED', 'Trop de demandes, réessaie plus tard');
    }
    const now = this.clock.now();
    const form = issueFormToken(this.cfg.publicLinkSecret, t.userId, this.random.hex(16), now);
    return {
      slug: t.slug,
      displayName: t.displayName,
      pet: t.pet,
      acceptingResponses: t.enabled,
      words: ANONYMOUS_WORD_ENTRIES.map((w) => ({ id: w.id, label: w.fr })),
      formToken: form.token,
      formTokenExpiresAt: form.expiresAt.toISOString(),
      maxWords: 3,
    };
  }

  async submit(slug: string, input: { words: string[]; formToken: string; visitorToken: string }): Promise<SubmitAnonymousResponseResult> {
    let words: string[];
    try {
      words = normalizeWords(input.words);
    } catch {
      throw Errors.validation({ reason: 'WORDS_INVALID' });
    }
    const t = await this.repo.findTargetBySlug(slug);
    if (!t || t.status !== 'ACTIVE' || !t.enabled) throw unavailable();
    const now = this.clock.now();
    const form = verifyFormToken(this.cfg.publicLinkSecret, input.formToken, now);
    if (!form || form.targetUserId !== t.userId) throw new AppError('PRECONDITION_FAILED', 'Formulaire expiré : recharge la page', { detailsSafe: { reason: 'FORM_TOKEN_INVALID' } });
    const vq = await this.quota.hit(`anon:visitor:${visitorQuotaKey(this.cfg.publicLinkSecret, input.visitorToken)}`, DAY);
    if (vq > ANONYMOUS_LIMITS.perVisitorPerDay) throw new AppError('RATE_LIMITED', 'Limite quotidienne atteinte');
    const vhash = visitorHash(this.cfg.publicLinkSecret, input.visitorToken, t.userId);
    const status = await this.uow.run(async (scope) => {
      await scope.lock.users([t.userId]);
      if (!(await this.repo.consumeNonce(scope, t.userId, form.nonce))) throw new AppError('CONFLICT', 'Formulaire déjà envoyé', { detailsSafe: { reason: 'FORM_TOKEN_REPLAYED' } });
      const today = await this.repo.countForTargetSince(scope, t.userId, new Date(now.getTime() - DAY * 1000));
      if (today >= ANONYMOUS_LIMITS.perTargetPerDay) throw new AppError('RATE_LIMITED', 'Cette page a reçu beaucoup de réponses aujourd’hui');
      const r = await this.repo.insert(scope, { id: this.random.uuid(), targetUserId: t.userId, words, visitorTokenHash: vhash });
      if (r === 'CREATED') {
        await this.repo.recomputeReputation(scope, t.userId, scoreMilli);
        await scope.outbox.emit({ topic: SOCIAL_TOPICS_OUT.ANONYMOUS_RECEIVED, aggregateType: 'User', aggregateId: t.userId, payload: { targetUserId: t.userId, wordCount: words.length } });
      }
      return r;
    });
    return { status: status === 'CREATED' ? 'RECORDED' : 'ALREADY_ANSWERED', displayName: t.displayName };
  }

  async listOwn(userId: string, cursor: string | undefined, limit: number) {
    const [page, own] = await Promise.all([this.repo.listOwn(userId, cursor, limit), this.repo.ownPage(userId)]);
    return {
      items: page.items.map((r) => ({ id: r.id, words: r.words as never, receivedAt: r.createdAt.toISOString(), hidden: !!r.hiddenAt, reported: !!r.reportedAt })),
      nextCursor: page.nextCursor,
      page: own,
    };
  }

  setPage(userId: string, enabled: boolean, commandId: string) {
    return this.bus.execute({
      actorId: userId, operation: 'social.public_page.set', commandId, payload: { enabled },
      handle: async (scope) => {
        const r = await this.repo.setPageEnabled(scope, userId, enabled);
        return { slug: r.slug, enabled };
      },
    }).then((o) => o.result);
  }

  hide(userId: string, responseId: string, commandId: string) {
    return this.bus.execute({
      actorId: userId, operation: 'social.anonymous.hide', commandId, payload: { responseId },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        if (!(await this.repo.hideOwn(scope, userId, responseId))) throw Errors.notFound('Réponse');
        await this.repo.recomputeReputation(scope, userId, scoreMilli);
        return { id: responseId, hidden: true };
      },
    }).then((o) => o.result);
  }

  /** Signalement par le propriétaire : masque + dossier de modération (consommé par trust, agent E). */
  report(userId: string, responseId: string, commandId: string) {
    return this.bus.execute({
      actorId: userId, operation: 'social.anonymous.report', commandId, payload: { responseId },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        if (!(await this.repo.reportOwn(scope, userId, responseId))) throw Errors.notFound('Réponse');
        await this.repo.recomputeReputation(scope, userId, scoreMilli);
        await scope.outbox.emit({ topic: SOCIAL_TOPICS_OUT.ANONYMOUS_REPORTED, aggregateType: 'AnonymousResponse', aggregateId: responseId, payload: { responseId, targetUserId: userId } });
        return { id: responseId, reported: true };
      },
    }).then((o) => o.result);
  }

  /**
   * « Qui a écrit ? » : le schéma ne conserve AUCUNE donnée consentie sur le répondant
   * (seulement une empreinte non réversible) → « Aucun indice disponible », jamais d'indice inventé.
   */
  hints(_userId: string, responseId: string) {
    void responseId;
    return { available: false, hints: [], reason: 'NO_CONSENTED_DATA' as const };
  }

  /** Staff (via admin) : masquer une réponse abusive. */
  async staffHide(scope: Parameters<AnonymousRepository['hideAny']>[0], responseId: string) {
    const r = await this.repo.hideAny(scope, responseId);
    if (!r) throw Errors.notFound('Réponse');
    await this.repo.recomputeReputation(scope, r.targetUserId, scoreMilli);
    return r;
  }
}
