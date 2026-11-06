/**
 * Commandes trust.block et trust.report (P-5.15, §19).
 * Blocage ATOMIQUE dans une transaction : fin des relations (BLOCK, sans message ni pénalité),
 * révocation des rooms WS, conversations, médias, matching, gardiens, droits dérivés,
 * coparentalité en projection indépendante, annulation des tâches IA de la relation.
 * Signalement : catégorie, sortie de sécurité (fin immédiate, sans pénalité), dossier de
 * modération ; le signaleur n'est JAMAIS révélé à la personne signalée.
 */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { BlockSafetyHook } from '../../../shared/application/ports/block-hook.port.js';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { Errors } from '../../../shared/domain/errors.js';
import type { RelationshipLifecycle } from '../../relationships/application/relationship-lifecycle.service.js';
import type { RelationshipRepository } from '../../relationships/application/ports/relationship.repository.js';
import { REPORT_CASE_PRIORITY, reportDueAt } from '../domain/trust-rules.js';
import type { AiInvalidation, TrustRepository } from './ports/trust.repository.js';

export interface Target {
  relationshipId?: string | undefined;
  petId?: string | undefined;
  messageId?: string | undefined;
  /** V5 : sortie partagée (+ personne vue dans la vue de sortie). */
  outing?: { id: string; userId?: string | undefined } | undefined;
}

export class TargetResolver {
  constructor(private readonly repo: TrustRepository) {}
  /** Résout la personne visée depuis un objet connu de l'acteur ; sinon 404 (anti-IDOR). */
  async resolve(actorId: string, t: Target): Promise<string> {
    if (t.outing) {
      const id = t.outing.userId ? await this.repo.targetFromOuting(actorId, t.outing.id, t.outing.userId) : null;
      if (!id || id === actorId) throw Errors.notFound('Cible');
      return id;
    }
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
    private readonly safety: BlockSafetyHook | null = null,
  ) {}

  /** Applique le blocage dans la transaction courante (verrous users → pets → relations → sorties). */
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
    // V5 (D-025) : la personne bloquée quitte les sorties actives partagées, dans la même transaction.
    const removed = this.safety ? (await this.safety.afterBlock(scope, { blockerId: actorId, blockedId: targetId })).removedFromOutings : 0;
    await scope.outbox.emit({ topic: 'trust.blocked', aggregateType: 'User', aggregateId: actorId, payload: { blockerId: actorId, blockedId: targetId, contextIds: contexts.map((c) => c.id) } });
    // Nom V5 (spec §11.2) consommé par connections / notifications.
    await scope.outbox.emit({ topic: 'trust.block_created', aggregateType: 'User', aggregateId: actorId, payload: { blockerId: actorId, blockedId: targetId, removedFromOutings: removed } });
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
    // V5.2 H.23 : incident sur place (lieu, personnel, autre client) sans personne visée parmi les participants.
    if (req.target.outing && !req.target.outing.userId) return this.incident(actorId, commandId, req);
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
        const subjectRef = req.target.messageId ? `message:${req.target.messageId}` : req.target.petId ? `pet:${req.target.petId}` : req.target.outing ? `outing:${req.target.outing.id}` : null;
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
        await this.repo.insertReport(scope, { id, reporterId: actorId, reportedUserId: targetId, contextId, category: req.category, safetyExit: req.safetyExit, subjectRef, note: req.note ?? null, outingId: req.target.outing?.id ?? null });
        const priority = REPORT_CASE_PRIORITY[req.category] ?? 3;
        const subject = req.target.messageId ? { subjectType: 'MESSAGE' as const, subjectId: req.target.messageId } : { subjectType: 'USER' as const, subjectId: targetId };
        await this.repo.openCase(scope, { ...subject, subjectUserId: targetId, reasonCode: `REPORT_${req.category}`, priority, restricted: req.category === 'MINOR', reportId: id, dueAt: reportDueAt(scope.now, req.category, priority) });
        return { id, category: req.category, status: 'OPEN', safetyExit: req.safetyExit, blocked, createdAt: scope.now.toISOString() };
      },
    });
  }

  /** Incident sur place : dossier OUTING (sortie) prioritaire, note privée ; personne n'est désigné. */
  private async incident(actorId: string, commandId: string, req: { target: Target; category: string; note?: string | undefined; safetyExit: boolean; alsoBlock: boolean }) {
    if (req.category !== 'ON_SITE_INCIDENT' || req.alsoBlock) throw Errors.validation({ reason: 'TARGET_USER_REQUIRED' });
    const outingId = req.target.outing!.id;
    const venueId = await this.repo.outingOfReporter(actorId, outingId);
    if (venueId === undefined) throw Errors.notFound('Cible');
    return this.bus.execute({
      actorId,
      operation: 'trust.report',
      commandId,
      payload: req,
      handle: async (scope) => {
        const id = this.random.uuid();
        const priority = REPORT_CASE_PRIORITY.ON_SITE_INCIDENT ?? 1;
        const caseId = await this.repo.openCase(scope, { subjectType: 'OUTING', subjectId: outingId, subjectUserId: null, reasonCode: 'REPORT_ON_SITE_INCIDENT', priority, restricted: false, dueAt: reportDueAt(scope.now, 'ON_SITE_INCIDENT', priority) });
        await this.repo.insertIncident(scope, { id, reporterId: actorId, outingId, venueId, note: req.note ?? null, moderationCaseId: caseId });
        return { id, category: 'ON_SITE_INCIDENT', status: 'OPEN', safetyExit: false, blocked: false, createdAt: scope.now.toISOString() };
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
