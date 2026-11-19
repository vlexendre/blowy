import { Inject, Injectable } from '@nestjs/common';
import { rituelsNotificationVars } from '@blowy/content';
import { addDays, dayOf, isSignupDay } from '@blowy/domain';
import { PETS } from '../../../shared/tokens';
import type { DailyPushSource } from '../../notifications/ports';
import type { PetsRepository } from '../../pets/ports';
import { DailyService, dailyDefOf } from './daily.service';
import { ACTIVE_DAYS } from './rituels.jobs';
import { RitualsContext } from './rituals-context';

/**
 * Contenu du push « défi du jour » envoyé par la plateforme à l'heure choisie (port `DAILY_PUSH_SOURCE`).
 * Rien pour une personne qui n'a pas ouvert l'app depuis ACTIVE_DAYS jours (même règle que les autres rappels des
 * rituels), ni le jour de la création du minimoa (`isSignupDay` : la première session sert à découvrir les gens), ni quand
 * le défi est déjà fait ; sinon, le défi du jour (choisi et enregistré s'il ne l'était pas).
 */
@Injectable()
export class RitualsDailyPush implements DailyPushSource {
  constructor(
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(DailyService) private readonly daily: DailyService,
    @Inject(PETS) private readonly pets: PetsRepository,
  ) {}

  async morning(userId: string, now: Date): Promise<Record<string, string> | null> {
    const today = dayOf(now);
    const state = await this.ctx.state(userId);
    if (!state.lastSeenOn || state.lastSeenOn < addDays(today, -ACTIVE_DAYS)) return null;
    const pet = await this.pets.findByOwner(userId);
    if (pet && isSignupDay(dayOf(new Date(pet.createdAt)), today)) return null;
    const rec = await this.daily.ensure(userId, today);
    if (rec.status === 'done') return null;
    return { ...rituelsNotificationVars.dailyChallenge(dailyDefOf(rec)), ...(pet ? { minimoa: pet.name } : {}) };
  }
}
