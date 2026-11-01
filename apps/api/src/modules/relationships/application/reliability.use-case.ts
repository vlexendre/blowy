/**
 * Job horaire fiabilité / ghosting (§7) :
 *  - -8 après 72 h admissibles sans réponse à un message humain publié qui attend réponse,
 *    UNE fois par épisode (unique (userId, reason, episodeKey) — l'épisode = id du message) ;
 *  - aucune pénalité si personne n'attend de réponse (pas de dette) ;
 *  - pause d'un côté : délais suspendus (épisode ignoré pendant la pause, pas de rattrapage) ;
 *  - blocage / départ / sécurité : la dette est annulée à la clôture (lifecycle).
 *  - silence 14 j : clôture unique de la relation.
 */
import type { EngineGateway } from '../../../shared/application/ports/engine.gateway.js';
import type { TxScope, UnitOfWork } from '../../../shared/application/unit-of-work.js';
import type { RelationshipLifecycle } from './relationship-lifecycle.service.js';
import type { RelationshipRepository } from './ports/relationship.repository.js';

export interface ReliabilityLedger {
  /** Applique le delta si (userId, reason, episodeKey) n'existe pas ; borne [0,100]. Renvoie true si appliqué. */
  penalizeOnce(scope: TxScope, input: { userId: string; contextId: string; delta: number; episodeKey: string }): Promise<boolean>;
}
export const RELIABILITY_LEDGER = Symbol('ReliabilityLedger');

const HOUR = 3_600_000;

export class ReliabilityJob {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly repo: RelationshipRepository,
    private readonly ledger: ReliabilityLedger,
    private readonly lifecycle: RelationshipLifecycle,
    private readonly engine: EngineGateway,
  ) {}

  async run(now: Date): Promise<{ penalized: number; closed: number }> {
    const p = this.engine.params;
    const debtors = await this.repo.replyDebtors(new Date(now.getTime() - p.reliabilityGhostingAfterHours * HOUR), 500);
    let penalized = 0;
    for (const d of debtors) {
      await this.uow.run(async (scope) => {
        await scope.lock.users([d.userId]);
        await scope.lock.relationships([d.contextId]);
        const ctx = await this.repo.load(scope, d.contextId);
        if (!ctx || ctx.status === 'ENDED') return;
        const side = ctx.sides.find((s) => s.userId === d.userId);
        if (!side?.replyOwedSince || side.replyOwedEpisode !== d.episode) return;
        const paused = await this.repo.isPausedFor(scope, ctx.id, ctx.sides.map((s) => s.userId), scope.now);
        if (paused.any) return;
        if (await this.ledger.penalizeOnce(scope, { userId: d.userId, contextId: ctx.id, delta: -p.reliabilityGhostingPenalty, episodeKey: `ghost:${d.episode}` })) penalized++;
      });
    }
    let closed = 0;
    for (const id of await this.repo.silentContexts(new Date(now.getTime() - p.silenceCloseDays * 24 * HOUR), 200)) {
      await this.uow.run(async (scope) => {
        const pre = await this.repo.load(scope, id);
        if (!pre || pre.status === 'ENDED') return;
        await scope.lock.users(pre.sides.map((s) => s.userId));
        await scope.lock.pets(pre.sides.map((s) => s.petId));
        await scope.lock.relationships([id]);
        const ctx = (await this.repo.load(scope, id))!;
        const paused = await this.repo.isPausedFor(scope, id, ctx.sides.map((s) => s.userId), scope.now);
        if (paused.any || ctx.status === 'ENDED') return;
        await this.lifecycle.end(scope, ctx, 'SILENCE_14D', null);
        closed++;
      });
    }
    return { penalized, closed };
  }
}
