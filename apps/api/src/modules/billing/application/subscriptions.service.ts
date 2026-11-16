import { Inject, Injectable, Logger } from '@nestjs/common';
import { type StoreEvent, applyStoreEvent, plusUntilOf } from '@blowy/domain';
import { PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import type { SubscriptionRecord, SubscriptionsRepository } from '../ports';
import { SUBSCRIPTIONS } from '../tokens';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Applique un événement de magasin à l'abonnement et tient `profiles.plus_until` à jour.
 * Un abonnement appartient à l'identifiant Apple qui l'a payé : s'il est restauré depuis un autre compte Minimoa,
 * il change de compte (l'ancien perd Minimoa+).
 */
@Injectable()
export class Subscriptions {
  private readonly logger = new Logger('Minimoa+');

  constructor(
    @Inject(SUBSCRIPTIONS) private readonly subscriptions: SubscriptionsRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
  ) {}

  /**
   * `claimedBy` : la personne qui envoie l'achat depuis l'app (null pour une notification du magasin).
   * `accountToken` : l'`appAccountToken` de la transaction, utilisé si l'abonnement n'est rattaché à personne.
   */
  async apply(event: StoreEvent, input: { claimedBy: string | null; accountToken: string | null; environment: string }): Promise<SubscriptionRecord> {
    const prev = await this.subscriptions.find(event.store, event.originalTransactionId);
    const next = applyStoreEvent(prev, event);
    const previousOwner = prev?.userId ?? null;
    let owner = input.claimedBy ?? previousOwner;
    if (!owner && input.accountToken && UUID.test(input.accountToken)) {
      const profile = await this.profiles.findById(input.accountToken.toLowerCase());
      owner = profile ? profile.id : null;
    }
    const record: SubscriptionRecord = {
      ...next,
      userId: owner,
      environment: input.environment,
      trialReminderFor: prev?.trialReminderFor ?? null,
    };
    await this.subscriptions.save(record);
    if (previousOwner && previousOwner !== owner) {
      this.logger.log('abonnement restauré sur un autre compte : l’ancien perd Minimoa+');
      await this.refreshPlus(previousOwner);
    }
    if (owner) await this.refreshPlus(owner);
    return record;
  }

  /** Recalcule `plus_until` d'une personne depuis son abonnement le plus pertinent. */
  async refreshPlus(userId: string): Promise<void> {
    if (!(await this.profiles.findById(userId))) return;
    const latest = await this.subscriptions.latestForUser(userId);
    await this.subscriptions.setPlusUntil(userId, plusUntilOf(latest));
  }
}
