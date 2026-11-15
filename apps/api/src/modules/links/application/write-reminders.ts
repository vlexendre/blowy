/**
 * Rappel « série avec Léa : à toi d'écrire avant minuit » (spéc §24), le soir (`WRITE_REMINDER_HOURS`, heure de Paris).
 * Pour chaque lien actif où l'un a écrit aujourd'hui et pas l'autre, l'autre reçoit le rappel ; une seule notification
 * par personne et par jour, qui résume tous ses liens en attente (le lien mis en avant : la plus longue série en jeu).
 * Heures calmes, plafond de 3 par jour, réglage `your_turn` et « une fois par jour » : appliqués par le notifieur.
 * Idempotent : chaque lien lu est marqué pour la journée (`write_reminder_on`), qu'il ait donné lieu à un rappel ou non ;
 * un lien où quelqu'un écrit plus tard dans la soirée revient dans la liste (son `last_active_on` reste aujourd'hui,
 * sa marque est d'hier) et le notifieur refuse un second rappel à la même personne le même jour.
 */
import { Inject, Injectable } from '@nestjs/common';
import { type Day, lateSide, linkToday } from '@blowy/domain';
import { NOTIFIER, type Notifier } from '../../../integrations/push/notifier';
import { LINKS, PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import { Audience } from '../../safety/application/audience';
import type { LinkRecord, LinksRepository } from '../ports';

const BATCH = 200;
const MAX_BATCHES = 50;

interface Waiting {
  link: LinkRecord;
  otherId: string;
  streak: number;
}

@Injectable()
export class WriteReminders {
  constructor(
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(Audience) private readonly audience: Audience,
  ) {}

  /** Rend le nombre de rappels demandés au notifieur. */
  async runDue(today: Day, deadline: number): Promise<number> {
    let sent = 0;
    for (let i = 0; i < MAX_BATCHES && Date.now() < deadline; i++) {
      const page = await this.links.listForWriteReminder(today, BATCH);
      if (page.length === 0) break;
      // D'abord la marque : un tick concurrent ne reprend pas les mêmes liens.
      await this.links.markWriteReminder(
        page.map((l) => l.id),
        today,
      );
      const byPerson = new Map<string, Waiting[]>();
      for (const link of page) {
        const late = lateSide(link, today);
        if (!late) continue;
        const [userId, otherId] = late === 'a' ? [link.userA, link.userB] : [link.userB, link.userA];
        const streak = linkToday(link, late, today).streak;
        byPerson.set(userId, [...(byPerson.get(userId) ?? []), { link, otherId, streak }]);
      }
      sent += await this.send(byPerson);
      if (page.length < BATCH) break;
    }
    return sent;
  }

  private async send(byPerson: ReadonlyMap<string, Waiting[]>): Promise<number> {
    if (byPerson.size === 0) return 0;
    const otherIds = [...new Set([...byPerson.values()].flat().map((w) => w.otherId))];
    const names = new Map((await this.profiles.findByIds(otherIds)).map((p) => [p.id, p.displayName]));
    let n = 0;
    for (const [userId, waiting] of byPerson) {
      // Qui est montré à qui : jamais un rappel au sujet d'une personne bloquée, suspendue ou supprimée.
      const shown = await this.audience.visibleIds(
        userId,
        waiting.map((w) => w.otherId),
        'suggest',
      );
      const kept = waiting.filter((w) => shown.has(w.otherId) && names.has(w.otherId));
      // Le lien mis en avant : la plus longue série en jeu, puis le message le plus récent.
      const [first, ...rest] = [...kept].sort((x, y) => y.streak - x.streak || y.link.lastMessageAt.localeCompare(x.link.lastMessageAt));
      if (!first) continue;
      await this.notifier.notify(userId, 'your_turn', {
        linkId: first.link.id,
        name: names.get(first.otherId) ?? '',
        count: String(first.streak),
        more: String(rest.length),
      });
      n += 1;
    }
    return n;
  }
}
