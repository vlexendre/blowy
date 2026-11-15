/**
 * Travaux planifiés des liens (appelés par `POST /internal/tick`) :
 * 1. rattrapage des jours passés (vies perdues, fantômes) pour les liens actifs pas encore vus aujourd'hui —
 *    c'est ce qui déclenche « lien en danger » même si personne n'ouvre l'app ;
 * 2. relances des silences de 72 h par les minimoas ;
 * 3. le soir (19 h – 22 h, Paris), rappel « à toi d'écrire avant minuit » (`WriteReminders`).
 * Idempotent : un lien rattrapé a `last_tick_on = aujourd'hui` et sort de la liste ; une relance est marquée
 * (`last_nudge_for`) avant d'être écrite.
 */
import { Inject, Injectable } from '@nestjs/common';
import { dayOf, isWriteReminderHour, parisHourOf } from '@blowy/domain';
import { LINKS } from '../../../shared/tokens';
import type { TickJob } from '../../tick/tick-job';
import { LinkSession } from '../application/link-session';
import { WriteReminders } from '../application/write-reminders';
import type { LinksRepository } from '../ports';
import { ChatMinimoas } from './chat-minimoas';

const BATCH = 100;
/** Garde-fou : nombre maximal de lots par tick pour le rattrapage. */
const MAX_BATCHES = 50;

@Injectable()
export class LinkJobs implements TickJob {
  constructor(
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(ChatMinimoas) private readonly minimoas: ChatMinimoas,
    @Inject(WriteReminders) private readonly reminders: WriteReminders,
  ) {}

  async runDue(now: Date, deadline: number = Date.now() + 20_000): Promise<number> {
    let done = 0;
    const today = dayOf(now);
    for (let i = 0; i < MAX_BATCHES && Date.now() < deadline; i++) {
      const due = await this.links.listDueForTick(today, BATCH);
      if (due.length === 0) break;
      const drafts = await this.session.draftsFor(due);
      for (const d of drafts) {
        await this.session.commit(d);
        done += 1;
      }
      if (due.length < BATCH) break;
    }
    if (Date.now() < deadline) done += await this.minimoas.nudgeSilent(now, deadline);
    // Après le rattrapage : les liens du jour sont à jour (série tombée à minuit, vies).
    if (Date.now() < deadline && isWriteReminderHour(parisHourOf(now))) done += await this.reminders.runDue(today, deadline);
    return done;
  }
}
