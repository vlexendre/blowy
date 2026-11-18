import { Inject, Injectable, Logger } from '@nestjs/common';
import { quartierOpenEmail, zoneLabel } from '@blowy/content';
import { FOUNDERS_PER_ZONE, QUIZ_KEEP_DAYS, UNCONFIRMED_KEEP_DAYS, foundersOf, shouldOpen, zoneById } from '@blowy/domain';
import type { Env } from '../../../config/env';
import type { Mailer } from '../../../integrations/mailer/mailer';
import { ENV, MAILER } from '../../../shared/tokens';
import type { TickJob } from '../../tick/tick-job';
import { QUARTIERS, QUIZ_RESULTS, type FounderRecord, type QuartiersRepository, type QuizResultsRepository } from '../ports';

const DAY_MS = 86_400_000;
const BATCH = 100;
/** Jours entre l'e-mail d'ouverture et l'effacement de l'adresse. */
const NOTIFIED_KEEP_DAYS = 30;

/**
 * Quartiers (docs/VIRALITE.md), à chaque passage du minuteur (`modules/tick/jobs.ts`) :
 * 1. ouvre chaque quartier dont le compteur réel atteint le seuil ;
 * 2. pose les fondateurs d'un quartier ouvert (les 3 premiers inviteurs ; objet « Fondateur ») ;
 * 3. envoie « Ton quartier est ouvert » à chaque inscription confirmée, une fois (la date est notée avant l'envoi) ;
 * 4. efface les inscriptions non confirmées (7 jours), les adresses prévenues (30 jours) et les vieux résultats du quiz.
 * Idempotent : un quartier ne s'ouvre qu'une fois, les fondateurs ne se posent qu'une fois, chaque e-mail une fois.
 */
@Injectable()
export class QuartierJobs implements TickJob {
  private readonly logger = new Logger('Quartiers');

  constructor(
    @Inject(QUARTIERS) private readonly repo: QuartiersRepository,
    @Inject(QUIZ_RESULTS) private readonly quiz: QuizResultsRepository,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async runDue(now: Date, deadline: number = Date.now() + 20_000): Promise<number> {
    const at = now.toISOString();
    let done = 0;
    const [zones, threshold] = await Promise.all([this.repo.listZones(), this.repo.threshold()]);
    const counts = await this.repo.counts(zones.map((z) => z.zone));
    for (const z of zones) {
      const c = counts.get(z.zone);
      if (shouldOpen(c?.confirmed ?? 0, threshold, z.openedAt) && (await this.repo.open(z.zone, at, 'threshold'))) {
        z.openedAt = at;
        done++;
      }
      if (z.openedAt && (c?.founders ?? 0) === 0) {
        const founders: FounderRecord[] = foundersOf(await this.repo.invitesOf(z.zone), FOUNDERS_PER_ZONE).map((key, i) => ({
          zone: z.zone,
          rank: i + 1,
          userId: key.startsWith('u:') ? key.slice(2) : null,
          signupId: key.startsWith('s:') ? key.slice(2) : null,
        }));
        await this.repo.setFounders(z.zone, founders, at);
      }
    }
    const founderCache = new Map<string, Set<string>>();
    while (Date.now() < deadline) {
      const page = await this.repo.toNotify(BATCH);
      if (page.length === 0) break;
      for (const s of page) {
        const zone = zoneById(s.zone);
        // Noté avant l'envoi : un deuxième passage ne renvoie jamais le même e-mail.
        await this.repo.updateSignup(s.id, { openMailSentAt: at });
        // Adresses réservées (`.invalid`, RFC 2606 : semis d'un environnement de test) : jamais d'envoi.
        if (!zone || !s.email || !s.token || /\.invalid$/i.test(s.email)) continue;
        let founders = founderCache.get(s.zone);
        if (!founders) {
          founders = new Set((await this.repo.founders(s.zone)).map((f) => f.signupId ?? ''));
          founderCache.set(s.zone, founders);
        }
        const mail = quartierOpenEmail(s.locale, {
          zone: zoneLabel(zone, s.locale),
          code: s.code,
          founder: founders.has(s.id),
          appUrl: `${this.env.webUrl}/quartier/${s.zone}?code=${s.code}`,
          unsubscribeUrl: `${this.env.webUrl}/quartier/desinscription?t=${s.token}`,
        });
        try {
          await this.mailer.send({ to: s.email, ...mail });
          done++;
        } catch (err) {
          this.logger.warn(`e-mail d'ouverture non parti : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
        }
      }
      if (page.length < BATCH) break;
    }
    if (Date.now() < deadline) {
      await this.repo.purge(new Date(now.getTime() - UNCONFIRMED_KEEP_DAYS * DAY_MS).toISOString(), new Date(now.getTime() - NOTIFIED_KEEP_DAYS * DAY_MS).toISOString());
      await this.quiz.purgeBefore(new Date(now.getTime() - QUIZ_KEEP_DAYS * DAY_MS).toISOString());
    }
    return done;
  }
}
