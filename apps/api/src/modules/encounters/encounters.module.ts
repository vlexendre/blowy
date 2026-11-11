import { Module } from '@nestjs/common';
import { LinksModule } from '../links/links.module';
import { PetsModule } from '../pets/pets.module';
import { AnswerEncounter } from './application/answer-encounter.usecase';
import { ListEncounters } from './application/list-encounters.usecase';
import { Wave } from './application/wave.usecase';
import { EncountersController } from './interface/encounters.controller';

@Module({
  imports: [PetsModule, LinksModule],
  controllers: [EncountersController],
  providers: [ListEncounters, Wave, AnswerEncounter],
  exports: [Wave],
})
export class EncountersModule {}
