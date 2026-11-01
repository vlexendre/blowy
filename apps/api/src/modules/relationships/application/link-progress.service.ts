/**
 * Progression du Lien (implémente LinkProgressPort et SharedActionPort) : délègue le calcul
 * des gains au moteur (plafonds, k, multiplicateur d'affinité), applique sous verrou,
 * enregistre contributions dédupliquées, compteurs journaliers et niveaux atteints.
 */
import type { EngineGateway, LinkGain, RelationshipSnapshot } from '../../../shared/application/ports/engine.gateway.js';
import type { LinkProgressPort } from '../../../shared/application/ports/link-progress.port.js';
import type { SharedActionOutcome, SharedActionPort } from '../../../shared/application/ports/shared-action.port.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { Errors } from '../../../shared/domain/errors.js';
import { REL_EVENTS } from '../domain/relationship-events.js';
import { relationshipDay } from '../domain/relationship-day.js';
import type { RelationshipLifecycle } from './relationship-lifecycle.service.js';
import type { ContextRow, RelationshipRepository } from './ports/relationship.repository.js';

const DAY = 86_400_000;
const CONTRIBUTION_WINDOW_DAYS = 7;

export interface PetSickness {
  anySick(scope: TxScope, petIds: string[]): Promise<boolean>;
}

export class LinkProgressService implements LinkProgressPort, SharedActionPort {
  constructor(
    private readonly repo: RelationshipRepository,
    private readonly engine: EngineGateway,
    private readonly lifecycle: RelationshipLifecycle,
    private readonly sickness: PetSickness,
  ) {}

  async onHumanMessagePublished(scope: TxScope, input: { contextId: string; authorId: string; messageId: string; previousOtherMessageAt: Date | null; previousAuthorId: string | null }) {
    const ctx = await this.repo.load(scope, input.contextId);
    if (!ctx || ctx.status === 'ENDED') return { linkXpMilli: 0 };
    const other = ctx.sides.find((s) => s.userId !== input.authorId);
    if (!other) return { linkXpMilli: 0 };
    const mine = ctx.sides.find((s) => s.userId === input.authorId)!;
    // Dette de réponse : l'autre doit maintenant une réponse ; l'auteur a répondu.
    if (!other.replyOwedSince) await this.repo.setReplyOwed(scope, ctx.id, other.userId, scope.now, input.messageId);
    if (mine.replyOwedSince) await this.repo.setReplyOwed(scope, ctx.id, mine.userId, null, null);
    // Aller-retour : seulement si ce message répond à un message de l'autre dans la fenêtre.
    // Une suite de messages du même auteur ne crée pas plusieurs aller-retours.
    const window = this.engine.params.messageReplyWindowHours * 3_600_000;
    const isReply = input.previousAuthorId === other.userId && input.previousOtherMessageAt && scope.now.getTime() - input.previousOtherMessageAt.getTime() <= window;
    if (!isReply) return { linkXpMilli: 0 };
    const snap = await this.snapshot(scope, ctx, input.authorId);
    if (snap.paused) return { linkXpMilli: 0 };
    const gain = this.engine.messageRoundTripGain(snap, relationshipDay(scope.now, ctx.timezone));
    await this.applyGain(scope, ctx, input.authorId, gain, `msg:${input.messageId}`, 'message');
    return { linkXpMilli: gain.xpMilli };
  }

  async applyGain(scope: TxScope, ctx: ContextRow, actorId: string, gain: LinkGain, dedupKey: string, kind: string): Promise<void> {
    const relDay = relationshipDay(scope.now, ctx.timezone);
    await this.repo.addCounters(scope, ctx.id, relDay, gain.counters);
    if (gain.contributionWeight > 0) {
      await this.repo.addContribution(scope, { contextId: ctx.id, userId: actorId, kind, weight: gain.contributionWeight, dedupKey, occurredAt: scope.now });
    }
    if (gain.xpMilli === 0 && gain.complicityDelta === 0 && gain.tensionDelta === 0) return;
    const xpMilli = ctx.xpMilli + gain.xpMilli;
    const eligible = this.engine.levelFor(xpMilli, ctx.branch);
    // Niveau atteint ne redescend jamais ; passage borné par les portes (branche, consentements).
    const reached = Math.max(ctx.reachedLevel, eligible);
    const clamp = (x: number) => Math.max(0, Math.min(100, x));
    await this.repo.update(scope, ctx.id, {
      xpMilli,
      eligibleLevel: eligible,
      reachedLevel: reached,
      complicity: clamp(ctx.complicity + gain.complicityDelta),
      tension: clamp(ctx.tension + gain.tensionDelta),
    });
    if (gain.xpMilli > 0) {
      await this.repo.appendEvent(scope, ctx.id, { type: REL_EVENTS.XP_GAINED, actorUserId: actorId, payload: { xpMilli: gain.xpMilli, kind }, engineVersion: this.engine.engineVersion, tuningVersion: this.engine.tuningVersion });
    }
    if (reached > ctx.reachedLevel) await this.lifecycle.touched(scope, ctx, REL_EVENTS.LEVEL_REACHED, null, { level: reached });
  }

  async snapshot(scope: TxScope, ctx: ContextRow, actorId: string): Promise<RelationshipSnapshot> {
    const contributions = await this.repo.contributions(scope, ctx.id, new Date(scope.now.getTime() - CONTRIBUTION_WINDOW_DAYS * DAY));
    const other = ctx.sides.find((s) => s.userId !== actorId)!;
    const paused = await this.repo.isPausedFor(scope, ctx.id, ctx.sides.map((s) => s.userId), scope.now);
    return {
      xpMilli: ctx.xpMilli,
      reachedLevel: ctx.reachedLevel,
      branch: ctx.branch,
      affinity: ctx.affinity,
      complicity: ctx.complicity,
      tension: ctx.tension,
      contributions: { mine: contributions[actorId] ?? 0, theirs: contributions[other.userId] ?? 0 },
      todayCounters: await this.repo.todayCounters(scope, ctx.id, relationshipDay(scope.now, ctx.timezone)),
      eitherPetSick: await this.sickness.anySick(scope, ctx.sides.map((s) => s.petId)),
      paused: paused.any,
    };
  }

  /** SharedActionPort : jeu/câlin (verrous pets + relation pris par l'appelant). */
  async apply(scope: TxScope, input: { actorId: string; petId: string; contextId: string; action: 'PLAY' | 'HUG' }): Promise<SharedActionOutcome> {
    const ctx = await this.repo.load(scope, input.contextId);
    if (!ctx || ctx.status === 'ENDED') throw Errors.notFound('Relation');
    const locs = await this.repo.petLocations(ctx.sides.map((s) => s.petId));
    if (!ctx.sides.every((s) => locs.get(s.petId)?.contextId === ctx.id)) throw Errors.precondition('NOT_SAME_PLACE');
    const snap = await this.snapshot(scope, ctx, input.actorId);
    const gain = this.engine.sharedActionGain(input.action, snap, relationshipDay(scope.now, ctx.timezone));
    if (!gain) throw Errors.precondition('ACTION_NOT_AVAILABLE', { action: input.action });
    if (snap.paused) return { outcome: 'NO_GAIN', linkXpMilli: 0, petXpMilli: 0 };
    await this.applyGain(scope, ctx, input.actorId, gain, `act:${input.action}:${input.contextId}:${scope.now.getTime()}:${input.actorId}`, 'play');
    return { outcome: gain.xpMilli > 0 ? 'APPLIED' : 'NO_GAIN', linkXpMilli: gain.xpMilli, petXpMilli: 0 };
  }
}
