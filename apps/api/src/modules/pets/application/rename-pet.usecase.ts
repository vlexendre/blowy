import { Inject, Injectable } from '@nestjs/common';
import { cleanPetName, dayOf } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import { CLOCK, PETS, PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import type { PetsRepository } from '../ports';
import { PetCharacter } from './pet-character';
import { ContentFilter } from '../../moderation/content-filter';
import { frenchDay, renameStateOf } from './rename-state';

/**
 * Changer le nom de son pet : une fois tous les 60 jours (`renameRule`), sans attente avec Blowy+.
 * Le nom donné à la création ne compte pas ; redonner le même nom ne compte pas non plus.
 */
@Injectable()
export class RenamePet {
  constructor(
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ContentFilter) private readonly filter: ContentFilter,
  ) {}

  async execute(ownerId: string, rawName: string): Promise<void> {
    const name = cleanPetName(rawName);
    if (name.length === 0) throw new DomainError('invalid', errorText('petNameEmpty'));
    const [pet, profile] = await Promise.all([this.character.load(ownerId), this.profiles.findById(ownerId)]);
    if (name === pet.name) return;
    this.filter.checkName('pet_name', name, profile?.locale ?? 'fr');
    const now = this.clock.now();
    const rule = renameStateOf(pet, profile, now);
    if (!rule.allowed && rule.availableOn) {
      const on = rule.availableOn;
      throw new DomainError('rename_locked', (l) => errorText('renameLocked', pet.name, frenchDay(on, dayOf(now), l))(l));
    }
    await this.pets.save({ ...pet, name, renamedAt: now.toISOString() });
  }
}
