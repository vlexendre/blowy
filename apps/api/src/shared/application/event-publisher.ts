/**
 * Publication d'un événement visible : projection par destinataire (payload filtré par
 * destinataire) + outbox `realtime.deliver` dans la même transaction. Le worker relaie
 * ensuite vers Socket.IO. Une seule implémentation partagée par tous les modules.
 */
import type { ProjectionWriter } from './projection.js';
import type { TxScope } from './unit-of-work.js';

export interface VisibleEvent {
  sourceEventId: string;
  type: string;
  aggregateId: string;
  room: string;
  /** Payload par destinataire (filtré : jamais de données privées d'autrui). */
  recipients: { userId: string; payload: Record<string, unknown> }[];
}

export class EventPublisher {
  constructor(private readonly projections: ProjectionWriter) {}

  async publish(scope: TxScope, e: VisibleEvent): Promise<void> {
    for (const r of e.recipients) {
      await this.projections.append(scope, {
        recipientId: r.userId,
        sourceEventId: e.sourceEventId,
        room: e.room,
        type: e.type,
        aggregateId: e.aggregateId,
        payload: r.payload,
        occurredAt: scope.now,
      });
    }
    await scope.outbox.emit({
      topic: 'realtime.deliver',
      aggregateType: 'Projection',
      aggregateId: e.sourceEventId,
      payload: { recipients: e.recipients.map((r) => r.userId) },
    });
  }
}
export const EVENT_PUBLISHER = Symbol('EventPublisher');
