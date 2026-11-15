/**
 * Travail planifié de la modération (`modules/tick/jobs.ts`), idempotent :
 * - récapitulatif des nouveaux signalements à l'équipe (au plus toutes les 15 min ; l'urgent est déjà parti) ;
 * - signalements ouverts depuis plus de 24 h : remontés en priorité haute, annoncés une fois ;
 * - une fois par heure, au plus 20 photos de profil pas encore vérifiées (IA indisponible à l'envoi, ou d'avant le
 *   filtre), dans les budgets de la passerelle ; si elle refuse, on s'arrête jusqu'à l'heure suivante.
 */
import { Inject, Injectable } from '@nestjs/common';
import { PROFILES } from '../../shared/tokens';
import type { ProfilesRepository } from '../me/ports';
import { AvatarModeration } from './avatar-moderation';
import { ReportAlerts } from './report-alerts';

const AVATARS_PER_HOUR = 20;

@Injectable()
export class ModerationJobs {
  constructor(
    @Inject(ReportAlerts) private readonly alerts: ReportAlerts,
    @Inject(AvatarModeration) private readonly avatars: AvatarModeration,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
  ) {}

  async runDue(now: Date, deadline?: number): Promise<number> {
    let done = await this.alerts.flush(now);
    done += await this.alerts.escalate(now);
    // Un créneau de 5 minutes par heure (le minuteur passe toutes les 5 minutes).
    if (now.getUTCMinutes() < 5) {
      for (const p of await this.profiles.listUncheckedAvatars(AVATARS_PER_HOUR)) {
        if (deadline !== undefined && Date.now() >= deadline) break;
        if (!p.avatarPath) continue;
        if ((await this.avatars.review(p, p.avatarPath)) === 'unchecked') break;
        done += 1;
      }
    }
    return done;
  }
}
