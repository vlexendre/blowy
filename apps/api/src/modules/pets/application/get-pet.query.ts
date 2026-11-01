/** Lecture d'un pet : vue propriétaire (avancée paresseusement) ou profil public si relation partagée. */
import type { OwnPetView, PublicPetProfile } from '@blowy/api-contract';
import type { Clock } from '../../../shared/application/clock.js';
import type { EngineGateway } from '../../../shared/application/ports/engine.gateway.js';
import type { ParticipationReader } from '../../../shared/application/ports/participation.reader.js';
import { Errors } from '../../../shared/domain/errors.js';
import { toOwnPetView, toPublicPetProfile } from './pet.serializer.js';
import type { PetTimeService } from './pet-time.service.js';
import type { PetRepository } from './ports/pet.repository.js';

export class GetPetQuery {
  constructor(
    private readonly repo: PetRepository,
    private readonly time: PetTimeService,
    private readonly engine: EngineGateway,
    private readonly participation: ParticipationReader,
    private readonly clock: Clock,
  ) {}

  async mine(userId: string): Promise<OwnPetView> {
    const id = await this.repo.findPrimaryOf(userId);
    if (!id) throw Errors.notFound('Pet');
    return this.own(userId, id) as Promise<OwnPetView>;
  }

  async own(userId: string, petId: string): Promise<OwnPetView | PublicPetProfile> {
    const p = await this.repo.load(null, petId);
    // IDOR : même réponse « introuvable » si le pet existe mais n'est pas accessible.
    if (!p) throw Errors.notFound('Pet');
    const now = this.clock.now();
    const { pet, ctx } = await this.time.advance(p, now);
    const pose = this.engine.poseFor(pet.snapshot, now, ctx);
    if (pet.ownerIds.includes(userId)) return toOwnPetView(pet, pose);
    if (await this.participation.sharesRelationshipWithPet(userId, petId)) return toPublicPetProfile(pet, pose);
    throw Errors.notFound('Pet');
  }
}
