import { Module } from '@nestjs/common';
import { PetsModule } from '../pets/pets.module';
import { AiConsentsModule } from '../ai-consents/ai-consents.module';
import { DailyService } from './application/daily.service';
import { RitualsDailyPush } from './application/daily-push';
import { HabitsService } from './application/habits.service';
import { OutingService } from './application/outing.service';
import { ReviewsService } from './application/reviews.service';
import { RitualNotifications, RitualsContext } from './application/rituals-context';
import { RituelsJobs } from './application/rituels.jobs';
import { StreakService } from './application/streak.service';
import { TodayService } from './application/today.service';
import { rituelsPorts } from './infrastructure/providers';
import { RituelsController } from './interface/rituels.controller';

/**
 * Rituels (V7) : ce qui fait revenir chaque jour et évoluer le minimoa. Les dépôts sont globaux (CoreModule) ;
 * ce module fournit les cas d'usage, les ports externes (vérification, bilan, images) et les tâches planifiées.
 */
@Module({
  imports: [PetsModule, AiConsentsModule],
  controllers: [RituelsController],
  providers: [
    ...rituelsPorts,
    RitualsContext,
    RitualNotifications,
    StreakService,
    DailyService,
    OutingService,
    HabitsService,
    ReviewsService,
    TodayService,
    RituelsJobs,
    // Texte du push « défi du jour » : repris par Ton chemin (CheminDailyPush, port DAILY_PUSH_SOURCE), qui envoie la
    // séance du jour aux apps qui l'ont et ce texte-ci aux autres.
    RitualsDailyPush,
  ],
  exports: [RituelsJobs, RitualsContext, HabitsService, DailyService, StreakService, ReviewsService, RitualsDailyPush],
})
export class RituelsModule {}
