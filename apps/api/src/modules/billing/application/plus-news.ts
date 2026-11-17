import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Email, formatDate, plusBillingEmail, plusGoodbyeEmail, plusPerkTextIn, plusWelcomeEmail, plusWinbackEmail } from '@blowy/content';
import { PLUS_PERKS, type PlusNewsStep, type StoreEvent, type SubscriptionState, entitlements, plusEndedAt, plusNewsAfter } from '@blowy/domain';
import type { Env } from '../../../config/env';
import { Notifier as MailNotifier } from '../../../integrations/mailer/notifier';
import { NOTIFIER, type Notifier } from '../../../integrations/push/notifier';
import type { Clock } from '../../../shared/clock';
import { CLOCK, ENV, PETS, PROFILES } from '../../../shared/tokens';
import { LIFECYCLE_LOG, type LifecycleLog } from '../../fidelite/ports';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { NotificationSettings } from '../../notifications/notification-settings';
import type { PetsRepository } from '../../pets/ports';
import { Audience } from '../../safety/application/audience';
import type { SubscriptionRecord } from '../ports';

type Step = PlusNewsStep | 'goodbye' | 'winback';

/**
 * Ce que Minimoa+ dit à la personne au fil de son abonnement (docs/FIDELISATION.md), par push (`plus_account`, coupable
 * dans les réglages, reporté au matin pendant les heures calmes) et, pour certains moments, par e-mail :
 * - bienvenue (push + e-mail), merci au renouvellement de l'annuel (push), paiement rattrapé (push) ;
 * - paiement refusé, délai de grâce ou pause (push + e-mail, avec « Gérer mon abonnement ») ;
 * - au revoir quand Minimoa+ s'arrête (push + e-mail : ce qu'on garde gratuitement), relance unique un mois après
 *   (push + e-mail, sans offre).
 * Les e-mails de service (bienvenue, paiement, au revoir) partent même si le push est coupé ; la relance, non.
 * Chaque message réserve sa clé dans `lifecycle_messages` avant de partir : jamais deux fois. Ne lève jamais.
 */
@Injectable()
export class PlusNews {
  private readonly logger = new Logger('Minimoa+');

  constructor(
    @Inject(LIFECYCLE_LOG) private readonly log: LifecycleLog,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(MailNotifier) private readonly mail: MailNotifier,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(NotificationSettings) private readonly settings: NotificationSettings,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(ENV) private readonly env: Env,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Après un événement du magasin appliqué à l'abonnement (achat, notification d'Apple). */
  async afterApply(prev: SubscriptionState | null, next: SubscriptionRecord, event: StoreEvent): Promise<void> {
    if (!next.userId) return;
    try {
      const now = this.clock.now();
      for (const n of plusNewsAfter(prev, next, event, now)) {
        if (await this.log.claim(next.userId, n.key, now.toISOString())) await this.send(next.userId, n.step, next);
      }
    } catch (err) {
      this.logger.warn(`message d’abonnement non envoyé : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }

  /** Au revoir ou relance (minuteur, `BillingJobs`) ; vrai si le message est parti. */
  async farewell(record: SubscriptionRecord, step: 'goodbye' | 'winback', now: Date): Promise<boolean> {
    if (!record.userId) return false;
    const key = step === 'goodbye' ? `plus_goodbye:${record.originalTransactionId}:${plusEndedAt(record, now) ?? ''}` : 'plus_winback';
    if (!(await this.log.claim(record.userId, key, now.toISOString()))) return false;
    await this.send(record.userId, step, record);
    return true;
  }

  private async send(userId: string, step: Step, record: SubscriptionRecord): Promise<void> {
    const profile = await this.profiles.findById(userId);
    if (!profile || profile.reviewWorld) return;
    const petName = (await this.pets.findByOwner(userId))?.name;
    if (!petName) return;
    const vars: Record<string, string> = { step, minimoa: petName };
    if (step === 'billing_grace' && record.graceUntil) vars.endsOn = record.graceUntil;
    await this.notifier.notify(userId, 'plus_account', vars);
    const email = await this.emailFor(step, profile, petName, record);
    if (!email) return;
    try {
      if (!(await this.audience.canNotify(userId))) return;
      await this.mail.notify(userId, email);
    } catch (err) {
      this.logger.warn(`e-mail d’abonnement non envoyé : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }

  private async emailFor(step: Step, profile: Profile, petName: string, record: SubscriptionRecord): Promise<Email | null> {
    const locale = profile.locale;
    const person = { displayName: profile.displayName, petName };
    const date = (iso: string): string => formatDate(locale, iso, { day: 'numeric', month: 'long' });
    switch (step) {
      case 'welcome': {
        const perks = plusPerkTextIn(locale);
        return plusWelcomeEmail(locale, {
          ...person,
          perks: PLUS_PERKS.map((k) => perks[k]),
          trialEndsOn: record.status === 'trial' && record.trialEndsAt ? date(record.trialEndsAt) : null,
          appUrl: this.env.webUrl,
        });
      }
      case 'billing_grace':
      case 'billing_retry':
        return plusBillingEmail(locale, { ...person, graceUntil: step === 'billing_grace' && record.graceUntil ? date(record.graceUntil) : null });
      case 'goodbye':
        return plusGoodbyeEmail(locale, { ...person, freeHabits: entitlements(false).habits, appUrl: this.env.webUrl });
      case 'winback': {
        // Relance : seulement si la personne n'a pas coupé les messages de l'abonnement.
        const settings = await this.settings.resolve(profile.id);
        return settings.disabledKinds.includes('plus_account') ? null : plusWinbackEmail(locale, { ...person, appUrl: this.env.webUrl });
      }
      case 'renewed':
      case 'recovered':
        return null;
    }
  }
}
