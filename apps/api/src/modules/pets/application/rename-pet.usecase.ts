import { Inject, Injectable } from '@nestjs/common';
import { cleanPetName } from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import { PETS } from '../../../shared/tokens';
import type { PetsRepository } from '../ports';
import { PetCharacter } from './pet-character';

@Injectable()
export class RenamePet {
  constructor(
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(PETS) private readonly pets: PetsRepository,
  ) {}

  async execute(ownerId: string, rawName: string): Promise<void> {
    const name = cleanPetName(rawName);
    if (name.length === 0) throw new DomainError('invalid', 'Donne un nom à ton pet.');
    const pet = await this.character.load(ownerId);
    await this.pets.save({ ...pet, name });
  }
}
