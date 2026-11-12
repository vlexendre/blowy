import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, PETS, PROFILES } from '../../../shared/tokens';
import { CreateLink } from '../../links/application/create-link.usecase';
import type { LinkRecord } from '../../links/ports';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { livePet } from '../../pets/application/pet-catch-up';
import type { PetRecord, PetsRepository } from '../../pets/ports';

export interface InviteResult {
  profile: Profile;
  pet: PetRecord;
}

const normalize = (code: string): string => code.trim().toUpperCase();

@Injectable()
export class Invites {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(CreateLink) private readonly createLink: CreateLink,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Page publique d'une invitation : le prénom et le pet de la personne qui invite. */
  async get(code: string): Promise<InviteResult> {
    const profile = await this.profiles.findByInviteCode(normalize(code));
    const pet = profile ? await this.pets.findByOwner(profile.id) : null;
    if (!profile || !pet) throw new DomainError('not_found', 'Cette invitation n’existe pas.');
    return { profile, pet: livePet(pet, this.clock.now()) };
  }

  async accept(code: string, userId: string): Promise<LinkRecord> {
    const [owner, me, myPet] = await Promise.all([
      this.profiles.findByInviteCode(normalize(code)),
      this.profiles.findById(userId),
      this.pets.findByOwner(userId),
    ]);
    if (!me || !myPet) throw new DomainError('not_onboarded');
    if (!owner) throw new DomainError('not_found', 'Cette invitation n’existe pas.');
    if (owner.id === userId) throw new DomainError('conflict', 'C’est ton propre code d’invitation.');
    return this.createLink.execute({ by: userId, with: owner.id, notify: owner.id });
  }
}
