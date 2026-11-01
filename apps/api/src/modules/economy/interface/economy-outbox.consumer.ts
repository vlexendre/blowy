import type { OutboxConsumer, OutboxEnvelope } from '../../../shared/application/outbox-consumer.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { RELATIONSHIP_TOPICS } from '../application/economy-events.js';
import type { RelationshipEntitlementsUseCase } from '../application/use-cases/entitlement-jobs.use-case.js';

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Consommateur outbox : relations emménagées/terminées → droits dérivés (dédupliqué par le socle). */
export class EconomyRelationshipConsumer implements OutboxConsumer {
  readonly name = 'economy.relationship_entitlements';
  readonly topics = [RELATIONSHIP_TOPICS.MOVED_IN, RELATIONSHIP_TOPICS.ENDED];

  constructor(private readonly useCase: RelationshipEntitlementsUseCase) {}

  async handle(scope: TxScope, event: OutboxEnvelope): Promise<void> {
    const relationshipId = typeof event.payload['relationshipId'] === 'string' ? event.payload['relationshipId'] : event.aggregateId;
    const userIds = ids(event.payload['userIds']);
    if (event.topic === RELATIONSHIP_TOPICS.MOVED_IN) await this.useCase.onMovedIn(scope, relationshipId, userIds);
    else await this.useCase.onEnded(scope, relationshipId, userIds);
  }
}
