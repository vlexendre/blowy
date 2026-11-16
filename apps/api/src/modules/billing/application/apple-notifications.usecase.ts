import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Env } from '../../../config/env';
import type { Clock } from '../../../shared/clock';
import { CLOCK, ENV } from '../../../shared/tokens';
import { type Billing, BillingVerificationError, type StoreNotificationsRepository } from '../ports';
import { APPLE_BILLING, STORE_NOTIFICATIONS } from '../tokens';
import { appleStoreEvent } from './store-event';
import { Subscriptions } from './subscriptions.service';

export type NotificationOutcome = 'applied' | 'unlinked' | 'duplicate' | 'ignored' | 'test' | 'rejected';

/**
 * App Store Server Notifications V2. Signature vérifiée ; idempotent (Apple renvoie une notification jusqu'à
 * 5 fois tant qu'elle n'a pas reçu 200). Une notification refusée (signature) rend `rejected` (400) ;
 * une erreur technique remonte (500) pour qu'Apple renvoie plus tard.
 */
@Injectable()
export class HandleAppleNotification {
  private readonly logger = new Logger('Minimoa+');

  constructor(
    @Inject(APPLE_BILLING) private readonly apple: Billing,
    @Inject(STORE_NOTIFICATIONS) private readonly notifications: StoreNotificationsRepository,
    @Inject(Subscriptions) private readonly subscriptions: Subscriptions,
    @Inject(ENV) private readonly env: Env,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(signedPayload: string): Promise<NotificationOutcome> {
    let n;
    try {
      n = await this.apple.verifyNotification(signedPayload);
    } catch (err) {
      if (err instanceof BillingVerificationError) {
        this.logger.warn(`notification Apple refusée : ${err.reason}`);
        return 'rejected';
      }
      throw err;
    }
    const now = this.clock.now().toISOString();
    const fresh = await this.notifications.begin({
      store: 'apple',
      notificationId: n.notificationUUID,
      type: n.notificationType,
      subtype: n.subtype,
      originalTransactionId: n.transaction?.originalTransactionId ?? null,
      environment: n.environment,
      signedAt: new Date(n.signedDate).toISOString(),
      receivedAt: now,
      processedAt: null,
      outcome: null,
    });
    if (!fresh) return 'duplicate';
    const outcome = await this.process(n);
    await this.notifications.finish('apple', n.notificationUUID, outcome, this.clock.now().toISOString());
    return outcome;
  }

  private async process(n: Awaited<ReturnType<Billing['verifyNotification']>>): Promise<NotificationOutcome> {
    if (n.notificationType === 'TEST') return 'test';
    if (!n.transaction) return 'ignored';
    const event = appleStoreEvent(this.env.facturationAdmin.plusProducts, n.transaction, n.renewal, n);
    if (!event) return 'ignored';
    const record = await this.subscriptions.apply(event, { claimedBy: null, accountToken: n.transaction.appAccountToken, environment: n.transaction.environment });
    return record.userId ? 'applied' : 'unlinked';
  }
}
