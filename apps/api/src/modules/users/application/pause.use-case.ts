/** Pause globale ou par relation (≤ 14 j par période, P-5.14). */
import type { StartPauseRequest } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { RandomSource } from '../../../shared/application/clock.js';
import { Errors } from '../../../shared/domain/errors.js';
import { MAX_PAUSE_DAYS, pausePeriodKey, remainingPauseDays } from '../domain/pause.js';
import type { UserProfileRepository } from './ports/user-profile.repository.js';

const DAY = 86_400_000;

export class StartPauseUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: UserProfileRepository,
    private readonly random: RandomSource,
  ) {}

  async execute(actorId: string, commandId: string, req: StartPauseRequest) {
    if (req.relationshipId && !(await this.repo.isParticipant(actorId, req.relationshipId))) throw Errors.notFound('Relation');
    return this.bus.execute({
      actorId,
      operation: 'me.start_pause',
      commandId,
      payload: req,
      handle: async (scope) => {
        await scope.lock.users([actorId]);
        if (req.relationshipId) await scope.lock.relationships([req.relationshipId]);
        const periodKey = pausePeriodKey(scope.now);
        const spans = await this.repo.pausesInPeriod(scope, actorId, periodKey);
        const sameTarget = spans.find((s) => (s.contextId ?? null) === (req.relationshipId ?? null) && !s.endedAt && s.endsAt > scope.now);
        if (sameTarget) throw Errors.conflict('PAUSE_ALREADY_ACTIVE');
        const remaining = remainingPauseDays(spans);
        if (req.days > remaining) throw Errors.precondition('PAUSE_QUOTA_EXCEEDED', { remainingDays: remaining, maxDays: MAX_PAUSE_DAYS });
        const id = this.random.uuid();
        const endsAt = new Date(scope.now.getTime() + req.days * DAY);
        await this.repo.createPause(scope, { id, userId: actorId, contextId: req.relationshipId ?? null, startsAt: scope.now, endsAt, periodKey });
        await scope.outbox.emit({
          topic: 'user.pause_started',
          aggregateType: req.relationshipId ? 'RelationshipContext' : 'User',
          aggregateId: req.relationshipId ?? actorId,
          payload: { userId: actorId, pauseId: id, relationshipId: req.relationshipId ?? null, endsAt: endsAt.toISOString() },
        });
        // Réactivation à l'échéance (événement différé).
        await scope.outbox.emit({ topic: 'user.pause_due', aggregateType: 'User', aggregateId: actorId, payload: { pauseId: id }, availableAt: endsAt });
        return { pauseId: id, endsAt: endsAt.toISOString() };
      },
    });
  }
}

export class EndPauseUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: UserProfileRepository,
  ) {}
  execute(actorId: string, commandId: string, pauseId: string) {
    return this.bus.execute({
      actorId,
      operation: 'me.end_pause',
      commandId,
      payload: { pauseId },
      handle: async (scope) => {
        const ok = await this.repo.endPause(scope, actorId, pauseId);
        if (!ok) throw Errors.notFound('Pause');
        await scope.outbox.emit({ topic: 'user.pause_ended', aggregateType: 'User', aggregateId: actorId, payload: { pauseId } });
        return { ok: true };
      },
    });
  }
}
