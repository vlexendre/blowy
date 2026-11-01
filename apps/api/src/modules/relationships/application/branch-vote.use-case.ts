/**
 * Vote de branche secret (P-5.8).
 *  - cast : enregistre MON choix (table séparée). Aucun événement visible de l'autre n'est
 *    émis tant que la ronde n'est pas résolue : pas de projection, pas de version qui bouge.
 *  - résolution : dès que les deux ont voté, ou à l'échéance (job) ; seule la branche
 *    résultante est publiée, en un événement identique pour les deux.
 *  - downgrade : Plus → Ami par une seule personne, effet immédiat.
 */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { UnitOfWork, TxScope } from '../../../shared/application/unit-of-work.js';
import { Errors } from '../../../shared/domain/errors.js';
import { resolveBranch } from '../domain/branch-vote.js';
import { REL_EVENTS } from '../domain/relationship-events.js';
import type { RelationshipLifecycle } from './relationship-lifecycle.service.js';
import type { ContextRow, RelationshipRepository } from './ports/relationship.repository.js';

export class BranchVoteUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly uow: UnitOfWork,
    private readonly repo: RelationshipRepository,
    private readonly lifecycle: RelationshipLifecycle,
  ) {}

  cast(actorId: string, contextId: string, commandId: string, choice: 'FRIEND' | 'PLUS') {
    return this.bus.execute({
      actorId,
      operation: 'relationships.branch.cast',
      commandId,
      payload: { contextId, choice },
      handle: async (scope) => {
        const ctx = await this.locked(scope, actorId, contextId);
        const round = await this.repo.openRound(scope, contextId);
        if (!round || round.deadlineAt <= scope.now) throw Errors.precondition('NO_OPEN_ROUND');
        if ((await this.repo.ballotsOf(scope, round.id)).some((b) => b.userId === actorId)) throw Errors.conflict('ALREADY_VOTED');
        await this.repo.castBallot(scope, round.id, actorId, choice);
        await this.tryResolve(scope, ctx, round.id, false);
        // Réponse : uniquement mon propre choix (jamais l'état de l'autre ni « en attente de »).
        return { myChoice: choice };
      },
    });
  }

  downgrade(actorId: string, contextId: string, commandId: string) {
    return this.bus.execute({
      actorId,
      operation: 'relationships.branch.downgrade',
      commandId,
      payload: { contextId },
      handle: async (scope) => {
        const ctx = await this.locked(scope, actorId, contextId);
        if (ctx.branch !== 'PLUS') throw Errors.precondition('NOT_PLUS');
        await this.repo.update(scope, ctx.id, { branch: 'FRIEND' });
        await this.lifecycle.touched(scope, ctx, REL_EVENTS.BRANCH_DOWNGRADED, null, { branch: 'FRIEND' });
        return { branch: 'FRIEND' as const };
      },
    });
  }

  /** Job : résout les rondes échues (échéance commune). */
  async resolveDue(now: Date, limit = 100): Promise<number> {
    const due = await this.repo.dueRounds(now, limit);
    let n = 0;
    for (const r of due) {
      await this.uow.run(async (scope) => {
        const pre = await this.repo.load(scope, r.contextId);
        if (!pre) return;
        await scope.lock.users(pre.sides.map((s) => s.userId));
        await scope.lock.relationships([pre.id]);
        const ctx = (await this.repo.load(scope, r.contextId))!;
        if (await this.tryResolve(scope, ctx, r.id, true)) n++;
      });
    }
    return n;
  }

  private async tryResolve(scope: TxScope, ctx: ContextRow, roundId: string, deadlinePassed: boolean): Promise<boolean> {
    const ballots = await this.repo.ballotsOf(scope, roundId);
    const result = ctx.status === 'ENDED' ? 'FRIEND' : resolveBranch(ballots.map((b) => b.choice), 2, deadlinePassed);
    if (!result) return false;
    await this.repo.resolveRound(scope, roundId, result, scope.now);
    if (ctx.status !== 'ENDED') {
      await this.repo.update(scope, ctx.id, { branch: result });
      await this.lifecycle.touched(scope, ctx, REL_EVENTS.BRANCH_RESOLVED, null, { branch: result });
    }
    return true;
  }

  private async locked(scope: TxScope, actorId: string, contextId: string): Promise<ContextRow> {
    const pre = await this.repo.load(scope, contextId);
    if (!pre || !pre.sides.some((s) => s.userId === actorId && s.active)) throw Errors.notFound('Relation');
    await scope.lock.users(pre.sides.map((s) => s.userId));
    await scope.lock.relationships([contextId]);
    const ctx = (await this.repo.load(scope, contextId))!;
    if (ctx.status === 'ENDED') throw Errors.precondition('ALREADY_ENDED');
    return ctx;
  }
}
