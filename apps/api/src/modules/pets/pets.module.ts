import { Module } from '@nestjs/common';
import { AnswerChallenge } from './application/answer-challenge.usecase';
import { GetPetView } from './application/get-pet-view.usecase';
import { PetCharacter } from './application/pet-character';
import { RenamePet } from './application/rename-pet.usecase';
import { PetsController } from './interface/pets.controller';

@Module({
  controllers: [PetsController],
  providers: [PetCharacter, GetPetView, RenamePet, AnswerChallenge],
  exports: [PetCharacter],
})
export class PetsModule {}
