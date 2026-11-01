/**
 * Commande pets.create_primary : un pet principal par personne (contrainte unique),
 * espèce premium seulement avec droit valide (P-5.11), état initial issu du moteur.
 */
import type { CreatePrimaryPetRequest } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { EngineGateway } from '../../../shared/application/ports/engine.gateway.js';
import type { EntitlementsReader } from '../../../shared/application/ports/entitlements-reader.port.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { canAdopt, visionToStored } from '../domain/pet.js';
import type { PetRepository } from './ports/pet.repository.js';

export class CreatePrimaryPetUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: PetRepository,
    private readonly engine: EngineGateway,
    private readonly entitlements: EntitlementsReader,
    private readonly random: RandomSource,
  ) {}

  async execute(actorId: string, commandId: string, req: CreatePrimaryPetRequest) {
    return this.bus.execute({
      actorId,
      operation: 'pets.create_primary',
      commandId,
      payload: req,
      handle: async (scope) => {
        await scope.lock.users([actorId]);
        if (await this.repo.findPrimaryOf(actorId)) throw Errors.conflict('PRIMARY_PET_EXISTS');
        const keys = await this.entitlements.activeKeys(actorId, scope.now);
        if (!canAdopt(req.species, keys)) {
          throw new AppError('ENTITLEMENT_REQUIRED', 'Espèce Blowy+ : droit requis', { detailsSafe: { species: req.species, fallback: ['GASTON', 'NINO'] } });
        }
        const id = this.random.uuid();
        await this.repo.create(scope, {
          id,
          ownerId: actorId,
          species: req.species,
          name: req.name,
          vision: visionToStored(req.vision),
          snapshot: this.engine.initialPet(req.species, scope.now),
          rngSeed: this.random.hex(16),
        });
        await scope.outbox.emit({ topic: 'pet.created', aggregateType: 'Pet', aggregateId: id, payload: { ownerId: actorId, species: req.species } });
        return { petId: id };
      },
    });
  }
}
