import { Module } from '@nestjs/common';
import { DeleteMe } from '../me/application/delete-me.usecase';
import { RetentionJobs } from './application/retention.jobs';

/**
 * Conservation des données (politique de confidentialité) : tâche planifiée des comptes inactifs et des purges.
 * Dépôt et exclusions (`retentionProviders`) : fournis par CoreModule, car la garde de compte, l'inscription et la
 * modération s'en servent.
 */
@Module({
  providers: [DeleteMe, RetentionJobs],
  exports: [RetentionJobs],
})
export class RetentionModule {}
