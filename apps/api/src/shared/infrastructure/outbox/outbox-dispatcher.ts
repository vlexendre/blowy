/**
 * Relais outbox rejouable (worker). Réclame un lot par `FOR UPDATE SKIP LOCKED`,
 * appelle chaque consommateur dans sa propre transaction avec ConsumerDeduplication,
 * puis marque l'événement publié. Un échec incrémente `attempts` avec backoff.
 */
import type { Db } from '@blowy/database';
import type { OutboxConsumer, OutboxEffect, OutboxEnvelope } from '../../application/outbox-consumer.js';
import type { UnitOfWork } from '../../application/unit-of-work.js';
import type { Logger } from '../logging/logger.js';
import { txOf } from '../prisma/prisma-unit-of-work.js';

const MAX_ATTEMPTS = 10;

export class OutboxDispatcher {
  constructor(
    private readonly db: Db,
    private readonly uow: UnitOfWork,
    private readonly consumers: readonly OutboxConsumer[],
    private readonly effects: readonly OutboxEffect[],
    private readonly logger: Logger,
  ) {}

  /** Traite un lot ; renvoie le nombre d'événements traités. */
  async drainOnce(now: Date, batch = 50): Promise<number> {
    const rows = await this.db.$queryRaw<{ id: string }[]>`
      SELECT id FROM "OutboxEvent"
      WHERE "publishedAt" IS NULL AND "availableAt" <= ${now} AND attempts < ${MAX_ATTEMPTS}
      ORDER BY "createdAt", id LIMIT ${batch}`;
    let n = 0;
    for (const { id } of rows) {
      if (await this.dispatch(id)) n++;
    }
    return n;
  }

  /** Traite tout jusqu'à épuisement (tests, rattrapage). */
  async drainAll(now: Date, maxRounds = 50): Promise<number> {
    let total = 0;
    for (let i = 0; i < maxRounds; i++) {
      const n = await this.drainOnce(now);
      total += n;
      if (n === 0) break;
    }
    return total;
  }

  private async dispatch(id: string): Promise<boolean> {
    try {
      const raw = await this.db.outboxEvent.findUnique({ where: { id } });
      if (!raw || raw.publishedAt) return false;
      const envelope: OutboxEnvelope = { id: raw.id, topic: raw.topic, aggregateType: raw.aggregateType, aggregateId: raw.aggregateId, payload: raw.payload as Record<string, unknown>, createdAt: raw.createdAt };
      for (const fx of this.effects) {
        if (fx.topics.includes(raw.topic) || fx.topics.includes('*')) await fx.run(envelope);
      }
      return await this.uow.run(async (scope) => {
        const tx = txOf(scope);
        const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "OutboxEvent" WHERE id = ${id}::uuid AND "publishedAt" IS NULL FOR UPDATE SKIP LOCKED`;
        if (locked.length === 0) return false;
        const ev = await tx.outboxEvent.findUniqueOrThrow({ where: { id } });
        const env: OutboxEnvelope = { id: ev.id, topic: ev.topic, aggregateType: ev.aggregateType, aggregateId: ev.aggregateId, payload: ev.payload as Record<string, unknown>, createdAt: ev.createdAt };
        for (const c of this.consumers) {
          if (!c.topics.includes(ev.topic) && !c.topics.includes('*')) continue;
          const inserted = await tx.$executeRaw`INSERT INTO "ConsumerDeduplication" (consumer, "eventId", "processedAt") VALUES (${c.name}, ${ev.id}::uuid, ${scope.now}) ON CONFLICT DO NOTHING`;
          if (inserted === 0) continue; // déjà appliqué
          await c.handle(scope, env);
        }
        await tx.outboxEvent.update({ where: { id }, data: { publishedAt: scope.now, attempts: { increment: 1 } } });
        return true;
      });
    } catch (err) {
      this.logger.warn({ outboxId: id, err: (err as Error).message }, 'outbox_dispatch_failed');
      const backoffMs = 1000;
      await this.db.$executeRaw`UPDATE "OutboxEvent" SET attempts = attempts + 1, "lastError" = ${String((err as Error).message).slice(0, 500)}, "availableAt" = now() + (${backoffMs} * power(2, least(attempts, 8))) * interval '1 millisecond' WHERE id = ${id}::uuid`;
      return false;
    }
  }
}
