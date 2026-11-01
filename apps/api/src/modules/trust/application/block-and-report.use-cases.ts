/**
 * Commandes trust.block et trust.report (P-5.15, §19).
 * Blocage ATOMIQUE dans une transaction : fin des relations (BLOCK, sans message ni pénalité),
 * révocation des rooms WS, conversations, médias, matching, gardiens, droits dérivés,
 * coparentalité en projection indépendante, annulation des tâches IA de la relation.
 * Signalement : catégorie, sortie de sécurité (fin immédiate, sans pénalité), dossier de
 * modération ; le signaleur n'est JAMAIS révélé à la personne signalée.
 */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { Errors } from '../../../shared/domain/errors.js';
import type { RelationshipLifecycle } from '../../relationships/application/relationship-lifecycle.service.js';
import type { RelationshipRepository } from '../../relationships/application/ports/relationship.repository.js';
import { REPORT_CASE_PRIORITY, caseDueAt } from '../domain/trust-rules.js';
import type { AiInvalidation, TrustRepository } from './ports/trust.repository.js';

export interface Target {
  relationshipId?: string | undefined;
  petId?: string | undefined;
  messageId?: string | undefined;
}

export class TargetResolver {
  constructor(private readonly repo: TrustRepository) {}
  /** Résout la personne visée depuis un objet connu de l'acteur ; sinon 404 (anti-IDOR). */
  async resolve(actorId: string, t: Target): Promise<string> {
    const id = t.messageId ? await this.repo.targetFromMessage(actorId, t.messageId) : t.relationshipId ? await this.repo.targetFromRelationship(actorId, t.relationshipId) : t.petId ? await this.repo.targetFromPet(actorId, t.petId) : null;
    if (!id || id === actorId) throw Errors.notFound('Cible');
    return id;
  }
}

export class BlockService {
  constructor(
    private readonly repo: TrustRepository,
    private readonly relationships: RelationshipRepository,
    private readonly lifecycle: RelationshipLifecycle,
    private readonly ai: AiInvalidation,
  ) {}

  /** Applique le blocage dans la transaction courante (verrous users → pets → relations). */
  async apply(scope: TxScope, actorId: string, targetId: string): Promise<{ blockId: string; created: boolean }> {
    const contexts = await this.repo.contextsBetween(scope, actorId, targetId);
    await scope.lock.users([actorId, targetId]);
    await scope.lock.pets(contexts.flatMap((c) => c.petIds));
    await scope.lock.relationships(contexts.map((c) => c.id));
    const b = await this.repo.insertBlock(scope, actorId, targetId);
    for (const c of contexts) {
      const ctx = await this.relationships.load(scope, c.id);
      // Fin sans message de départ ni pénalité ; révoque conversation et rooms WS.
      if (ctx && ctx.status !== 'ENDED') await this.lifecycle.end(scope, ctx, 'BLOCK', actorId);
    }
    await this.repo.applyBlockSideEffects(scope, actorId, targetId, contexts.map((c) => c.id));
    // Aucun job IA ni push tardif ne doit rouvrir le contact.
    await this.ai.cancelForContexts(scope, contexts.map((c) => c.id), 'BLOCK');
    await scope.outbox.emit({ topic: 'trust.blocked', aggregateType: 'User', aggregateId: actorId, payload: { blockerId: actorId, blockedId: targetId, contextIds: contexts.map((c) => c.id) } });
    return { blockId: b.id, created: b.created };
  }
}

export class BlockUserUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly targets: TargetResolver,
    private readonly blocks: BlockService,
  ) {}
  async execute(actorId: string, commandId: string, target: Target) {
    const targetId = await this.targets.resolve(actorId, target);
    return this.bus.execute({
      actorId,
      operation: 'trust.block',
      commandId,
      payload: target,
      handle: async (scope) => {
        const r = await this.blocks.apply(scope, actorId, targetId);
        return { id: r.blockId, createdAt: scope.now.toISOString() };
      },
    });
  }
}

export class ReportUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: TrustRepository,
    private readonly targets: TargetResolver,
    private readonly blocks: BlockService,
    private readonly relationships: RelationshipRepository,
    private readonly lifecycle: RelationshipLifecycle,
    private readonly random: RandomSource,
  ) {}

  async execute(actorId: string, commandId: string, req: { target: Target; category: string; note?: string | undefined; safetyExit: boolean; alsoBlock: boolean }) {
    const targetId = await this.targets.resolve(actorId, req.target);
    return this.bus.execute({
      actorId,
      operation: 'trust.report',
      commandId,
      payload: req,
      handle: async (scope) => {
        const contexts = await this.repo.contextsBetween(scope, actorId, targetId);
        const contextId = req.target.relationshipId ?? contexts.find((c) => c.status !== 'ENDED')?.id ?? null;
        const id = this.random.uuid();
        const subjectRef = req.target.messageId ? `message:${req.target.messageId}` : req.target.petId ? `pet:${req.target.petId}` : null;
        let blocked = false;
        if (req.alsoBlock) {
          await this.blocks.apply(scope, actorId, targetId);
          blocked = true;
        } else if (req.safetyExit) {
          await scope.lock.users([actorId, targetId]);
          await scope.lock.pets(contexts.flatMap((c) => c.petIds));
          await scope.lock.relationships(contexts.map((c) => c.id));
          // Sortie de sécurité : fin immédiate, sans message de départ, sans pénalité de fiabilité.
          for (const c of contexts) {
            const ctx = await this.relationships.load(scope, c.id);
            if (ctx && ctx.status !== 'ENDED') await this.lifecycle.end(scope, ctx, 'REPORT_SAFETY_EXIT', actorId);
          }
        }
        await this.repo.insertReport(scope, { id, reporterId: actorId, reportedUserId: targetId, contextId, category: req.category, safetyExit: req.safetyExit, subjectRef, note: req.note ?? null });
        const priority = REPORT_CASE_PRIORITY[req.category] ?? 3;
        const subject = req.target.messageId ? { subjectType: 'MESSAGE' as const, subjectId: req.target.messageId } : { subjectType: 'USER' as const, subjectId: targetId };
        await this.repo.openCase(scope, { ...subject, subjectUserId: targetId, reasonCode: `REPORT_${req.category}`, priority, restricted: req.category === 'MINOR', reportId: id, dueAt: caseDueAt(scope.now, priority) });
        return { id, category: req.category, status: 'OPEN', safetyExit: req.safetyExit, blocked, createdAt: scope.now.toISOString() };
      },
    });
  }
}

export class ListBlocksQuery {
  constructor(private readonly repo: TrustRepository) {}
  async execute(userId: string) {
    return { items: (await this.repo.listBlocks(userId)).map((b) => ({ id: b.id, petName: b.petName, createdAt: b.createdAt.toISOString() })) };
  }
}
