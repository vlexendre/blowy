import type { ReconcileScheduler } from '../application/ports/billing-provider.port.js';
import type { Logger } from '../../../shared/infrastructure/logging/logger.js';

/**
 * Réconciliation asynchrone après commit (hors réponse webhook). Coalescence par utilisateur.
 * Best-effort : si le processus s'arrête, le job périodique reprend les abonnements
 * dont `lastProviderEventAt > lastReconciledAt` (aucune perte d'autorité).
 */
export class InProcessReconcileScheduler implements ReconcileScheduler {
  private readonly pending = new Set<string>();
  constructor(
    private readonly run: (userId: string) => Promise<unknown>,
    private readonly logger: Pick<Logger, 'warn'>,
  ) {}

  schedule(userId: string): void {
    if (this.pending.has(userId)) return;
    this.pending.add(userId);
    setImmediate(() => {
      this.run(userId)
        .catch((err: unknown) => this.logger.warn({ err: (err as Error).message }, 'economy_reconcile_deferred_failed'))
        .finally(() => this.pending.delete(userId));
    });
  }
}

/** Tests / worker sans réconciliation immédiate : rien n'est planifié (le job périodique suffit). */
export class NoopReconcileScheduler implements ReconcileScheduler {
  readonly scheduled: string[] = [];
  schedule(userId: string): void {
    this.scheduled.push(userId);
  }
}
