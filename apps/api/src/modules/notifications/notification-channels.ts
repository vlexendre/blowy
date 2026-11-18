/**
 * Canal d'une notification (docs/NOTIFICATIONS.md) : push d'abord. Un e-mail qui double un push (signe reçu, nouveau
 * lien) ne part que si la personne n'a aucun appareil qui reçoit les push, et si elle n'a pas coupé ce type ; les
 * comptes rendus, les échéances et le transactionnel partent toujours (règle `emailAllowed` du domaine).
 * Ne lève jamais : dans le doute (lecture impossible), pas d'e-mail de repli.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { type PersonEmailKind, emailAllowed } from '@blowy/domain';
import { NotificationSettings } from './notification-settings';
import { type DevicesRepository, PUSH_DEVICES } from './ports';

@Injectable()
export class NotificationChannels {
  private readonly logger = new Logger('Push');

  constructor(
    @Inject(NotificationSettings) private readonly settings: NotificationSettings,
    @Inject(PUSH_DEVICES) private readonly devices: DevicesRepository,
  ) {}

  async emailAllowed(userId: string, kind: PersonEmailKind): Promise<boolean> {
    try {
      const [settings, devices] = await Promise.all([this.settings.resolve(userId), this.devices.forUser(userId)]);
      return emailAllowed(kind, { hasActivePush: devices.some((d) => d.kind === 'expo'), disabledKinds: settings.disabledKinds });
    } catch (err) {
      this.logger.warn(`canal de l'e-mail illisible : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      return false;
    }
  }
}
