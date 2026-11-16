import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Paywall, SubmitPurchaseBody, Subscription } from '@blowy/contract';
import { type Locale, formatDate, formatPrice, plusPerkTextIn, plusTextIn, textOf, facturationText } from '@blowy/content';
import {
  OFFERS,
  PLANS,
  PLUS_PERKS,
  TRIAL_DAYS,
  TRIAL_REMINDER_DAY,
  monthlyEquivalentMinor,
  subscriptionView,
  yearlyDiscountPercent,
} from '@blowy/domain';
import type { Env } from '../../../config/env';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, ENV, PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import { type Billing, BillingVerificationError, type SubscriptionRecord, type SubscriptionsRepository, type VerifiedRenewal } from '../ports';
import { APPLE_BILLING, COMPATIBLE_NEARBY, type CompatibleNearby, SUBSCRIPTIONS } from '../tokens';
import { appleStoreEvent } from './store-event';
import { Subscriptions } from './subscriptions.service';

const APPLE_MANAGE_URL = 'https://apps.apple.com/account/subscriptions';

/** État de l'abonnement tel que l'app l'affiche. */
export function presentSubscription(record: SubscriptionRecord | null, now: Date, locale: Locale = 'fr'): Subscription {
  const v = subscriptionView(record, now);
  const plusText = plusTextIn(locale);
  const frenchDate = (iso: string): string => formatDate(locale, iso);
  const summary = (() => {
    switch (v.phase) {
      case 'none':
        return plusText.summary.none;
      case 'trial':
        return plusText.summary.trial(frenchDate(v.trialEndsAt ?? v.currentPeriodEndsAt ?? now.toISOString()), v.willRenew);
      case 'active':
        return plusText.summary.active(frenchDate(v.currentPeriodEndsAt ?? now.toISOString()), v.willRenew);
      default:
        return plusText.summary[v.phase];
    }
  })();
  return {
    plus: v.plus,
    phase: v.phase,
    plan: v.plan,
    productId: record?.productId ?? null,
    store: record?.store ?? null,
    trialEndsAt: v.trialEndsAt,
    currentPeriodEndsAt: v.currentPeriodEndsAt,
    willRenew: v.willRenew,
    renewsAt: v.renewsAt,
    manageUrl: record?.store === 'apple' ? APPLE_MANAGE_URL : null,
    summary,
  };
}

/** Achat ou restauration envoyé par l'app : la transaction StoreKit 2 signée est vérifiée, puis appliquée. */
@Injectable()
export class SubmitPurchase {
  private readonly logger = new Logger('Minimoa+');

  constructor(
    @Inject(APPLE_BILLING) private readonly apple: Billing,
    @Inject(Subscriptions) private readonly subscriptions: Subscriptions,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(ENV) private readonly env: Env,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(userId: string, body: SubmitPurchaseBody, locale: Locale = 'fr'): Promise<Subscription> {
    if (!(await this.profiles.findById(userId))) throw new DomainError('not_onboarded');
    try {
      const tx = await this.apple.verifyTransaction(body.signedTransaction);
      const renewal: VerifiedRenewal | null = body.signedRenewalInfo ? await this.apple.verifyRenewal(body.signedRenewalInfo) : null;
      const event = appleStoreEvent(this.env.facturationAdmin.plusProducts, tx, renewal, null);
      if (!event) throw new DomainError('invalid', textOf(facturationText, (t) => t.plus.errors.unknownProduct));
      if (tx.appAccountToken && tx.appAccountToken.toLowerCase() !== userId) this.logger.log('achat d’un autre compte Minimoa restauré ici');
      const record = await this.subscriptions.apply(event, { claimedBy: userId, accountToken: tx.appAccountToken, environment: tx.environment });
      return presentSubscription(record, this.clock.now(), locale);
    } catch (err) {
      if (err instanceof BillingVerificationError) {
        this.logger.warn(`achat refusé : ${err.reason}`);
        throw new DomainError('invalid', textOf(facturationText, (t) => t.plus.errors.invalidPurchase));
      }
      throw err;
    }
  }
}

@Injectable()
export class GetSubscription {
  constructor(
    @Inject(SUBSCRIPTIONS) private readonly subscriptions: SubscriptionsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(userId: string, locale: Locale = 'fr'): Promise<Subscription> {
    return presentSubscription(await this.subscriptions.latestForUser(userId), this.clock.now(), locale);
  }
}

/** Faits du paywall : offres en données, essai, avantages, preuve concrète, mentions obligatoires. */
@Injectable()
export class GetPaywall {
  private readonly logger = new Logger('Minimoa+');

  constructor(
    @Inject(SUBSCRIPTIONS) private readonly subscriptions: SubscriptionsRepository,
    @Inject(COMPATIBLE_NEARBY) private readonly nearby: CompatibleNearby,
    @Inject(ENV) private readonly env: Env,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(userId: string, locale: Locale = 'fr'): Promise<Paywall> {
    const plusText = plusTextIn(locale);
    const plusPerkText = plusPerkTextIn(locale);
    const euros = (amountMinor: number): string => formatPrice(locale, amountMinor, 'EUR');
    const [record, trialUsed, compatible] = await Promise.all([
      this.subscriptions.latestForUser(userId),
      this.subscriptions.trialUsedBy(userId),
      this.nearby.count(userId).catch((err: unknown) => {
        this.logger.warn(`compteur de personnes compatibles indisponible : ${err instanceof Error ? err.message : 'erreur'}`);
        return 0;
      }),
    ]);
    const products = this.env.facturationAdmin.plusProducts;
    const web = this.env.webUrl;
    const discount = yearlyDiscountPercent();
    const offers = PLANS.map((plan) => {
      const o = OFFERS[plan];
      const billed = euros(o.amountMinor);
      const price = o.period === 'year' ? plusText.price.year(billed) : plusText.price.month(billed);
      const perMonth = o.period === 'year' ? monthlyEquivalentMinor(o) : null;
      return {
        plan,
        productId: products[plan],
        period: o.period,
        billed: { amountMinor: o.amountMinor, currency: o.currency, display: billed },
        perMonth: perMonth === null ? null : { amountMinor: perMonth, currency: o.currency, display: euros(perMonth) },
        trialDays: o.trialDays,
        discountPercent: o.period === 'year' ? discount : null,
        labels: {
          price,
          perMonth: perMonth === null ? null : plusText.perMonth(euros(perMonth)),
          trial: o.trialDays > 0 ? plusText.trial(o.trialDays, price) : null,
          name: plusText.name[plan],
        },
      };
    });
    const count = Math.max(0, Math.floor(compatible));
    return {
      offers,
      defaultPlan: 'yearly',
      trial: { days: TRIAL_DAYS, reminderDay: TRIAL_REMINDER_DAY, timeline: plusText.timeline(TRIAL_REMINDER_DAY, TRIAL_DAYS), eligible: !trialUsed },
      perks: PLUS_PERKS.map((key) => ({ key, label: plusPerkText[key] })),
      teaser: { compatibleNearby: count, label: count > 0 ? plusText.teaser(count) : null },
      renewalNotice: plusText.renewalNotice,
      legal: { termsUrl: `${web}/legal/conditions`, privacyUrl: `${web}/legal/confidentialite`, plusTermsUrl: `${web}/legal/abonnement` },
      continueFreeLabel: plusText.continueFree,
      restoreLabel: plusText.restore,
      subscription: presentSubscription(record, this.clock.now(), locale),
    };
  }
}
