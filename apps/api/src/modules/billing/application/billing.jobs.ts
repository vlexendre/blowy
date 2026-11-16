import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { trialReminderEmail } from '@blowy/content';
import { OFFERS, TECHNICAL_LOG_DAYS, TRIAL_DAYS, TRIAL_REMINDER_DAY, trialReminderDue } from '@blowy/domain';
import { Notifier as MailNotifier } from '../../../integrations/mailer/notifier';
import { NOTIFIER, type Notifier } from '../../../integrations/push/notifier';
import { PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import type { StoreNotificationsRepository, SubscriptionsRepository } from '../ports';
import { STORE_NOTIFICATIONS, SUBSCRIPTIONS } from '../tokens';

const DAY_MS = 86_400_000;
const BATCH = 200;
/** Le rappel part en journée (heure de Paris), pour ne pas tomber dans les heures calmes. */
export const REMINDER_HOURS = { from: 10, to: 20 } as const;
/** Moins de 12 h avant la fin de l'essai, on n'attend plus la journée. */
const LAST_CALL_MS = 12 * 3_600_000;
/** Journal technique des notifications des magasins : 30 jours (politique de confidentialité ; Apple renvoie au plus 72 h). */
const NOTIFICATIONS_KEPT_DAYS = TECHNICAL_LOG_DAYS;

export const parisHour = (now: Date): number =>
  Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Paris' }).format(now));

/**
 * Travaux planifiés de Minimoa+ (appelés par le minuteur, `modules/tick/jobs.ts`) :
 * - le rappel promis sur la frise du paywall, à partir du jour 5 de l'essai, une seule fois par essai : en
 *   notification ET par e-mail quand le compte a une adresse (l'adresse relais d'Apple marche aussi). Le push peut être
 *   refusé, reporté ou coupé par la personne ; l'e-mail garantit que la promesse « on t'envoie un rappel » est tenue ;
 * - la purge des notifications des magasins de plus de 30 jours (journal technique).
 * Idempotent : le rappel est marqué envoyé avant l'envoi (au plus un rappel par essai).
 */
@Injectable()
export class BillingJobs {
  private readonly logger = new Logger('Minimoa+');

  constructor(
    @Inject(SUBSCRIPTIONS) private readonly subscriptions: SubscriptionsRepository,
    @Inject(STORE_NOTIFICATIONS) private readonly notifications: StoreNotificationsRepository,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Optional() @Inject(MailNotifier) private readonly mail: MailNotifier | null = null,
    @Optional() @Inject(PROFILES) private readonly profiles: ProfilesRepository | null = null,
  ) {}

  async runDue(now: Date, deadline?: number): Promise<number> {
    const sent = await this.sendTrialReminders(now, deadline);
    if (deadline === undefined || Date.now() < deadline) {
      await this.notifications.purge(new Date(now.getTime() - NOTIFICATIONS_KEPT_DAYS * DAY_MS).toISOString());
    }
    return sent;
  }

  private async sendTrialReminders(now: Date, deadline?: number): Promise<number> {
    const horizon = new Date(now.getTime() + (TRIAL_DAYS - TRIAL_REMINDER_DAY) * DAY_MS).toISOString();
    const daytime = (() => {
      const h = parisHour(now);
      return h >= REMINDER_HOURS.from && h < REMINDER_HOURS.to;
    })();
    let sent = 0;
    for (const s of await this.subscriptions.trialsEndingBefore(horizon, BATCH)) {
      if (deadline !== undefined && Date.now() >= deadline) break;
      if (!s.userId || !s.trialEndsAt || !trialReminderDue(s, s.trialReminderFor, now)) continue;
      const lastCall = Date.parse(s.trialEndsAt) - now.getTime() <= LAST_CALL_MS;
      if (!daytime && !lastCall) continue;
      await this.subscriptions.markTrialReminded(s.store, s.originalTransactionId, s.trialEndsAt);
      const offer = OFFERS[s.plan];
      await this.notifier.notify(s.userId, 'trial_reminder', { endsOn: s.trialEndsAt, price: String(offer.amountMinor), currency: offer.currency });
      await this.emailReminder(s.userId, s.trialEndsAt, offer.amountMinor, offer.currency);
      sent += 1;
    }
    if (sent > 0) this.logger.log(`${sent} rappel(s) de fin d’essai envoyé(s)`);
    return sent;
  }

  /** Le même rappel par e-mail, dans la langue du profil ; sans adresse, rien (le push reste). Ne lève jamais. */
  private async emailReminder(userId: string, endsOn: string, amountMinor: number, currency: string): Promise<void> {
    if (!this.mail || !this.profiles) return;
    try {
      const profile = await this.profiles.findById(userId);
      if (!profile) return;
      await this.mail.notify(userId, trialReminderEmail(profile.locale, { displayName: profile.displayName, endsOn, amountMinor, currency }));
    } catch (err) {
      this.logger.warn(`rappel de fin d’essai par e-mail non envoyé : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }
}
