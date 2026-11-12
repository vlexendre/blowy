import { Module } from '@nestjs/common';
import { AnswerChallenge } from './application/answer-challenge.usecase';
import { CarePet } from './application/care-pet.usecase';
import { GetPetView } from './application/get-pet-view.usecase';
import { PetCharacter } from './application/pet-character';
import { RenamePet } from './application/rename-pet.usecase';
import { SetOutfit } from './application/set-outfit.usecase';
import { Wardrobe } from './application/wardrobe';
import { PetsController } from './interface/pets.controller';

@Module({
  controllers: [PetsController],
  providers: [PetCharacter, Wardrobe, GetPetView, RenamePet, AnswerChallenge, CarePet, SetOutfit],
  exports: [PetCharacter, Wardrobe],
})
export class PetsModule {}
