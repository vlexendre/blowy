import type { CommandBus } from '../../../../shared/application/command-bus.js';
import { calendarDay, planFreezeUse, precondition } from '../../domain/index.js';
import type { CatalogRepository } from '../ports/catalog.repository.js';

export interface UseFreezeResult {
  protectedDay: string;
  remainingFreezes: number;
  streakLength: number;
}

/**
 * Consommation ATOMIQUE d'un gel : verrou User puis gels AVAILABLE (FOR UPDATE) puis série.
 * Le « jour » vient du calendrier serveur dans la timezone stable de la série (jamais du client).
 * Deux appels concurrents : le second voit le jour déjà couvert → PRECONDITION_FAILED, un seul gel consommé
 * (renforcé par l'unicité partielle (userId, protectedDay)).
 */
export class UseStreakFreezeUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly catalog: CatalogRepository,
  ) {}

  execute(actorId: string, commandId: string) {
    return this.bus.execute<Record<string, never>, UseFreezeResult>({
      actorId,
      operation: 'economy.use_streak_freeze',
      commandId,
      payload: {},
      handle: async (scope) => {
        await scope.lock.users([actorId]);
        const streak = await this.catalog.lockStreak(scope, actorId);
        if (!streak) throw precondition('Aucune série à protéger.');
        const freezes = await this.catalog.lockAvailableFreezes(scope, actorId, scope.now);
        const today = calendarDay(scope.now, streak.timeZone);
        const plan = planFreezeUse(streak, today, freezes.length);
        // Priorité aux gels mensuels (périssables) puis achetés.
        const chosen = [...freezes].sort((a, b) => Number(b.source === 'MONTHLY_BENEFIT') - Number(a.source === 'MONTHLY_BENEFIT'))[0]!;
        await this.catalog.consumeFreeze(scope, chosen.id, plan.protectedDay, scope.now);
        await this.catalog.coverStreakDay(scope, actorId, plan.newLastCoveredDay, streak.version);
        await scope.outbox.emit({
          topic: 'economy.streak_freeze_used',
          aggregateType: 'User',
          aggregateId: actorId,
          payload: { userId: actorId, protectedDay: plan.protectedDay, occurredAt: scope.now.toISOString() },
        });
        return { protectedDay: plan.protectedDay, remainingFreezes: freezes.length - 1, streakLength: streak.length };
      },
    });
  }
}
