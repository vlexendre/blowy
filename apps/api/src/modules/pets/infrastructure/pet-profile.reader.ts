import type { PublicPetProfile } from '@blowy/api-contract';
import type { EngineGateway } from '../../../shared/application/ports/engine.gateway.js';
import type { PetProfileReader } from '../../../shared/application/ports/pet-profile.reader.js';
import { toPublicPetProfile } from '../application/pet.serializer.js';
import type { PetTimeService } from '../application/pet-time.service.js';
import type { PetRepository } from '../application/ports/pet.repository.js';

/** Profils publics (pose calculée par le moteur sur l'état avancé, sans persister). */
export class EnginePetProfileReader implements PetProfileReader {
  constructor(
    private readonly repo: PetRepository,
    private readonly time: PetTimeService,
    private readonly engine: EngineGateway,
  ) {}
  async publicProfiles(petIds: string[], at: Date): Promise<Map<string, PublicPetProfile>> {
    const out = new Map<string, PublicPetProfile>();
    for (const id of new Set(petIds)) {
      const p = await this.repo.load(null, id);
      if (!p) continue;
      const { pet, ctx } = await this.time.advance(p, at);
      out.set(id, toPublicPetProfile(pet, this.engine.poseFor(pet.snapshot, at, ctx)));
    }
    return out;
  }
}
