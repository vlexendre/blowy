/**
 * Commande relationships.pause : délègue au use case de pause utilisateur (quota ≤14 j)
 * avec la relation ciblée — aucune duplication de la règle de pause.
 */
import type { StartPauseUseCase } from '../../users/application/pause.use-case.js';

export class PauseRelationshipUseCase {
  constructor(private readonly startPause: StartPauseUseCase) {}
  execute(actorId: string, contextId: string, commandId: string, days: number) {
    return this.startPause.execute(actorId, commandId, { relationshipId: contextId, days });
  }
}
