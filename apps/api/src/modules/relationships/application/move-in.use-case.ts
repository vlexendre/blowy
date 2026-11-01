/**
 * Emménagement (P-5.6) :
 *  - relationships.move_in.propose : niveau atteint ≥ 3, pas d'exclusivité ailleurs ; crée une
 *    offre versionnée (le proposant l'accepte de fait) ;
 *  - relationships.offer.respond : réponse sur la MÊME version. Au second accord, transaction
 *    qui verrouille users → pets → relations de tout le voisinage des deux personnes, active
 *    l'exclusivité (index unique partiel), maison commune, clôture les autres rendez-vous des
 *    deux avec message système pré-écrit, ouvre la ronde de vote de branche.
 *  Deux emménagements concurrents : un seul succès (verrou user commun + index unique),
 *  l'autre reçoit un état recalculé (PRECONDITION_FAILED EXCLUSIVE_ELSEWHERE).
 */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { EngineGateway } from '../../../shared/application/ports/engine.gateway.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { Errors } from '../../../shared/domain/errors.js';
import { REL_EVENTS } from '../domain/relationship-events.js';
import type { RelationshipLifecycle } from './relationship-lifecycle.service.js';
import type { PetPlacement } from './ports/relationship-side-effects.port.js';
import type { ContextRow, RelationshipRepository } from './ports/relationship.repository.js';

const HOUR = 3_600_000;

export class MoveInUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: RelationshipRepository,
    private readonly lifecycle: RelationshipLifecycle,
    private readonly pets: PetPlacement,
    private readonly engine: EngineGateway,
    private readonly random: RandomSource,
  ) {}

  propose(actorId: string, contextId: string, commandId: string) {
    return this.bus.execute({
      actorId,
      operation: 'relationships.move_in.propose',
      commandId,
      payload: { contextId },
      handle: async (scope) => {
        const ctx = await this.lockContext(scope, actorId, contextId);
        if (ctx.type !== 'DATE' || (ctx.status !== 'ACTIVE' && ctx.status !== 'PAUSED')) throw Errors.precondition('NOT_MOVABLE');
        if (ctx.reachedLevel < this.engine.params.moveInMinLevel) throw Errors.precondition('LEVEL_TOO_LOW', { required: this.engine.params.moveInMinLevel });
        for (const s of ctx.sides) if (await this.repo.hasExclusive(scope, s.userId)) throw Errors.precondition('EXCLUSIVE_ELSEWHERE');
        const open = (await this.repo.openOffers(scope, contextId, scope.now)).find((o) => o.scope === 'MOVE_IN');
        if (open) throw Errors.conflict('OFFER_ALREADY_OPEN');
        const version = await this.repo.nextOfferVersion(scope, contextId, 'MOVE_IN');
        const id = this.random.uuid();
        await this.repo.createOffer(scope, { id, contextId, scope: 'MOVE_IN', version, proposedBy: actorId, expiresAt: new Date(scope.now.getTime() + this.engine.params.consentOfferTtlHours * HOUR) });
        await this.repo.respondOffer(scope, id, actorId, 'ACCEPT');
        await this.lifecycle.touched(scope, ctx, REL_EVENTS.MOVE_IN_PROPOSED, actorId, { offerId: id, version });
        return { status: 'PROPOSED' as const, offerId: id, version };
      },
    });
  }

  respond(actorId: string, contextId: string, commandId: string, input: { offerId: string; decision: 'ACCEPT' | 'DECLINE'; version: number }) {
    return this.bus.execute({
      actorId,
      operation: 'relationships.offer.respond',
      commandId,
      payload: { contextId, ...input },
      handle: async (scope) => {
        const pre = await this.repo.load(scope, contextId);
        // Participant (même si la relation vient d'être close par un emménagement concurrent).
        if (!pre || !pre.sides.some((s) => s.userId === actorId)) throw Errors.notFound('Relation');
        // Voisinage : toutes les relations DATE vivantes des deux personnes (clôturées si succès).
        const neighbours = new Map<string, ContextRow>();
        for (const s of pre.sides) for (const c of await this.repo.liveDateContextsOf(scope, s.userId)) neighbours.set(c.id, c);
        neighbours.set(pre.id, pre);
        const all = [...neighbours.values()];
        await scope.lock.users(all.flatMap((c) => c.sides.map((s) => s.userId)));
        await scope.lock.pets(all.flatMap((c) => c.sides.map((s) => s.petId)));
        await scope.lock.relationships(all.map((c) => c.id));
        const ctx = (await this.repo.load(scope, contextId))!;
        // État recalculé sous verrou : l'autre emménagement a gagné.
        if (ctx.status === 'ENDED') throw Errors.precondition(ctx.sides.some((s) => s.exclusive) ? 'EXCLUSIVE_ELSEWHERE' : 'RELATIONSHIP_ENDED');
        const offer = (await this.repo.openOffers(scope, contextId, scope.now)).find((o) => o.id === input.offerId);
        if (!offer || offer.scope !== 'MOVE_IN') throw Errors.precondition('OFFER_NOT_OPEN');
        if (offer.version !== input.version) throw Errors.precondition('OFFER_VERSION_CHANGED', { version: offer.version });
        if (offer.responses.some((r) => r.userId === actorId)) throw Errors.conflict('ALREADY_RESPONDED');
        await this.repo.respondOffer(scope, offer.id, actorId, input.decision);
        if (input.decision === 'DECLINE') {
          await this.repo.setOfferStatus(scope, offer.id, 'DECLINED');
          await this.lifecycle.touched(scope, ctx, 'relationship.move_in_declined', null);
          return { status: 'DECLINED' as const };
        }
        // Revalidation sous verrou : exclusivité ailleurs, relation encore vivante.
        if (ctx.status !== 'ACTIVE' && ctx.status !== 'PAUSED') throw Errors.precondition('NOT_MOVABLE');
        for (const s of ctx.sides) {
          if (await this.repo.hasExclusive(scope, s.userId)) {
            await this.repo.setOfferStatus(scope, offer.id, 'SUPERSEDED');
            throw Errors.precondition('EXCLUSIVE_ELSEWHERE');
          }
        }
        await this.repo.setOfferStatus(scope, offer.id, 'ACCEPTED');
        await this.repo.update(scope, ctx.id, { status: 'MOVED_IN', movedInAt: scope.now });
        await this.repo.setExclusive(scope, ctx.id);
        await this.pets.moveToSharedHome(scope, ctx.sides.map((s) => s.petId), ctx.id);
        // Clôture des autres rendez-vous des deux personnes (message système pré-écrit).
        const others = (await Promise.all(all.filter((c) => c.id !== ctx.id).map((c) => this.repo.load(scope, c.id)))).filter((c): c is ContextRow => !!c && c.status !== 'ENDED');
        for (const o of others) await this.lifecycle.end(scope, o, 'MOVED_IN_ELSEWHERE', null);
        await this.repo.createRound(scope, {
          id: this.random.uuid(),
          contextId: ctx.id,
          roundNo: (await this.repo.lastRoundNo(scope, ctx.id)) + 1,
          deadlineAt: new Date(scope.now.getTime() + this.engine.params.branchVoteDeadlineHours * HOUR),
        });
        await this.lifecycle.touched(scope, ctx, REL_EVENTS.MOVED_IN, null);
        await scope.outbox.emit({
          topic: 'relationship.moved_in',
          aggregateType: 'RelationshipContext',
          aggregateId: ctx.id,
          payload: { relationshipId: ctx.id, userIds: ctx.sides.map((s) => s.userId), occurredAt: scope.now.toISOString() },
        });
        return { status: 'MOVED_IN' as const, closedOthers: others.length };
      },
    });
  }

  private async lockContext(scope: TxScope, actorId: string, contextId: string): Promise<ContextRow> {
    const pre = await this.repo.load(scope, contextId);
    if (!pre || !pre.sides.some((s) => s.userId === actorId && s.active)) throw Errors.notFound('Relation');
    await scope.lock.users(pre.sides.map((s) => s.userId));
    await scope.lock.pets(pre.sides.map((s) => s.petId));
    await scope.lock.relationships([contextId]);
    return (await this.repo.load(scope, contextId))!;
  }
}
