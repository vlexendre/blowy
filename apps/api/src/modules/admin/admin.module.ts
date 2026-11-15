import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { DeleteMe } from '../me/application/delete-me.usecase';
import { AdminDemo } from './application/admin-demo';
import { AiCosts, Dashboards } from './application/dashboards.usecases';
import { Moderation } from './application/moderation.usecases';
import { AdminStatsJobs } from './application/stats.jobs';
import { LiveAdminInsights } from './application/live-insights';
import { AdminController } from './interface/admin.controller';
import { AdminGuard } from './interface/admin.guard';
import { ADMIN_INSIGHTS } from './tokens';

/**
 * Administration (`/admin/*`) : tableaux de bord lus dans les statistiques quotidiennes, modération, coûts IA.
 * Dépôts et garde de compte : fournis par CoreModule (`adminProviders`), car la garde d'authentification
 * globale en a besoin. `DeleteMe` est le cas d'usage de « Supprimer mon compte », réutilisé tel quel.
 *
 * `ADMIN_INSIGHTS` : `LiveAdminInsights` (série moyenne, propositions, compatibilité, formes, visions), lu une
 * fois par jour terminé par `AdminStatsJobs`.
 */
@Module({})
export class AdminModule {
  static forRoot(options: { demo: boolean }): DynamicModule {
    const providers: Provider[] = [
      { provide: ADMIN_INSIGHTS, useClass: LiveAdminInsights },
      AdminGuard,
      Dashboards,
      AiCosts,
      Moderation,
      DeleteMe,
      AdminStatsJobs,
      ...(options.demo ? [AdminDemo] : []),
    ];
    return { module: AdminModule, controllers: [AdminController], providers, exports: [AdminStatsJobs, Moderation] };
  }
}
