import { SHAREABLE_ENTITLEMENTS, type EntitlementKey, type EntitlementSource } from '@blowy/domain';
import type { BillingEnvironment } from './subscription.js';
import { invalid } from './errors.js';
import type { EconomyParams } from './params.js';

/** Identifiant d'entitlement RevenueCat (dashboard) ouvrant Blowy+. */
export const BLOWY_PLUS_ENTITLEMENT = 'blowy_plus';

/**
 * Droits fonctionnels ouverts par Blowy+ en V5 (D-020) : `PLUS_MONTHLY_BENEFITS` marque le titulaire
 * payant (toutes les sorties incluses + duos illimités, lus par outings/connections) ; `PLUS_DATE_SLOTS`
 * reste pour la lecture V4. Retirés : carte, indices, espèces premium, XP pet ×2 le week-end.
 */
export const PLUS_KEYS: readonly EntitlementKey[] = ['PLUS_DATE_SLOTS', 'PLUS_MONTHLY_BENEFITS'];
/** Clés V4 retirées en V5 (jamais plus accordées). */
export const RETIRED_PLUS_KEYS_V5: readonly EntitlementKey[] = ['PLUS_MAP', 'PLUS_HINTS', 'PLUS_PREMIUM_SPECIES', 'PLUS_WEEKEND_PET_XP'];

export interface GrantRecord {
  readonly id: string;
  readonly beneficiaryUserId: string;
  readonly entitlementId: string;
  readonly source: EntitlementSource;
  readonly environment: BillingEnvironment;
  readonly subscriptionId: string | null;
  readonly derivedFromUserId: string | null;
  readonly relationshipId: string | null;
  readonly startsAt: Date;
  readonly endsAt: Date | null;
  readonly revokedAt: Date | null;
}

export const isGrantLive = (g: Pick<GrantRecord, 'startsAt' | 'endsAt' | 'revokedAt'>, at: Date) =>
  g.revokedAt === null && g.startsAt.getTime() <= at.getTime() && (g.endsAt === null || g.endsAt.getTime() > at.getTime());

/** Clés ouvertes par UN grant (sans contrôle de validité). */
export function keysOfGrant(g: Pick<GrantRecord, 'source'>): readonly EntitlementKey[] {
  if (g.source === 'DERIVED_PARTNER') return SHAREABLE_ENTITLEMENTS.filter((k) => !RETIRED_PLUS_KEYS_V5.includes(k));
  if (g.source === 'STAFF_GRANT') return PLUS_KEYS.filter((k) => k !== 'PLUS_MONTHLY_BENEFITS');
  return PLUS_KEYS;
}

/** Grants effectifs à `at` dans les environnements acceptés. */
export function liveAcceptedGrants(grants: readonly GrantRecord[], at: Date, accepted: ReadonlySet<BillingEnvironment>): GrantRecord[] {
  return grants.filter(
    (g) => g.entitlementId === BLOWY_PLUS_ENTITLEMENT && isGrantLive(g, at) && accepted.has(g.environment) && (g.source !== 'LOCAL_DEMO' || accepted.has('LOCAL_DEMO')),
  );
}

/**
 * Clés de droits effectives d'un bénéficiaire à l'instant `at`.
 * - Grant propre (STORE_SUBSCRIPTION / STAFF_GRANT / LOCAL_DEMO) : toutes les clés Plus.
 *   STAFF_GRANT n'ouvre PAS les bénéfices mensuels (pas de pièces fabriquées hors paiement).
 * - Grant DERIVED_PARTNER : seulement SHAREABLE_ENTITLEMENTS (sans bénéfices mensuels ni espèces
 *   premium — l'adoption Pia/Suzie reste liée au titulaire).
 * - Seuls les grants d'un environnement accepté par la configuration comptent : en production,
 *   LOCAL_DEMO n'est jamais accepté (config refusée au démarrage) et SANDBOX seulement si
 *   explicitement activé (revue App Store).
 */
export function effectiveKeys(grants: readonly GrantRecord[], at: Date, accepted: ReadonlySet<BillingEnvironment>): Set<EntitlementKey> {
  const keys = new Set<EntitlementKey>();
  for (const g of liveAcceptedGrants(grants, at, accepted)) keysOfGrant(g).forEach((k) => keys.add(k));
  return keys;
}

export const dateSlotsFor = (keys: ReadonlySet<EntitlementKey>, params: EconomyParams) =>
  keys.has('PLUS_DATE_SLOTS') ? params.plusDateSlots : params.freeDateSlots;

/** Un grant qui peut être SOURCE d'un droit dérivé : uniquement un abonnement payé/essai propre. */
export const canSourceDerivation = (g: GrantRecord) => g.source === 'STORE_SUBSCRIPTION' || g.source === 'LOCAL_DEMO';

export interface DerivationPlanInput {
  readonly holderUserId: string;
  readonly partnerUserId: string;
  readonly relationshipId: string;
  /** Grants actuels du titulaire (pour trouver la source). */
  readonly holderGrants: readonly GrantRecord[];
  readonly at: Date;
  readonly accepted: ReadonlySet<BillingEnvironment>;
}

export interface DerivedGrantDraft {
  readonly beneficiaryUserId: string;
  readonly derivedFromUserId: string;
  readonly relationshipId: string;
  readonly environment: BillingEnvironment;
  readonly startsAt: Date;
  readonly endsAt: Date | null;
}

/**
 * Plan d'un droit dérivé pour le SEUL partenaire emménagé.
 * Non transitif : la source doit être un droit propre du titulaire, jamais un DERIVED_PARTNER.
 * L'échéance suit celle de la source (révoquée aussi explicitement à rupture/perte).
 */
export function planDerivedGrant(input: DerivationPlanInput): DerivedGrantDraft | null {
  if (input.holderUserId === input.partnerUserId) throw invalid('Auto-dérivation interdite.');
  const source = input.holderGrants
    .filter((g) => g.beneficiaryUserId === input.holderUserId && g.entitlementId === BLOWY_PLUS_ENTITLEMENT)
    .filter((g) => canSourceDerivation(g) && isGrantLive(g, input.at))
    .filter((g) => input.accepted.has(g.environment))
    .sort((a, b) => (b.endsAt?.getTime() ?? Infinity) - (a.endsAt?.getTime() ?? Infinity))[0];
  if (!source) return null;
  return {
    beneficiaryUserId: input.partnerUserId,
    derivedFromUserId: input.holderUserId,
    relationshipId: input.relationshipId,
    environment: source.environment,
    startsAt: input.at,
    endsAt: source.endsAt,
  };
}

/** Période mensuelle UTC 'YYYY-MM' (un versement par titulaire et par période). */
export const monthlyPeriod = (at: Date) => at.toISOString().slice(0, 7);

/**
 * Éligibilité aux bénéfices mensuels : titulaire avec droit propre payant (pas d'essai,
 * pas de dérivé, pas de grant staff). Le contrôle « une fois par (user, mois) » est garanti
 * par la contrainte UNIQUE MonthlyBenefitGrant(userId, period).
 */
export function isMonthlyBenefitEligible(subscriptionState: string, ownGrantLive: boolean): boolean {
  return ownGrantLive && (subscriptionState === 'ACTIVE' || subscriptionState === 'GRACE_PERIOD' || subscriptionState === 'CANCELLED_PENDING_EXPIRY');
}

/** Multiplicateur d'XP PET week-end (jamais XP Lien). `isWeekend` est calculé dans la timezone de l'utilisateur. */
export const weekendPetXpMultiplier = (keys: ReadonlySet<EntitlementKey>, isWeekend: boolean, params: EconomyParams) =>
  isWeekend && keys.has('PLUS_WEEKEND_PET_XP') ? params.plusWeekendPetXpMultiplier : 1;
