import type { OutboxConsumer, OutboxEnvelope } from '../../../shared/application/outbox-consumer.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { RELATIONSHIP_TOPICS, SOCIAL_TOPICS } from '../application/economy-events.js';
import type { ReferralFreeStore } from '../infrastructure/prisma/prisma-referral-free.store.js';
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

  constructor(
    private readonly useCase: GrantReferralRewardUseCase,
    private readonly referralFree: ReferralFreeStore | null = null,
  ) {}

  async handle(scope: TxScope, event: OutboxEnvelope): Promise<void> {
    const p = event.payload;
    const str = (k: string) => (typeof p[k] === 'string' ? (p[k] as string) : '');
    if (!str('claimId') || !str('referrerUserId') || !str('refereeUserId')) return;
    if (str('referrerUserId') === str('refereeUserId')) return;
    // V5.5 (D-064) : le parrainage n'offre plus de pièces — la 1ʳᵉ sortie VÉCUE du·de la filleul·e offre au parrain
    // sa PROCHAINE sortie, au plus 1 par mois et jamais plus d'une en attente (le code « pièces » reste, inactif).
    if (!this.referralFree) return;
    const granted = await this.referralFree.grant(scope, { referrerUserId: str('referrerUserId'), refereeUserId: str('refereeUserId'), period: await this.referralFree.periodOf(scope, str('referrerUserId'), scope.now) });
    if (granted) await scope.outbox.emit({ topic: 'referral.next_outing_free', aggregateType: 'User', aggregateId: str('referrerUserId'), payload: { userId: str('referrerUserId') } });
  }
}
