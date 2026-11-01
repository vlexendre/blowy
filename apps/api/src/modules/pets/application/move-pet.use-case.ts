/**
 * Commande dédiée pets.move (déplacement voulu par l'utilisateur, dédupliqué par commandId).
 * Lire une conversation ne déplace jamais le pet. Lieu unique (PK petId).
 * Après emménagement : maison commune (SHARED_HOME), le lieu attitré n'est plus utilisé.
 */
import type { MovePetRequest } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { ParticipationReader } from '../../../shared/application/ports/participation.reader.js';
import { Errors } from '../../../shared/domain/errors.js';
import type { PetRepository } from './ports/pet.repository.js';

export class MovePetUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: PetRepository,
    private readonly participation: ParticipationReader,
  ) {}

  async execute(actorId: string, petId: string, commandId: string, req: MovePetRequest) {
    let kind: 'HOME' | 'DATE_SPOT' | 'SHARED_HOME' = 'HOME';
    let contextId: string | null = null;
    if (req.destination === 'DATE_SPOT') {
      if (!req.relationshipId) throw Errors.validation({ field: 'relationshipId' });
      const part = await this.participation.get(actorId, req.relationshipId);
      if (!part || part.myPetId !== petId || part.status === 'ENDED') throw Errors.notFound('Relation');
      kind = part.status === 'MOVED_IN' ? 'SHARED_HOME' : 'DATE_SPOT';
      contextId = req.relationshipId;
    }
    return this.bus.execute({
      actorId,
      operation: 'pets.move',
      commandId,
      payload: { petId, ...req },
      handle: async (scope) => {
        await scope.lock.users([actorId]);
        await scope.lock.pets([petId]);
        const pet = await this.repo.load(scope, petId);
        if (!pet || !pet.ownerIds.includes(actorId)) throw Errors.notFound('Pet');
        if (pet.location.kind === 'SHARED_HOME' && kind === 'HOME') throw Errors.precondition('LIVES_IN_SHARED_HOME');
        const changed = pet.location.kind !== kind || pet.location.contextId !== contextId;
        if (changed) {
          await this.repo.moveTo(scope, petId, kind, contextId);
          await scope.outbox.emit({
            topic: 'pet.moved',
            aggregateType: 'Pet',
            aggregateId: petId,
            payload: { ownerIds: pet.ownerIds, fromContextId: pet.location.contextId, toContextId: contextId },
          });
        }
        return { kind, relationshipId: contextId, changed };
      },
    });
  }
}
