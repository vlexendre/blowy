/**
 * Export et suppression de compte (§19), retrait de consentement IA (§9.6), recours utilisateur.
 *
 * Export : asynchrone (outbox → worker), données PROPRES de l'auteur uniquement, archive
 * privée (préfixe exports/) servie par lien à durée limitée et nonce révocable. Jamais :
 * vote d'autrui, photo non débloquée, auteur anonyme, message d'autrui (seulement les siens).
 *
 * Suppression : réauthentification implicite (session active), confirmation tapée,
 * révocation IMMÉDIATE (sessions, push, WS, liens, matching), fermeture des relations sans
 * pénalité, annulation des jobs IA, puis purge (médias, contenus, IA) par le job de purge ;
 * anonymisation du compte (statut DELETED, identité effacée) ; échéance sauvegardes documentée.
 */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import type { ObjectStorage } from '../../../shared/application/ports/object-storage.port.js';
import type { TxScope, UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { Errors } from '../../../shared/domain/errors.js';
import type { RelationshipLifecycle } from '../../relationships/application/relationship-lifecycle.service.js';
import type { RelationshipRepository } from '../../relationships/application/ports/relationship.repository.js';
import { BACKUP_ROTATION_DAYS, EXPORT_LINK_TTL_MS } from '../domain/trust-rules.js';
import type { AiInvalidation, TrustRepository } from './ports/trust.repository.js';

export interface PrivacyRepository {
  createExport(scope: TxScope, id: string, userId: string): Promise<void>;
  openExport(userId: string): Promise<{ id: string } | null>;
  loadExport(id: string): Promise<{ id: string; userId: string; status: string; requestedAt: Date; readyAt: Date | null; expiresAt: Date | null; storageKey: string | null; downloadNonce: string | null } | null>;
  listExports(userId: string): Promise<{ id: string; userId: string; status: string; requestedAt: Date; readyAt: Date | null; expiresAt: Date | null; storageKey: string | null; downloadNonce: string | null }[]>;
  setExport(id: string, patch: { status: string; storageKey?: string | null; readyAt?: Date | null; expiresAt?: Date | null; downloadNonce?: string | null; error?: string | null }): Promise<void>;
  /** Données propres de l'utilisateur, filtrées (aucun secret d'autrui). */
  collectOwnData(userId: string): Promise<Record<string, unknown>>;
  createDeletion(scope: TxScope, d: { id: string; userId: string; purgeAfter: Date; backupPurgeAfter: Date }): Promise<void>;
  openDeletion(userId: string): Promise<{ id: string; status: string; requestedAt: Date; purgeAfter: Date | null; backupPurgeAfter: Date | null } | null>;
  /** Révocation immédiate : sessions + push, liens publics/parrainage, matching. */
  revokeAccess(scope: TxScope, userId: string): Promise<void>;
  liveContextIds(scope: TxScope, userId: string): Promise<{ id: string; petIds: string[]; userIds: string[] }[]>;
  dueDeletions(now: Date, limit: number): Promise<{ id: string; userId: string }[]>;
  /** Effacement / anonymisation en ligne ; renvoie les clés de stockage à purger. */
  eraseUser(userId: string, now: Date): Promise<{ storageKeys: string[]; stats: Record<string, number> }>;
  completeDeletion(id: string, now: Date, stats: Record<string, number>): Promise<void>;
  expiredExports(now: Date): Promise<{ id: string; storageKey: string | null }[]>;
}
export const PRIVACY_REPOSITORY = Symbol('PrivacyRepository');

export class RequestExportUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: PrivacyRepository,
    private readonly random: RandomSource,
  ) {}
  async execute(userId: string, commandId: string) {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'privacy.request_export',
      commandId,
      payload: {},
      handle: async (scope) => {
        const open = await this.repo.openExport(userId);
        if (open) return { id: open.id };
        const id = this.random.uuid();
        await this.repo.createExport(scope, id, userId);
        await scope.outbox.emit({ topic: 'privacy.export_requested', aggregateType: 'DataExport', aggregateId: id, payload: { exportId: id } });
        return { id };
      },
    });
    return result;
  }
}

export class BuildExportUseCase {
  constructor(
    private readonly repo: PrivacyRepository,
    private readonly storage: ObjectStorage,
    private readonly clock: Clock,
    private readonly random: RandomSource,
  ) {}
  async execute(exportId: string) {
    const e = await this.repo.loadExport(exportId);
    if (!e || (e.status !== 'REQUESTED' && e.status !== 'FAILED')) return;
    await this.repo.setExport(exportId, { status: 'RUNNING' });
    try {
      const data = await this.repo.collectOwnData(e.userId);
      const now = this.clock.now();
      const key = `exports/${e.userId}/${exportId}.json`;
      await this.storage.put(key, new TextEncoder().encode(JSON.stringify({ exportedAt: now.toISOString(), formatVersion: 'blowy-export-2026.11', ...data }, null, 2)), 'application/json');
      await this.repo.setExport(exportId, { status: 'READY', storageKey: key, readyAt: now, expiresAt: new Date(now.getTime() + EXPORT_LINK_TTL_MS), downloadNonce: this.random.hex(16), error: null });
    } catch (err) {
      await this.repo.setExport(exportId, { status: 'FAILED', error: (err as Error).name });
      throw err;
    }
  }
}

export class RequestDeletionUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: PrivacyRepository,
    private readonly relationships: RelationshipRepository,
    private readonly lifecycle: RelationshipLifecycle,
    private readonly ai: AiInvalidation,
    private readonly random: RandomSource,
  ) {}
  async execute(userId: string, commandId: string) {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'privacy.request_deletion',
      commandId,
      payload: {},
      handle: async (scope) => {
        const open = await this.repo.openDeletion(userId);
        if (open) return { id: open.id };
        const contexts = await this.repo.liveContextIds(scope, userId);
        await scope.lock.users([...new Set([userId, ...contexts.flatMap((c) => c.userIds)])]);
        await scope.lock.pets(contexts.flatMap((c) => c.petIds));
        await scope.lock.relationships(contexts.map((c) => c.id));
        // Fermeture sans message de départ ni pénalité (ACCOUNT_DELETED).
        for (const c of contexts) {
          const ctx = await this.relationships.load(scope, c.id);
          if (ctx && ctx.status !== 'ENDED') await this.lifecycle.end(scope, ctx, 'ACCOUNT_DELETED', userId);
        }
        await this.repo.revokeAccess(scope, userId);
        await this.ai.cancelForUser(scope, userId, 'ACCOUNT_DELETED');
        await this.ai.cancelForContexts(scope, contexts.map((c) => c.id), 'ACCOUNT_DELETED');
        const id = this.random.uuid();
        await this.repo.createDeletion(scope, { id, userId, purgeAfter: scope.now, backupPurgeAfter: new Date(scope.now.getTime() + BACKUP_ROTATION_DAYS * 86_400_000) });
        await scope.outbox.emit({ topic: 'realtime.disconnect', aggregateType: 'User', aggregateId: userId, payload: {} });
        await scope.outbox.emit({ topic: 'privacy.deletion_requested', aggregateType: 'User', aggregateId: userId, payload: { deletionId: id } });
        return { id };
      },
    });
    return result;
  }
}

/** Job de purge (worker) : effacement / anonymisation + suppression des objets stockés. */
export class PurgeDeletedAccountsJob {
  constructor(
    private readonly repo: PrivacyRepository,
    private readonly storage: ObjectStorage,
  ) {}
  async run(now: Date) {
    let n = 0;
    for (const d of await this.repo.dueDeletions(now, 20)) {
      const { storageKeys, stats } = await this.repo.eraseUser(d.userId, now);
      for (const k of storageKeys) await this.storage.delete(k);
      await this.storage.deletePrefix(`exports/${d.userId}/`);
      await this.repo.completeDeletion(d.id, now, { ...stats, objects: storageKeys.length });
      n++;
    }
    for (const e of await this.repo.expiredExports(now)) {
      if (e.storageKey) await this.storage.delete(e.storageKey);
      await this.repo.setExport(e.id, { status: 'EXPIRED', storageKey: null, downloadNonce: null });
    }
    return { deletions: n };
  }
}

/** Retrait de consentement IA (§9.6) : annulation des jobs, invalidation des caches et dérivés. */
export class ConsentWithdrawnHandler {
  constructor(private readonly ai: AiInvalidation) {}
  async handle(scope: TxScope, userId: string, purposes: string[]) {
    if (purposes.includes('AI_SUGGESTIONS')) {
      await this.ai.cancelForUser(scope, userId, 'CONSENT_WITHDRAWN', ['suggestions']);
      await this.ai.invalidateSuggestionsForUser(scope, userId);
    }
    if (purposes.includes('AI_NARRATION')) {
      await this.ai.cancelForUser(scope, userId, 'CONSENT_WITHDRAWN', ['signals', 'narration']);
      await this.ai.deleteSignalsForUser(scope, userId);
    }
    if (purposes.includes('AI_MODERATION')) {
      // Le flux social s'arrête (send_message refuse) ; tâches en attente annulées, contenus non envoyés.
      await this.ai.cancelForUser(scope, userId, 'CONSENT_WITHDRAWN');
    }
  }
}

export class CreateAppealUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: TrustRepository,
  ) {}
  async execute(userId: string, commandId: string, req: { subjectType: 'MESSAGE' | 'MEDIA' | 'MISSION_SUBMISSION'; subjectId: string }) {
    const owner = req.subjectType === 'MESSAGE' ? (await this.repo.messageAuthor(req.subjectId))?.authorUserId : req.subjectType === 'MEDIA' ? await this.repo.mediaOwner(req.subjectId) : await this.repo.proofOwner(req.subjectId);
    if (owner !== userId) throw Errors.notFound('Contenu');
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'trust.appeal',
      commandId,
      payload: req,
      handle: async (scope) => {
        const decisions = await this.repo.decisionsFor(req.subjectType, req.subjectId);
        if (!decisions.some((d) => d.action !== 'ALLOW')) throw Errors.precondition('NOTHING_TO_APPEAL');
        const existing = await this.repo.findOpenCase(scope, req.subjectType, req.subjectId);
        const caseId = existing?.id ?? (await this.repo.openCase(scope, { subjectType: req.subjectType, subjectId: req.subjectId, subjectUserId: userId, reasonCode: 'APPEAL', priority: 2, restricted: false, dueAt: new Date(scope.now.getTime() + 24 * 3_600_000) }));
        const a = await this.repo.createAppeal(scope, caseId, userId);
        return { id: a.id, status: 'OPEN', createdAt: scope.now.toISOString() };
      },
    });
    return result;
  }
}

export { EXPORT_LINK_TTL_MS };
export type { UnitOfWork };
