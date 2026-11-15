import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors';
import { PROFILES } from '../../../shared/tokens';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetRecord } from '../../pets/ports';
import type { PlaceRecord, PlacesRepository } from '../../vision/ports';
import { PLACES } from '../../vision/tokens';
import type { Profile, ProfilesRepository } from '../ports';

export interface MeResult {
  profile: Profile;
  pet: PetRecord;
  /** Position (vision) : null sans accord. */
  place: PlaceRecord | null;
}

@Injectable()
export class GetMe {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(PLACES) private readonly places: PlacesRepository,
  ) {}

  async execute(userId: string): Promise<MeResult> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    const [pet, place] = await Promise.all([this.character.load(userId), this.places.find(userId)]);
    return { profile, pet, place };
  }
}
