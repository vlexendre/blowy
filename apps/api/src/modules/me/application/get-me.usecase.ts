import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors';
import { PROFILES } from '../../../shared/tokens';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetRecord } from '../../pets/ports';
import type { Profile, ProfilesRepository } from '../ports';

export interface MeResult {
  profile: Profile;
  pet: PetRecord;
}

@Injectable()
export class GetMe {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PetCharacter) private readonly character: PetCharacter,
  ) {}

  async execute(userId: string): Promise<MeResult> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    return { profile, pet: await this.character.load(userId) };
  }
}
