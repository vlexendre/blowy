import { Module } from '@nestjs/common';
import { MATCH_RADIUS_KM } from '@blowy/domain';
import { PROFILES } from '../../shared/tokens';
import type { ProfilesRepository } from '../me/ports';
import { Audience } from '../safety/application/audience';
import { Matchmaker } from '../vision/application/matchmaker';
import { VisionModule } from '../vision/vision.module';
import { HandleAppleNotification } from './application/apple-notifications.usecase';
import { BillingJobs } from './application/billing.jobs';
import { GetPaywall, GetSubscription, SubmitPurchase } from './application/plus.usecases';
import { PlusNews } from './application/plus-news';
import { PlusMoments, PlusOpens } from './application/plus-desire';
import { Subscriptions } from './application/subscriptions.service';
import { BillingController } from './interface/billing.controller';
import { COMPATIBLE_NEARBY, type CompatibleNearby } from './tokens';

/**
 * Personnes compatibles autour de soi, d'après le service public du chantier « vision » (`Matchmaker.nearby`,
 * rayon MATCH_RADIUS_KM, gardé un jour), moins celles qu'on ne peut pas proposer (bloquées, suspendues,
 * supprimées : `Audience`, la même règle que les rencontres).
 */
const compatibleNearby = (matchmaker: Matchmaker, profiles: ProfilesRepository, audience: Audience): CompatibleNearby => ({
  async count(userId) {
    const profile = await profiles.findById(userId);
    if (!profile) return 0;
    const matches = (await matchmaker.nearby(await matchmaker.seeker(profile))).filter((m) => m.distanceKm <= MATCH_RADIUS_KM);
    return (await audience.visibleIds(userId, matches.map((m) => m.userId), 'suggest')).size;
  },
});

/**
 * Minimoa+ : paywall, achats vérifiés auprès d'Apple, notifications du magasin, rappel de fin d'essai, messages de
 * l'abonnement (bienvenue, paiement refusé, au revoir, relance : `PlusNews`).
 * Dépôts et adaptateurs (`billingProviders`) : fournis par CoreModule, selon BLOWY_ADAPTERS.
 */
@Module({
  imports: [VisionModule],
  controllers: [BillingController],
  providers: [
    { provide: COMPATIBLE_NEARBY, useFactory: compatibleNearby, inject: [Matchmaker, PROFILES, Audience] },
    PlusNews,
    Subscriptions,
    SubmitPurchase,
    GetSubscription,
    GetPaywall,
    HandleAppleNotification,
    BillingJobs,
    PlusMoments,
    PlusOpens,
  ],
  exports: [BillingJobs, Subscriptions],
})
export class BillingModule {}
