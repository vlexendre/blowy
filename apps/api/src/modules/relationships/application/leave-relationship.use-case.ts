/** Commande relationships.leave : départ propre (message système pré-écrit), sans pénalité. */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import { Errors } from '../../../shared/domain/errors.js';
import type { RelationshipLifecycle } from './relationship-lifecycle.service.js';
import type { RelationshipRepository } from './ports/relationship.repository.js';

export class LeaveRelationshipUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: RelationshipRepository,
    private readonly lifecycle: RelationshipLifecycle,
  ) {}

  execute(actorId: string, contextId: string, commandId: string, reason: 'CLEAN_LEAVE' | 'REPORT_SAFETY_EXIT') {
    return this.bus.execute({
      actorId,
      operation: 'relationships.leave',
      commandId,
      payload: { contextId, reason },
      handle: async (scope) => {
        const pre = await this.repo.load(scope, contextId);
        if (!pre || !pre.sides.some((s) => s.userId === actorId && s.active)) throw Errors.notFound('Relation');
        await scope.lock.users(pre.sides.map((s) => s.userId));
        await scope.lock.pets(pre.sides.map((s) => s.petId));
        await scope.lock.relationships([contextId]);
        const ctx = (await this.repo.load(scope, contextId))!;
        if (ctx.status === 'ENDED') throw Errors.precondition('ALREADY_ENDED');
        await this.lifecycle.end(scope, ctx, reason, actorId);
        return { ok: true };
      },
    });
  }
}
