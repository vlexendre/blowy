import { Module } from '@nestjs/common';
import { AdminGuard } from '../admin/interface/admin.guard';
import { QuartierJobs } from './application/quartier.jobs';
import { Quartiers } from './application/quartiers';
import { Quiz } from './application/quiz';
import { AdminQuartiersController, QuartiersController } from './interface/quartiers.controller';

/**
 * « Quel minimoa es-tu ? » et « Ouvre ton quartier » (docs/VIRALITE.md). Les dépôts sont globaux (CoreModule,
 * `quartierRepositories`) : les codes, l'inscription et la garde-robe les lisent.
 */
@Module({
  controllers: [QuartiersController, AdminQuartiersController],
  providers: [Quiz, Quartiers, QuartierJobs, AdminGuard],
  exports: [QuartierJobs],
})
export class QuartiersModule {}
