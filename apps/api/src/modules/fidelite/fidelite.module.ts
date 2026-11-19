import { Module } from '@nestjs/common';
import { EncountersModule } from '../encounters/encounters.module';
import { CatchUp } from './application/catch-up';
import { FideliteJobs } from './application/fidelite.jobs';

/**
 * Fidélisation (docs/FIDELISATION.md) : premiers pas, nouvelles du minimoa pendant une absence, anniversaires.
 * Journal des messages et lecture des personnes (`fideliteProviders`) : fournis par CoreModule, car Minimoa+ s'en sert
 * aussi (bienvenue, paiement refusé, au revoir, relance : `modules/billing/application/plus-news.ts`).
 */
@Module({
  // Rencontres : le premier pas « les gens » dit s'il y a vraiment quelqu'un (`ListEncounters.waiting`).
  imports: [EncountersModule],
  providers: [CatchUp, FideliteJobs],
  exports: [FideliteJobs],
})
export class FideliteModule {}
