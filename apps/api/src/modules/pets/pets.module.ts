import { Module } from '@nestjs/common';
import { CarePet } from './application/care-pet.usecase';
import { GetPetView } from './application/get-pet-view.usecase';
import { PetCharacter } from './application/pet-character';
import { RenamePet } from './application/rename-pet.usecase';
import { SetOutfit } from './application/set-outfit.usecase';
import { Wardrobe } from './application/wardrobe';
import { WardrobeJobs } from './application/wardrobe.jobs';
import { PetsController } from './interface/pets.controller';

@Module({
  controllers: [PetsController],
  providers: [PetCharacter, Wardrobe, WardrobeJobs, GetPetView, RenamePet, CarePet, SetOutfit],
  exports: [PetCharacter, Wardrobe, WardrobeJobs, CarePet, SetOutfit],
})
export class PetsModule {}
