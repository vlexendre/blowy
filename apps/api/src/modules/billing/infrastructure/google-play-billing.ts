/**
 * Emplacement du port `Billing` pour Google Play (Android viendra plus tard). Rien n'est branché :
 * chaque méthode refuse explicitement. À implémenter avec l'API Google Play Developer
 * (`purchases.subscriptionsv2.get`) et les notifications en temps réel (Pub/Sub), en ramenant chaque
 * événement à un `StoreEvent` du domaine comme le fait l'adaptateur Apple.
 */
import { type Billing, BillingVerificationError, type VerifiedNotification, type VerifiedRenewal, type VerifiedTransaction } from '../ports';

export class GooglePlayBilling implements Billing {
  readonly store = 'google' as const;

  async verifyTransaction(_jws: string): Promise<VerifiedTransaction> {
    throw new BillingVerificationError('Google Play n’est pas encore branché');
  }

  async verifyRenewal(_jws: string): Promise<VerifiedRenewal> {
    throw new BillingVerificationError('Google Play n’est pas encore branché');
  }

  async verifyNotification(_payload: string): Promise<VerifiedNotification> {
    throw new BillingVerificationError('Google Play n’est pas encore branché');
  }
}
