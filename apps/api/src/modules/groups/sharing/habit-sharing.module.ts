import { Module } from '@nestjs/common';
import { HabitSharing } from './habit-sharing';

/**
 * Habitudes partagées et rigueur (spéc §25), sans autre dépendance que les dépôts globaux et `Audience` : importé par
 * les liens, les rencontres, les rituels et les groupes sans créer de cycle entre modules.
 */
@Module({ providers: [HabitSharing], exports: [HabitSharing] })
export class HabitSharingModule {}
