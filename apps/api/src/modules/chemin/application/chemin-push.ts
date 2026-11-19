import { Inject, Injectable } from '@nestjs/common';
import { addDays, dayOf, isSignupDay } from '@blowy/domain';
import type { Env } from '../../../config/env';
import { buildHasChemin } from '../../../shared/chemin-build';
import { ENV, PETS } from '../../../shared/tokens';
import type { DailyPushSource } from '../../notifications/ports';
import type { PetsRepository } from '../../pets/ports';
import { RitualsDailyPush } from '../../rituels/application/daily-push';
import { ACTIVE_DAYS } from '../../rituels/application/rituels.jobs';
import { RitualsContext } from '../../rituels/application/rituals-context';
import type { CheminProgressRepository, CheminSessionsRepository } from '../ports';
import { CHEMIN_PROGRESS, CHEMIN_SESSIONS } from '../tokens';

/**
 * Le rappel du matin (port `DAILY_PUSH_SOURCE`, envoyé par la plateforme à l'heure choisie, avec ses plafonds, ses
 * heures calmes et ses regroupements : docs/NOTIFICATIONS.md). Pour une personne dont la dernière app vue sur Ton
 * chemin l'a (build ≥ `APP_<PLATEFORME>_CHEMIN_BUILD`) : « Ta séance du jour t'attend (2 min) », vers `blowy://chemin`,
 * rien si la séance du jour est faite. Sinon : le défi du jour, comme avant (`RitualsDailyPush`).
 * Mêmes garde-fous : personne inactive depuis ACTIVE_DAYS jours ou jour de création du minimoa → rien.
 */
@Injectable()
export class CheminDailyPush implements DailyPushSource {
  constructor(
    @Inject(RitualsDailyPush) private readonly rituals: RitualsDailyPush,
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(CHEMIN_PROGRESS) private readonly progress: CheminProgressRepository,
    @Inject(CHEMIN_SESSIONS) private readonly sessions: CheminSessionsRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async morning(userId: string, now: Date): Promise<Record<string, string> | null> {
    const progress = await this.progress.find(userId);
    if (!progress || !buildHasChemin(this.env.appVersions, progress.lastPlatform, progress.lastBuild)) return this.rituals.morning(userId, now);
    const today = dayOf(now);
    const state = await this.ctx.state(userId);
    if (!state.lastSeenOn || state.lastSeenOn < addDays(today, -ACTIVE_DAYS)) return null;
    const pet = await this.pets.findByOwner(userId);
    if (pet && isSignupDay(dayOf(new Date(pet.createdAt)), today)) return null;
    const done = (await this.sessions.listForDay(userId, today)).some((s) => s.slot === 0 && s.status === 'done');
    if (done) return null;
    return { step: 'chemin', ...(pet ? { minimoa: pet.name } : {}) };
  }
}
