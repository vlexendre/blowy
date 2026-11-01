import type { SubscriptionState } from '@blowy/domain';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type {
  BillingEnvironment,
  BillingProviderKind,
  DerivedGrantDraft,
  GrantRecord,
  SubscriptionRecord,
} from '../../domain/index.js';

export interface SubscriptionUpsert {
  readonly userId: string;
  readonly provider: BillingProviderKind;
  readonly environment: BillingEnvironment;
  readonly entitlementId: string;
  readonly state: SubscriptionState;
  readonly productId: string | null;
  readonly store: string | null;
  readonly periodType: string | null;
  readonly currentPeriodEndsAt: Date | null;
  readonly gracePeriodEndsAt: Date | null;
  readonly lastProviderEventAt?: Date | null;
  readonly lastReconciledAt?: Date | null;
}

/** Repository abonnements + droits + bénéfices mensuels (tables écrites par economy uniquement). */
export interface EntitlementRepository {
  /** Verrouille (FOR UPDATE) les abonnements d'un utilisateur — après le verrou User. */
  lockSubscriptions(scope: TxScope, userId: string): Promise<SubscriptionRecord[]>;
  upsertSubscription(scope: TxScope, data: SubscriptionUpsert): Promise<SubscriptionRecord>;
  listSubscriptions(userId: string): Promise<SubscriptionRecord[]>;
  /** Abonnements à re-vérifier (actifs dont l'échéance est passée ou réconciliation ancienne). */
  listSubscriptionsToReconcile(now: Date, staleBefore: Date, limit: number): Promise<SubscriptionRecord[]>;

  /** Droits non révoqués d'un utilisateur (bénéficiaire). Lecture hors transaction possible. */
  listLiveGrants(userId: string, at: Date, scope?: TxScope): Promise<GrantRecord[]>;
  /** Assure le grant propre lié à un abonnement (crée ou met à jour l'échéance). */
  upsertOwnGrant(scope: TxScope, sub: SubscriptionRecord, endsAt: Date | null, source: 'STORE_SUBSCRIPTION' | 'LOCAL_DEMO'): Promise<GrantRecord>;
  revokeOwnGrants(scope: TxScope, subscriptionId: string, reason: string): Promise<number>;
  createDerivedGrant(scope: TxScope, draft: DerivedGrantDraft): Promise<GrantRecord>;
  /** Révoque les droits dérivés DONT l'utilisateur est la source (perte du droit payant). */
  revokeDerivedFrom(scope: TxScope, holderUserId: string, reason: string): Promise<GrantRecord[]>;
  /** Révoque les droits dérivés liés à une relation (rupture). */
  revokeDerivedForRelationship(scope: TxScope, relationshipId: string, reason: string): Promise<GrantRecord[]>;
  /** Met à jour l'échéance des dérivés d'un titulaire (renouvellement). */
  extendDerivedFrom(scope: TxScope, holderUserId: string, endsAt: Date | null): Promise<void>;
  /** Dérivés expirés (endsAt passé, non révoqués) à clore par le job. */
  listExpiredDerived(now: Date, limit: number): Promise<GrantRecord[]>;
  revokeGrant(scope: TxScope, grantId: string, reason: string): Promise<void>;

  /** Insère le versement mensuel ; renvoie null si (user, période) existe déjà (UNIQUE). */
  insertMonthlyBenefit(scope: TxScope, data: { userId: string; period: string; subscriptionId: string; ledgerEntryId: string; freezesGranted: number; coinsGranted: number }): Promise<{ id: string } | null>;
  hasMonthlyBenefit(scope: TxScope, userId: string, period: string): Promise<boolean>;
  /** Titulaires potentiellement éligibles au versement du mois (abonnements payants). */
  listMonthlyCandidates(period: string, environments: readonly BillingEnvironment[], limit: number, afterUserId: string | null): Promise<{ userId: string; subscriptionId: string; state: SubscriptionState }[]>;
}
export const ENTITLEMENT_REPOSITORY = Symbol('EntitlementRepository');
