import { Module } from '@nestjs/common';
import { EncountersModule } from '../encounters/encounters.module';
import { DAILY_PUSH_SOURCE } from '../notifications/ports';
import { RituelsModule } from '../rituels/rituels.module';
import { CheminAdmin } from './application/chemin-admin';
import { CheminContentService } from './application/chemin-content';
import { CheminDailyPush } from './application/chemin-push';
import { CheminSeedOnBoot } from './application/chemin-seed-on-boot';
import { CheminService } from './application/chemin.service';
import { ProfilService } from './application/profil.service';
import { CheminAdminController } from './interface/chemin-admin.controller';
import { CheminController } from './interface/chemin.controller';

/**
 * Ton chemin (docs/CHEMIN.md) : chaque jour 5 questions, puis une personne près de chez toi qui a répondu comme toi.
 * Les dépôts sont globaux (CoreModule) ; ce module fournit les cas d'usage, l'administration et le rappel du matin
 * (port `DAILY_PUSH_SOURCE` : séance du jour pour les apps qui ont Ton chemin, défi du jour sinon).
 */
@Module({
  imports: [RituelsModule, EncountersModule],
  controllers: [CheminController, CheminAdminController],
  providers: [CheminSeedOnBoot, CheminContentService, CheminService, ProfilService, CheminAdmin, CheminDailyPush, { provide: DAILY_PUSH_SOURCE, useExisting: CheminDailyPush }],
  exports: [CheminService],
})
export class CheminModule {}
