import { Inject, Injectable } from '@nestjs/common';
import { careLabel } from '@blowy/content';
import { CARE_EFFECTS, type CareAction, applyCare, canCare, dayOf } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, PETS } from '../../../shared/tokens';
import type { PetsRepository } from '../ports';
import { PetCharacter } from './pet-character';

/**
 * S'occuper de son pet : le geste comble un besoin (refusé s'il est déjà comblé), fait bouger le caractère
 * (événement `care_*`) et compte un jour de soin, une seule fois par jour.
 */
@Injectable()
export class CarePet {
  constructor(
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(ownerId: string, action: CareAction): Promise<void> {
    const pet = await this.character.load(ownerId);
    if (!canCare(pet.needs, action)) throw new DomainError('already_done', careLabel[action]?.refused);
    const now = this.clock.now();
    const today = dayOf(now);
    await this.pets.saveNeeds(pet.id, applyCare(pet.needs, action), now.toISOString());
    if (pet.lastCareOn !== today) await this.pets.save({ ...pet, careDays: pet.careDays + 1, lastCareOn: today });
    await this.character.apply(ownerId, CARE_EFFECTS[action].event);
  }
}
