export type LedgerReason =
  | 'MISSION_REWARD'
  | 'STREAK_MILESTONE'
  | 'REFERRAL_REFERRER'
  | 'REFERRAL_REFEREE'
  | 'NEIGHBORHOOD_FEED'
  | 'MONTHLY_BENEFIT'
  | 'STORE_PURCHASE'
  | 'CATALOG_PURCHASE'
  | 'LEAGUE_REWARD'
  | 'SHARE_CARD_CREATED'
  | 'STAFF_CORRECTION'
  | 'REFUND_REVERSAL';

export type EntitlementKey =
  | 'PLUS_DATE_SLOTS'
  | 'PLUS_MAP'
  | 'PLUS_HINTS'
  | 'PLUS_PREMIUM_SPECIES'
  | 'PLUS_WEEKEND_PET_XP'
  | 'PLUS_MONTHLY_BENEFITS';

/** Droits dérivés transmissibles au partenaire emménagé (non transitifs, sans bénéfices mensuels). */
export const SHAREABLE_ENTITLEMENTS: readonly EntitlementKey[] = ['PLUS_DATE_SLOTS', 'PLUS_MAP', 'PLUS_HINTS', 'PLUS_WEEKEND_PET_XP'];

export type EntitlementSource = 'STORE_SUBSCRIPTION' | 'DERIVED_PARTNER' | 'STAFF_GRANT' | 'LOCAL_DEMO';

export type SubscriptionState =
  | 'NONE'
  | 'TRIAL'
  | 'ACTIVE'
  | 'GRACE_PERIOD'
  | 'CANCELLED_PENDING_EXPIRY'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'REVOKED';
