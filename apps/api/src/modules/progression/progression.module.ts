import { Module } from '@nestjs/common';
import { ProgressionService } from './application/progression.service';
import { ProgressionController } from './interface/progression.controller';

/** Étincelles, ligue de la semaine et trophées (maquette V7). Lecteur des compteurs : CoreModule (`progressionProviders`). */
@Module({
  controllers: [ProgressionController],
  providers: [ProgressionService],
})
export class ProgressionModule {}
