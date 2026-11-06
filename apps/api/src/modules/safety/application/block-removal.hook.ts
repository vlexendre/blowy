/**
 * Retrait système au blocage (spec-v5 §2.6 D-025) : quand A bloque B (avec ou sans signalement)
 * alors qu'ils partagent une sortie active, B est retiré·e — remboursé·e intégralement (port de
 * financement d'economy, via outings), prioritaire la semaine suivante, message neutre identique à
 * toute recomposition (`outing.composition_changed`) ; A ne fait rien ; le groupe voit « ne pourra
 * pas venir ». Signal staff si A déclenche ≥ `[T] safety.removalAbuseThreshold` retraits en 30 j.
 */
import type { RandomSource } from '../../../shared/application/clock.js';
import type { BlockSafetyHook } from '../../../shared/application/ports/block-hook.port.js';
import type { OutingSafetyPort } from '../../../shared/application/ports/outing-safety.port.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { removalAbuse, type SafetyTuningSlice } from '../domain/guardian.js';
import type { SafetyCaseSink, SafetyRepository } from './ports/safety.ports.js';

export class BlockRemovalHook implements BlockSafetyHook {
  constructor(
    private readonly outings: OutingSafetyPort | null,
    private readonly repo: SafetyRepository,
    private readonly cases: SafetyCaseSink,
    private readonly random: RandomSource,
    private readonly tuning: SafetyTuningSlice,
  ) {}

  async afterBlock(scope: TxScope, i: { blockerId: string; blockedId: string }) {
    if (!this.outings) return { removedFromOutings: 0 };
    const removed = await this.outings.removeFromSharedOutings(scope, { removedUserId: i.blockedId, withUserId: i.blockerId });
    for (const r of removed) {
      await this.repo.recordRemoval(scope, { id: this.random.uuid(), outingId: r.outingId, seatId: r.seatId, removedUserId: i.blockedId, triggeredByUserId: i.blockerId, cause: 'BLOCK' });
      // Notification neutre (planificateur T8) : jamais le motif, jamais qui a bloqué.
      await scope.outbox.emit({ topic: 'outing.composition_changed', aggregateType: 'OutingSeat', aggregateId: r.seatId, payload: { userId: i.blockedId, outingId: r.outingId, refundState: r.refundState, priorityNextWeek: true } });
    }
    if (removed.length) {
      const since = new Date(scope.now.getTime() - this.tuning.removalAbuseWindowDays * 86_400_000);
      if (removalAbuse(await this.repo.removalsSince(scope, i.blockerId, since), this.tuning)) {
        await this.cases.open(scope, { subjectType: 'USER', subjectId: i.blockerId, subjectUserId: i.blockerId, reasonCode: 'SYSTEM_REMOVAL_ABUSE_SIGNAL', priority: 3, dueInMinutes: 24 * 60 });
      }
    }
    return { removedFromOutings: removed.length };
  }
}
