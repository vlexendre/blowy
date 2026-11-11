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
