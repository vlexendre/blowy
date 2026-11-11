import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Email } from '@blowy/content';
import { MAILER, USER_EMAILS } from '../../shared/tokens';
import type { UserEmails } from '../auth/ports';
import type { Mailer } from './mailer';

/** Envoie un e-mail à une personne. Un échec d'envoi ne fait jamais échouer la requête. */
@Injectable()
export class Notifier {
  private readonly logger = new Logger('Notifier');

  constructor(
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(USER_EMAILS) private readonly emails: UserEmails,
  ) {}

  /** Vrai si l'e-mail est parti. */
  async notify(userId: string, email: Email, knownAddress?: string | null): Promise<boolean> {
    try {
      const to = knownAddress ?? (await this.emails.emailOf(userId));
      if (!to) return false;
      await this.mailer.send({ to, subject: email.subject, html: email.html, text: email.text });
      return true;
    } catch (err) {
      this.logger.warn(`envoi d'e-mail échoué : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      return false;
    }
  }
}
