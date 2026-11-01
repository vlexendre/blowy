/**
 * Consommateurs outbox du module relations :
 *  - `economy.plus_capacity_reduced` {userId, newDateSlots} → relations au-delà marquées LEGACY (P-5.13) ;
 *  - `user.pause_due` → la pause expirée est close (réactivation, sans rattrapage punitif).
 */
import type { OutboxConsumer, OutboxEnvelope } from '../../../shared/application/outbox-consumer.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';

class CapacityReducedConsumer implements OutboxConsumer {
  readonly name = 'relationships.capacity_reduced';
  readonly topics = ['economy.plus_capacity_reduced'];
  async handle(scope: TxScope, e: OutboxEnvelope): Promise<void> {
    const userId = String(e.payload.userId ?? '');
    const slots = Number(e.payload.newDateSlots ?? 1);
    if (!userId) return;
    await scope.lock.users([userId]);
    const tx = txOf(scope);
    const live = await tx.relationshipContext.findMany({
      where: { type: 'DATE', status: { not: 'ENDED' }, legacy: false, sides: { some: { userId, active: true } } },
      orderBy: [{ movedInAt: { sort: 'desc', nulls: 'last' } }, { startedAt: 'asc' }],
      select: { id: true },
    });
    const over = live.slice(Math.max(0, slots));
    if (over.length) await tx.relationshipContext.updateMany({ where: { id: { in: over.map((c) => c.id) } }, data: { legacy: true } });
  }
}

class PauseDueConsumer implements OutboxConsumer {
  readonly name = 'relationships.pause_due';
  readonly topics = ['user.pause_due'];
  async handle(scope: TxScope, e: OutboxEnvelope): Promise<void> {
    await txOf(scope).pausePeriod.updateMany({ where: { id: String(e.payload.pauseId), endedAt: null, endsAt: { lte: scope.now } }, data: { endedAt: scope.now } });
  }
}

export class RelationshipConsumers {
  list(): OutboxConsumer[] {
    return [new CapacityReducedConsumer(), new PauseDueConsumer()];
  }
}
