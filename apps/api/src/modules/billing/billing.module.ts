import { Module } from '@nestjs/common';
import { MATCH_RADIUS_KM } from '@blowy/domain';
import { BLOCKS, PROFILES } from '../../shared/tokens';
import type { ProfilesRepository } from '../me/ports';
import type { BlocksRepository } from '../safety/ports';
import { Matchmaker } from '../vision/application/matchmaker';
import { VisionModule } from '../vision/vision.module';
import { HandleAppleNotification } from './application/apple-notifications.usecase';
import { BillingJobs } from './application/billing.jobs';
import { GetPaywall, GetSubscription, SubmitPurchase } from './application/plus.usecases';
import { Subscriptions } from './application/subscriptions.service';
import { BillingController } from './interface/billing.controller';
import { COMPATIBLE_NEARBY, type CompatibleNearby } from './tokens';

/**
 * Personnes compatibles autour de soi, d'après le service public du chantier « vision » (`Matchmaker.nearby`,
 * rayon MATCH_RADIUS_KM, gardé un jour), moins les personnes bloquées dans un sens ou dans l'autre.
 */
const compatibleNearby = (matchmaker: Matchmaker, profiles: ProfilesRepository, blocks: BlocksRepository): CompatibleNearby => ({
  async count(userId) {
    const profile = await profiles.findById(userId);
    if (!profile) return 0;
    const [matches, blocked] = await Promise.all([matchmaker.seeker(profile).then((me) => matchmaker.nearby(me)), blocks.blockedEitherWay(userId)]);
    return matches.filter((m) => !blocked.has(m.userId) && m.distanceKm <= MATCH_RADIUS_KM).length;
  },
});

/**
 * Blowy+ : paywall, achats vérifiés auprès d'Apple, notifications du magasin, rappel de fin d'essai.
 * Dépôts et adaptateurs (`billingProviders`) : fournis par CoreModule, selon BLOWY_ADAPTERS.
 */
@Module({
  imports: [VisionModule],
  controllers: [BillingController],
  providers: [
    { provide: COMPATIBLE_NEARBY, useFactory: compatibleNearby, inject: [Matchmaker, PROFILES, BLOCKS] },
    Subscriptions,
    SubmitPurchase,
    GetSubscription,
    GetPaywall,
    HandleAppleNotification,
    BillingJobs,
  ],
  exports: [BillingJobs, Subscriptions],
})
export class BillingModule {}
