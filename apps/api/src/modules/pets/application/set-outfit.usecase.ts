import { Inject, Injectable } from '@nestjs/common';
import { ITEM_SLOTS, type Outfit, cleanOutfit } from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import { PETS } from '../../../shared/tokens';
import type { PetsRepository } from '../ports';
import { Wardrobe } from './wardrobe';

/** Habiller son pet : seulement avec des objets possédés, chacun dans son emplacement ; sinon rien ne change. */
@Injectable()
export class SetOutfit {
  constructor(
    @Inject(Wardrobe) private readonly wardrobe: Wardrobe,
    @Inject(PETS) private readonly pets: PetsRepository,
  ) {}

  async execute(ownerId: string, outfit: Outfit): Promise<void> {
    const { pet, owned } = await this.wardrobe.state(ownerId);
    const clean = cleanOutfit(outfit, owned);
    if (ITEM_SLOTS.some((slot) => clean[slot] !== outfit[slot])) throw new DomainError('forbidden', 'cet objet n’est pas encore à toi.');
    await this.pets.save({ ...pet, outfit: clean });
  }
}
