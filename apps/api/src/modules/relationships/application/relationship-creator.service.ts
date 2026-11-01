/** Implémente RelationshipCreator pour le matching (création sans déplacer les pets). */
import type { RandomSource } from '../../../shared/application/clock.js';
import type { EngineGateway } from '../../../shared/application/ports/engine.gateway.js';
import type { RelationshipCreator } from '../../../shared/application/ports/relationship-creator.port.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { Errors } from '../../../shared/domain/errors.js';
import { REL_EVENTS, SYSTEM_TEMPLATES } from '../domain/relationship-events.js';
import type { RelationshipLifecycle } from './relationship-lifecycle.service.js';
import type { ConversationAdmin } from './ports/relationship-side-effects.port.js';
import type { RelationshipRepository } from './ports/relationship.repository.js';

export class RelationshipCreatorService implements RelationshipCreator {
  constructor(
    private readonly repo: RelationshipRepository,
    private readonly conversations: ConversationAdmin,
    private readonly lifecycle: RelationshipLifecycle,
    private readonly engine: EngineGateway,
    private readonly random: RandomSource,
  ) {}

  async canStartDate(scope: TxScope, userId: string, slots: number) {
    if (await this.repo.hasExclusive(scope, userId)) return { ok: false, reason: 'EXCLUSIVE' as const };
    const live = (await this.repo.liveDateContextsOf(scope, userId)).filter((c) => !c.legacy);
    if (live.length >= slots) return { ok: false, reason: 'CAPACITY' as const };
    return { ok: true };
  }

  async createDate(scope: TxScope, input: { users: [string, string]; pets: [string, string]; affinity: number; dateSpotKey: string | null; timezone: string }) {
    const pairId = await this.repo.ensurePair(scope, input.pets[0], input.pets[1]);
    if (await this.repo.existingLiveContext(scope, pairId)) throw Errors.conflict('RELATIONSHIP_EXISTS');
    const contextId = this.random.uuid();
    const conversationId = this.random.uuid();
    const init = this.engine.params.relationshipInitial;
    await this.repo.create(scope, {
      id: contextId,
      pairId,
      affinity: input.affinity,
      dateSpotKey: input.dateSpotKey,
      timezone: input.timezone,
      engineVersion: this.engine.engineVersion,
      tuningVersion: this.engine.tuningVersion,
      complicity: init.complicity,
      tension: init.tension,
      desire: init.desire,
      sides: [
        { userId: input.users[0], petId: input.pets[0] },
        { userId: input.users[1], petId: input.pets[1] },
      ],
      conversationId,
    });
    await this.conversations.create(scope, { id: conversationId, contextId, kind: 'DATE', memberIds: [...input.users] });
    await this.conversations.postSystemMessage(scope, conversationId, SYSTEM_TEMPLATES.MATCHED);
    const ctx = (await this.repo.load(scope, contextId))!;
    await this.lifecycle.touched(scope, ctx, REL_EVENTS.CREATED, null);
    return { contextId, conversationId };
  }
}
