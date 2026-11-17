import { Module } from '@nestjs/common';
import { AdminGuard } from '../admin/interface/admin.guard';
import { GrowthAdmin } from './application/growth-admin';
import { AdminGrowthController, GrowthController } from './interface/growth.controller';

/**
 * Croissance (docs/VIRALITE.md) : routes publiques et administration. `Growth` et `Codes` et leurs dépôts sont globaux
 * (CoreModule, `growthProviders`) : d'autres modules notent les étapes.
 */
@Module({
  controllers: [GrowthController, AdminGrowthController],
  providers: [GrowthAdmin, AdminGuard],
})
export class GrowthModule {}
