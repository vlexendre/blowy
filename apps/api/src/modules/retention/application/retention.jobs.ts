import { Inject, Injectable, Logger } from '@nestjs/common';
import { moderationTextIn } from '@blowy/content';
import {
  INACTIVITY_NOTICE_DAYS,
  MODERATION_KEEP_DAYS,
  TECHNICAL_LOG_DAYS,
  addDays,
  dayOf,
  deletionCutoff,
  inactivityDeletionDay,
  inactivityStep,
  noticeCutoff,
} from '@blowy/domain';
import { Notifier as MailNotifier } from '../../../integrations/mailer/notifier';
import { PROFILES } from '../../../shared/tokens';
import { ENCOUNTER_PROPOSALS, type ProposalsRepository } from '../../encounters/ports';
import { DeleteMe } from '../../me/application/delete-me.usecase';
import type { ProfilesRepository } from '../../me/ports';
import type { TickJob } from '../../tick/tick-job';
import { RETENTION, type RetentionRepository } from '../ports';

const BATCH = 100;
const DAY_MS = 86_400_000;

/**
 * Conservation des données, appelée par le minuteur (`modules/tick/jobs.ts`) :
 * 1. comptes sans connexion depuis 2 ans moins 30 jours : e-mail de prévenance (une fois) ;
 * 2. comptes sans connexion depuis 2 ans, prévenus depuis 30 jours au moins : supprimés par `DeleteMe`
 *    (le même chemin que « Supprimer mon compte ») ;
 * 3. exclusions de plus de 3 ans, signalements clos et décisions de modération de plus d'un an, rencontres
 *    proposées de plus de 30 jours : effacés.
 * Idempotent : un compte prévenu sort de la liste des prévenances ; un compte supprimé n'existe plus.
 * Les journaux techniques (notifications, reçus, minuteur, notifications des magasins) sont purgés par leurs
 * propres tâches, en 30 jours au plus.
 */
@Injectable()
export class RetentionJobs implements TickJob {
  private readonly logger = new Logger('Conservation');

  constructor(
    @Inject(RETENTION) private readonly repo: RetentionRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(MailNotifier) private readonly mail: MailNotifier,
    @Inject(DeleteMe) private readonly deleteMe: DeleteMe,
    @Inject(ENCOUNTER_PROPOSALS) private readonly proposals: ProposalsRepository,
  ) {}

  async runDue(now: Date, deadline: number = Date.now() + 20_000): Promise<number> {
    const today = dayOf(now);
    const over = (): boolean => Date.now() >= deadline;
    let done = 0;

    // 1. Prévenances.
    while (!over()) {
      const page = await this.repo.listToNotice(noticeCutoff(today), BATCH);
      if (page.length === 0) break;
      const profiles = new Map((await this.profiles.findByIds(page.map((a) => a.userId))).map((p) => [p.id, p]));
      for (const a of page) {
        const p = profiles.get(a.userId);
        if (!p) continue;
        const deleteOn = inactivityDeletionDay(a.lastActiveOn, today);
        const sent = await this.mail.notify(a.userId, moderationTextIn(p.locale).inactivityEmail({ displayName: p.displayName, deleteOn }));
        if (!sent) this.logger.warn('prévenance d’inactivité non envoyée (pas d’adresse e-mail)');
        done += 1;
      }
      // Marqué même sans adresse : la suppression attend de toute façon 30 jours après ce jour.
      await this.repo.markNoticed(page.map((a) => a.userId), today);
      if (page.length < BATCH) break;
    }

    // 2. Suppressions (la règle du domaine reconfirme chaque compte).
    while (!over()) {
      const page = (await this.repo.listToDelete(deletionCutoff(today), addDays(today, -INACTIVITY_NOTICE_DAYS), BATCH)).filter(
        (a) => inactivityStep(a.lastActiveOn, a.noticedOn, today) === 'delete',
      );
      if (page.length === 0) break;
      for (const a of page) {
        if (over()) break;
        await this.deleteMe.execute(a.userId);
        done += 1;
      }
      this.logger.log(`${page.length} compte(s) inactif(s) supprimé(s)`);
      if (page.length < BATCH) break;
    }

    // 3. Purges.
    if (!over()) {
      const keptSince = new Date(now.getTime() - MODERATION_KEEP_DAYS * DAY_MS).toISOString();
      done += await this.repo.purgeBans(now.toISOString());
      done += await this.repo.purgeClosedReports(keptSince);
      done += await this.repo.purgeAuditLog(keptSince);
      // Rencontres proposées par personne (statistiques) : 30 jours, comme un journal technique.
      done += await this.proposals.purgeBefore(addDays(today, -TECHNICAL_LOG_DAYS));
    }
    return done;
  }
}
