import { Module } from '@nestjs/common';
import { LinksModule } from '../links/links.module';
import { PetsModule } from '../pets/pets.module';
import { VisionModule } from '../vision/vision.module';
import { AnswerEncounter } from './application/answer-encounter.usecase';
import { ListEncounterHistory } from './application/list-encounter-history.usecase';
import { ListEncounters } from './application/list-encounters.usecase';
import { Wave } from './application/wave.usecase';
import { EncountersController } from './interface/encounters.controller';

@Module({
  imports: [PetsModule, LinksModule, VisionModule],
  controllers: [EncountersController],
  providers: [ListEncounters, ListEncounterHistory, Wave, AnswerEncounter],
  exports: [Wave, AnswerEncounter],
})
export class EncountersModule {}
