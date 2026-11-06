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
  | 'REFUND_REVERSAL'
  | 'BOOST_NOT_CONSUMED_REFUND';

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

// ---- V5 (spec-v5 §6, D-018–D-020) ----
/** @deprecated V4 : remplacé par `EntitlementKeyV5` (D-020 : carte, indices, espèces premium, XP×2 retirés). */
export type EntitlementKeyV4 = EntitlementKey;
/** Droits V5 de Blowy+ (spec §6.3) : toutes les sorties incluses + duos illimités ; l'accessoire mensuel est mort (D-041). */
export const ENTITLEMENT_KEYS_V5 = ['PLUS_INCLUDED_OUTINGS', 'PLUS_UNLIMITED_DUOS'] as const;
export type EntitlementKeyV5 = (typeof ENTITLEMENT_KEYS_V5)[number];

export const CREDIT_KINDS = ['FREE_FIRST', 'PLUS_INCLUDED', 'REFUND_CREDIT', 'STAFF_GRANT'] as const;
export type CreditKind = (typeof CREDIT_KINDS)[number];

export const CREDIT_REASONS = ['GRANT', 'CONSUME', 'EXPIRE', 'REVERSAL'] as const;
export type CreditReason = (typeof CREDIT_REASONS)[number];

/** Ordre de consommation des crédits à `seat.accept` (§2.6). */
export const CREDIT_CONSUMPTION_ORDER: readonly CreditKind[] = ['FREE_FIRST', 'PLUS_INCLUDED', 'REFUND_CREDIT', 'STAFF_GRANT'];

export const PAYMENT_PROVIDERS = ['STRIPE', 'LOCAL_DEMO'] as const;
export type PaymentProviderKind = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_STATUSES = ['REQUIRES_PAYMENT', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PURPOSES = ['SEAT'] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export type CurrencyCode = 'EUR';
