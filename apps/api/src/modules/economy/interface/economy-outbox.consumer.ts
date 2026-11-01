import type { OutboxConsumer, OutboxEnvelope } from '../../../shared/application/outbox-consumer.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { RELATIONSHIP_TOPICS, SOCIAL_TOPICS } from '../application/economy-events.js';
import type { GrantReferralRewardUseCase } from '../application/use-cases/referral-reward.use-case.js';
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

/** Consommateur outbox : `referral.activated` (social) → récompenses ledger une seule fois. */
export class EconomyReferralRewardConsumer implements OutboxConsumer {
  readonly name = 'economy.referral_reward';
  readonly topics = [SOCIAL_TOPICS.REFERRAL_ACTIVATED];

  constructor(private readonly useCase: GrantReferralRewardUseCase) {}

  async handle(scope: TxScope, event: OutboxEnvelope): Promise<void> {
    const p = event.payload;
    const str = (k: string) => (typeof p[k] === 'string' ? (p[k] as string) : '');
    const int = (k: string) => (typeof p[k] === 'number' ? (p[k] as number) : 0);
    if (!str('claimId') || !str('referrerUserId') || !str('refereeUserId')) return;
    await this.useCase.execute(scope, { claimId: str('claimId'), referrerUserId: str('referrerUserId'), refereeUserId: str('refereeUserId'), referrerCoins: int('referrerCoins'), refereeCoins: int('refereeCoins') });
  }
}
