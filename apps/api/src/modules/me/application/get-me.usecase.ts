import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors';
import { PROFILES } from '../../../shared/tokens';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetRecord } from '../../pets/ports';
import type { PlaceRecord, PlacesRepository, VisionStore } from '../../vision/ports';
import { PLACES, VISION_STORE } from '../../vision/tokens';
import type { Profile, ProfilesRepository } from '../ports';

export interface MeResult {
  profile: Profile;
  pet: PetRecord;
  /** Position (vision) : null sans accord. */
  place: PlaceRecord | null;
  /** Test de vision passé (sinon : pas de suggestions, l'app envoie au test). */
  visionTestDone: boolean;
}

@Injectable()
export class GetMe {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(PLACES) private readonly places: PlacesRepository,
    @Inject(VISION_STORE) private readonly vision: VisionStore,
  ) {}

  async execute(userId: string): Promise<MeResult> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    const [pet, place, snapshot] = await Promise.all([this.character.load(userId), this.places.find(userId), this.vision.findSnapshot(userId)]);
    return { profile, pet, place, visionTestDone: snapshot?.testDone ?? false };
  }
}
