import { Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface OutgoingMail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface Mailer {
  send(mail: OutgoingMail): Promise<void>;
}

export class ResendMailer implements Mailer {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async send(mail: OutgoingMail): Promise<void> {
    const { error } = await this.resend.emails.send({ from: this.from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text });
    if (error) throw new Error(`Resend : ${error.message}`);
  }
}

/** Sans clé Resend : l'e-mail est seulement annoncé dans la console (sujet et domaine, jamais l'adresse complète). */
export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger('Mailer');
  /** Derniers envois, consultables par les tests. */
  readonly outbox: OutgoingMail[] = [];

  async send(mail: OutgoingMail): Promise<void> {
    this.outbox.push(mail);
    if (this.outbox.length > 200) this.outbox.shift();
    this.logger.log(`e-mail « ${mail.subject} » → @${mail.to.split('@')[1] ?? '?'}`);
  }
}

/** Destinataires permis : adresses exactes et domaines (sans « @ »), en minuscules. */
export interface MailRecipients {
  emails: readonly string[];
  domains: readonly string[];
}

export const recipientAllowed = (to: string, allow: MailRecipients): boolean => {
  const address = to.trim().toLowerCase();
  const domain = address.split('@')[1] ?? '';
  return allow.emails.includes(address) || allow.domains.includes(domain);
};

/**
 * Hors production (`MAIL_ALLOWLIST`, docs/ENVIRONNEMENTS.md) : seuls les destinataires de la liste reçoivent l'e-mail ;
 * les autres sont journalisés (sujet et domaine, jamais l'adresse complète) puis écartés sans erreur, pour que le dev,
 * qui partage la clé Resend de la production, n'écrive jamais à quelqu'un par erreur.
 */
export class AllowListMailer implements Mailer {
  private readonly logger = new Logger('Mailer');

  constructor(
    private readonly inner: Mailer,
    private readonly allow: MailRecipients,
  ) {}

  async send(mail: OutgoingMail): Promise<void> {
    if (recipientAllowed(mail.to, this.allow)) return this.inner.send(mail);
    this.logger.log(`e-mail « ${mail.subject} » → @${mail.to.split('@')[1] ?? '?'} écarté (hors MAIL_ALLOWLIST)`);
  }
}
