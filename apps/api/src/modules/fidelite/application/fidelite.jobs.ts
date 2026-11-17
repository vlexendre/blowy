import { Inject, Injectable, Logger } from '@nestjs/common';
import { longAbsenceEmail } from '@blowy/content';
import {
  ABSENCE_DAYS,
  FIDELITE_CATCH_UP_DAYS,
  FIRST_STEPS,
  LIFECYCLE_KEEP_DAYS,
  type FideliteMessage,
  addDays,
  addMonths,
  dayOf,
  fideliteDayKey,
  fideliteDue,
  isFideliteHour,
  isFideliteSlot,
  localTimeOf,
} from '@blowy/domain';
import type { Env } from '../../../config/env';
import { Notifier as MailNotifier } from '../../../integrations/mailer/notifier';
import { NOTIFIER, type Notifier } from '../../../integrations/push/notifier';
import { ENV, PETS } from '../../../shared/tokens';
import { NotificationSettings } from '../../notifications/notification-settings';
import type { PetsRepository } from '../../pets/ports';
import { Audience } from '../../safety/application/audience';
import type { TickJob } from '../../tick/tick-job';
import { FIDELITE_PEOPLE, type FideliteFilter, type FidelitePeople, type FidelitePerson, LIFECYCLE_LOG, type LifecycleLog } from '../ports';
import { CatchUp } from './catch-up';

const DAY_MS = 86_400_000;
const BATCH = 200;
/** Anniversaires cherchés jusqu'à ce nombre d'années. */
const MAX_YEARS = 10;

/**
 * Nouvelles du minimoa et premiers pas (docs/FIDELISATION.md), appelés par le minuteur (`modules/tick/jobs.ts`) :
 * - J1, J3, J7 après l'inscription (habitudes, groupes, première rencontre) ;
 * - 3, 7 et 14 jours sans ouvrir l'app (le minimoa qui attend, sans reproche ; e-mail à 14 jours avec ce qui s'est
 *   passé) ;
 * - un mois, puis chaque année, avec son minimoa.
 * Une seule nouvelle par personne et par jour, entre 11 h et 20 h (heure de la personne), jamais pour le compte de
 * revue ni ses personnes fictives ; le type coupé dans les réglages coupe aussi l'e-mail. Le `Notifier` applique en
 * plus le plafond de 3 notifications par jour et les heures calmes.
 * Idempotent : chaque message réserve sa clé (`lifecycle_messages`) avant de partir.
 */
@Injectable()
export class FideliteJobs implements TickJob {
  private readonly logger = new Logger('Fidélisation');

  constructor(
    @Inject(FIDELITE_PEOPLE) private readonly people: FidelitePeople,
    @Inject(LIFECYCLE_LOG) private readonly log: LifecycleLog,
    @Inject(NotificationSettings) private readonly settings: NotificationSettings,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(MailNotifier) private readonly mail: MailNotifier,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(CatchUp) private readonly catchUp: CatchUp,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async runDue(now: Date, deadline: number = Date.now() + 20_000): Promise<number> {
    if (!isFideliteSlot(now)) return 0;
    const today = dayOf(now);
    const seen = new Set<string>();
    let sent = 0;
    for (const filter of this.filters(now, today)) {
      let after: string | null = null;
      while (Date.now() < deadline) {
        const page = await this.people.page(filter, after, BATCH);
        if (page.length === 0) break;
        after = page[page.length - 1]?.userId ?? null;
        sent += await this.handle(page.filter((p) => !seen.has(p.userId) && (seen.add(p.userId), true)), now, today, deadline);
        if (page.length < BATCH) break;
      }
    }
    if (Date.now() < deadline) await this.log.purge(new Date(now.getTime() - LIFECYCLE_KEEP_DAYS * DAY_MS).toISOString());
    if (sent > 0) this.logger.log(`${sent} nouvelle(s) de fidélisation envoyée(s)`);
    return sent;
  }

  /** Qui peut avoir un message aujourd'hui : inscrits récents, absents, et inscrits à une date anniversaire. */
  private filters(now: Date, today: string): FideliteFilter[] {
    const margin = FIDELITE_CATCH_UP_DAYS + 2;
    const lastStep = FIRST_STEPS[FIRST_STEPS.length - 1]?.day ?? 7;
    const longest = ABSENCE_DAYS[ABSENCE_DAYS.length - 1] ?? 14;
    const out: FideliteFilter[] = [
      { by: 'created', from: new Date(now.getTime() - (lastStep + margin) * DAY_MS).toISOString(), to: new Date(now.getTime() - DAY_MS / 2).toISOString() },
      { by: 'active', from: addDays(today, -(longest + FIDELITE_CATCH_UP_DAYS)), to: addDays(today, -(ABSENCE_DAYS[0] ?? 3)) },
    ];
    for (const months of [1, ...Array.from({ length: MAX_YEARS }, (_, i) => 12 * (i + 1))]) {
      const day = addMonths(today, -months);
      out.push({ by: 'created', from: `${addDays(day, -margin)}T00:00:00Z`, to: `${addDays(day, 1)}T23:59:59Z` });
    }
    return out;
  }

  private async handle(page: FidelitePerson[], now: Date, today: string, deadline: number): Promise<number> {
    const people = page.filter((p) => p.reviewWorld === null);
    if (people.length === 0) return 0;
    const keys = await this.log.keys(people.map((p) => p.userId));
    const due = people.flatMap((p) => {
      const message = fideliteDue({ createdOn: dayOf(new Date(p.createdAt)), lastActiveOn: p.lastActiveOn, today, sent: keys.get(p.userId) ?? new Set() });
      return message ? [{ p, message }] : [];
    });
    if (due.length === 0) return 0;
    const settings = await this.settings.resolveMany(due.map((d) => d.p.userId));
    const pets = new Map((await this.pets.findByOwners(due.map((d) => d.p.userId))).map((pet) => [pet.ownerId, pet.name]));
    let sent = 0;
    for (const { p, message } of due) {
      if (Date.now() >= deadline) break;
      const s = settings.get(p.userId);
      if (!s || !isFideliteHour(localTimeOf(now, s.timeZone).hour)) continue;
      // Coupé dans les réglages : ni push ni e-mail (on ne réserve rien, la personne peut le rallumer).
      if (s.disabledKinds.includes(message.kind)) continue;
      const petName = pets.get(p.userId);
      if (!petName) continue;
      const at = now.toISOString();
      if (!(await this.log.claim(p.userId, fideliteDayKey(today), at))) continue;
      if (!(await this.log.claim(p.userId, message.key, at))) continue;
      await this.notifier.notify(p.userId, message.kind, this.vars(message, petName));
      if (message.email) await this.email(p, petName);
      sent += 1;
    }
    return sent;
  }

  private vars(m: FideliteMessage, minimoa: string): Record<string, string> {
    if (m.kind === 'first_steps') return { step: m.step, minimoa };
    return m.step === 'absence' ? { step: 'absence', days: String(m.days), minimoa } : { step: 'anniversary', count: String(m.months), minimoa };
  }

  /** E-mail des 14 jours : ce qui s'est passé pendant l'absence. Jamais à un compte suspendu ; ne lève jamais. */
  private async email(p: FidelitePerson, petName: string): Promise<void> {
    try {
      if (!(await this.audience.canNotify(p.userId))) return;
      const { unread, waves } = await this.catchUp.of(p.userId);
      await this.mail.notify(p.userId, longAbsenceEmail(p.locale, { displayName: p.displayName, petName, unread, waves, appUrl: this.env.webUrl }));
    } catch (err) {
      this.logger.warn(`e-mail d’absence non envoyé : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }
}
