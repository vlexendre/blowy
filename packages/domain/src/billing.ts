/**
 * Minimoa+ : offres, essai gratuit et cycle de vie d'un abonnement (pur, sans horloge).
 * Les magasins (Apple aujourd'hui, Google plus tard) envoient des événements signés ; l'API les vérifie,
 * les ramène à un `StoreEvent` et laisse `applyStoreEvent` calculer l'état. `plusUntilOf` donne ensuite
 * la valeur de `profiles.plus_until`, seule source de `hasPlus`.
 */

/** Offres, dans l'ordre où le paywall les présente : l'annuelle mise en avant, puis la mensuelle, puis l'hebdomadaire. */
export const PLANS = ['yearly', 'monthly', 'weekly'] as const;
export type Plan = (typeof PLANS)[number];
export type BillingPeriod = 'year' | 'month' | 'week';

export interface Offer {
  plan: Plan;
  period: BillingPeriod;
  /** Montant réellement facturé à chaque période, en centimes (prix de repli : l'app affiche le prix localisé du magasin). */
  amountMinor: number;
  currency: 'EUR';
  /** Jours d'essai gratuit avant le premier paiement (0 : pas d'essai). */
  trialDays: number;
}

/** Durée de l'essai gratuit (offre annuelle seulement ; ni la mensuelle ni l'hebdomadaire n'en ont) et jour du rappel promis sur la frise du paywall. */
export const TRIAL_DAYS = 7;
export const TRIAL_REMINDER_DAY = 5;

export const OFFERS: Readonly<Record<Plan, Offer>> = Object.freeze({
  yearly: { plan: 'yearly', period: 'year', amountMinor: 5988, currency: 'EUR', trialDays: TRIAL_DAYS },
  monthly: { plan: 'monthly', period: 'month', amountMinor: 1499, currency: 'EUR', trialDays: 0 },
  weekly: { plan: 'weekly', period: 'week', amountMinor: 299, currency: 'EUR', trialDays: 0 },
});

/**
 * Équivalent mensuel d'une offre annuelle, en centimes, arrondi au centime inférieur (59,88 € par an → 4,99 € par
 * mois). Seule l'annuelle en affiche un : pour les autres, le montant facturé de la période (jamais de « soit … par
 * mois » sous l'hebdomadaire, qui inviterait à une comparaison trompeuse).
 */
export const monthlyEquivalentMinor = (offer: Offer): number => (offer.period === 'year' ? Math.floor(offer.amountMinor / 12) : offer.amountMinor);

/**
 * Remise réelle de l'annuel par rapport à douze mensualités, en pour cent entier (59,88 contre 179,88 → 67).
 * Toujours contre la mensuelle : jamais contre 52 semaines de l'hebdomadaire (chiffre plus flatteur, mais pas une
 * offre que la personne paierait vraiment sur un an).
 */
export function yearlyDiscountPercent(yearly: Offer = OFFERS.yearly, monthly: Offer = OFFERS.monthly): number {
  const twelve = monthly.amountMinor * 12;
  return twelve <= 0 ? 0 : Math.round(((twelve - yearly.amountMinor) / twelve) * 100);
}

// ── Cycle de vie ───────────────────────────────────────────────────────────

export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'grace', 'billing_retry', 'expired', 'refunded', 'revoked'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type Store = 'apple' | 'google';

/**
 * Ce qu'un magasin dit d'un abonnement à un instant donné (transaction et renouvellement signés, éventuellement
 * accompagnés d'une notification). Les dates sont des ISO ; `signedAt` est la date de signature par le magasin
 * et sert à ignorer les événements arrivés dans le désordre.
 */
export interface StoreEvent {
  store: Store;
  /** Type de notification du magasin (`SUBSCRIBED`, `DID_RENEW`, `REFUND`…) ; null pour un achat envoyé par l'app. */
  kind: string | null;
  subtype: string | null;
  signedAt: string;
  originalTransactionId: string;
  transactionId: string;
  productId: string;
  plan: Plan;
  purchasedAt: string;
  expiresAt: string | null;
  /** L'achat en cours est un essai gratuit (offre d'introduction « FREE_TRIAL »). */
  freeTrial: boolean;
  revokedAt: string | null;
  /** Statut signé par le magasin (Apple : 1 actif, 2 expiré, 3 nouvelle tentative de paiement, 4 délai de grâce, 5 révoqué). */
  storeStatus: 1 | 2 | 3 | 4 | 5 | null;
  renewal: {
    autoRenew: boolean;
    inBillingRetry: boolean;
    graceUntil: string | null;
  } | null;
}

export interface SubscriptionState {
  store: Store;
  originalTransactionId: string;
  latestTransactionId: string;
  productId: string;
  plan: Plan;
  status: SubscriptionStatus;
  /** Fin de la période payée ou de l'essai en cours. */
  expiresAt: string | null;
  /** Fin du délai de grâce (accès maintenu pendant que le magasin retente le paiement). */
  graceUntil: string | null;
  /** Fin de l'essai gratuit, si la période en cours est un essai. */
  trialEndsAt: string | null;
  /** L'essai a déjà été utilisé sur cet abonnement. */
  trialUsed: boolean;
  autoRenew: boolean;
  revokedAt: string | null;
  startedAt: string;
  /** Date de signature du dernier événement appliqué. */
  updatedAt: string;
}

const ms = (iso: string | null): number => (iso === null ? Number.NEGATIVE_INFINITY : Date.parse(iso));
const later = (a: string | null, b: string | null): string | null => (a === null ? b : b === null ? a : ms(a) >= ms(b) ? a : b);

function statusOf(e: StoreEvent): SubscriptionStatus {
  if (e.revokedAt !== null || e.storeStatus === 5 || e.kind === 'REFUND' || e.kind === 'REVOKE') {
    return e.kind === 'REVOKE' ? 'revoked' : 'refunded';
  }
  const graceOpen = e.renewal?.graceUntil != null && ms(e.renewal.graceUntil) > ms(e.signedAt);
  if (e.storeStatus === 4 || (e.renewal?.inBillingRetry && graceOpen) || (e.kind === 'DID_FAIL_TO_RENEW' && e.subtype === 'GRACE_PERIOD')) return 'grace';
  if (e.storeStatus === 3 || e.renewal?.inBillingRetry || e.kind === 'DID_FAIL_TO_RENEW' || e.kind === 'GRACE_PERIOD_EXPIRED') return 'billing_retry';
  if (e.storeStatus === 2 || e.kind === 'EXPIRED' || (e.expiresAt !== null && ms(e.expiresAt) <= ms(e.signedAt))) return 'expired';
  return e.freeTrial ? 'trial' : 'active';
}

/**
 * Applique un événement du magasin. Un événement signé avant le dernier appliqué (renvoi, désordre) ne
 * change rien, sauf s'il concerne une transaction plus récente que celle connue.
 */
export function applyStoreEvent(prev: SubscriptionState | null, e: StoreEvent): SubscriptionState {
  if (prev) {
    const sameSeries = prev.originalTransactionId === e.originalTransactionId;
    // Renvoi ou désordre : signé avant le dernier événement appliqué et sans échéance plus lointaine.
    if (ms(e.signedAt) < ms(prev.updatedAt) && ms(e.expiresAt) <= ms(prev.expiresAt)) return prev;
    // Transaction plus ancienne de la même série (restauration d'un vieil achat) : l'échéance ne recule pas.
    if (sameSeries && e.revokedAt === null && e.kind === null && ms(e.expiresAt) < ms(prev.expiresAt)) return prev;
  }
  const status = statusOf(e);
  const revoked = status === 'refunded' || status === 'revoked';
  const autoRenew = revoked
    ? false
    : (e.renewal?.autoRenew ??
      (e.kind === 'DID_CHANGE_RENEWAL_STATUS' && e.subtype !== null ? e.subtype === 'AUTO_RENEW_ENABLED' : (prev?.autoRenew ?? true)));
  return {
    store: e.store,
    originalTransactionId: e.originalTransactionId,
    latestTransactionId: e.transactionId,
    productId: e.productId,
    plan: e.plan,
    status,
    expiresAt: e.expiresAt,
    graceUntil: status === 'grace' ? (e.renewal?.graceUntil ?? prev?.graceUntil ?? null) : null,
    trialEndsAt: status === 'trial' ? e.expiresAt : null,
    trialUsed: (prev?.trialUsed ?? false) || e.freeTrial,
    autoRenew,
    revokedAt: revoked ? (e.revokedAt ?? e.signedAt) : null,
    startedAt: prev?.startedAt ?? e.purchasedAt,
    updatedAt: later(prev?.updatedAt ?? null, e.signedAt) ?? e.signedAt,
  };
}

/** Valeur de `profiles.plus_until` : jusqu'à quand Minimoa+ est ouvert. Null si jamais ou plus du tout. */
export function plusUntilOf(s: SubscriptionState | null): string | null {
  if (!s) return null;
  switch (s.status) {
    case 'trial':
    case 'active':
      return s.expiresAt;
    case 'grace':
      return later(s.graceUntil, s.expiresAt);
    case 'billing_retry':
    case 'expired':
      return s.expiresAt;
    case 'refunded':
    case 'revoked':
      return s.revokedAt;
  }
}

export type PlusPhase = 'none' | 'trial' | 'active' | 'grace' | 'billing_retry' | 'expired' | 'refunded' | 'revoked';

/** État lisible pour l'app à l'instant `now` (un essai dont l'échéance est passée sans nouvelles est expiré). */
export interface SubscriptionView {
  phase: PlusPhase;
  plus: boolean;
  plan: Plan | null;
  trialEndsAt: string | null;
  /** Fin de la période en cours (ou de l'accès, si l'abonnement ne se renouvelle pas). */
  currentPeriodEndsAt: string | null;
  willRenew: boolean;
  /** Date du prochain paiement, si le renouvellement est prévu. */
  renewsAt: string | null;
}

export function subscriptionView(s: SubscriptionState | null, now: Date): SubscriptionView {
  if (!s) return { phase: 'none', plus: false, plan: null, trialEndsAt: null, currentPeriodEndsAt: null, willRenew: false, renewsAt: null };
  const until = plusUntilOf(s);
  const plus = until !== null && ms(until) > now.getTime();
  let phase: PlusPhase = s.status;
  if (!plus && (s.status === 'trial' || s.status === 'active' || s.status === 'grace')) phase = 'expired';
  const live = phase === 'trial' || phase === 'active' || phase === 'grace' || phase === 'billing_retry';
  const willRenew = live && s.autoRenew;
  return {
    phase,
    plus,
    plan: s.plan,
    trialEndsAt: phase === 'trial' ? s.trialEndsAt : null,
    currentPeriodEndsAt: s.expiresAt,
    willRenew,
    renewsAt: willRenew && phase !== 'billing_retry' ? s.expiresAt : null,
  };
}

/**
 * Le rappel d'essai est dû à partir du jour 5 (soit `TRIAL_DAYS - TRIAL_REMINDER_DAY` jours avant la fin),
 * tant que l'essai court, qu'il va se transformer en paiement et qu'aucun rappel n'est parti pour cet essai.
 */
export function trialReminderDue(s: SubscriptionState, reminderSentFor: string | null, now: Date): boolean {
  if (s.status !== 'trial' || s.trialEndsAt === null || !s.autoRenew) return false;
  if (reminderSentFor === s.trialEndsAt) return false;
  const end = ms(s.trialEndsAt);
  const remindAt = end - (TRIAL_DAYS - TRIAL_REMINDER_DAY) * 86_400_000;
  return now.getTime() >= remindAt && now.getTime() < end;
}

/** Instant où le rappel d'un essai devient dû (pour la requête du minuteur). */
export const trialReminderAt = (trialEndsAt: string): string => new Date(ms(trialEndsAt) - (TRIAL_DAYS - TRIAL_REMINDER_DAY) * 86_400_000).toISOString();
