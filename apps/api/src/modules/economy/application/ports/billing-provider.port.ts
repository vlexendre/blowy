import type { IntegrationMode } from '@blowy/api-contract';
import type { BillingEnvironment, BillingProviderKind, ProviderCustomerSnapshot } from '../../domain/index.js';

/**
 * Port fournisseur de facturation (Ports & Adapters).
 * Implémentations : `RevenueCatBillingProvider` (réel) et `LocalDemoBillingProvider`
 * (déterministe, INTERDIT en production — refusé au démarrage).
 */
export interface BillingProvider {
  readonly kind: BillingProviderKind;
  /** Mode affiché honnêtement aux clients (jamais LIVE pour la démo). */
  readonly mode: IntegrationMode;
  /** Environnements store dont les droits sont acceptés (sandbox/prod séparés). */
  readonly acceptedEnvironments: ReadonlySet<BillingEnvironment>;
  /**
   * Snapshot AUTORITAIRE de l'état client chez le fournisseur (RevenueCat : GET /v1/subscribers).
   * Appel réseau : jamais sous verrou transactionnel.
   */
  fetchCustomer(appUserId: string): Promise<ProviderCustomerSnapshot>;
}
export const BILLING_PROVIDER = Symbol('BillingProvider');

/** Authentification d'un webhook entrant (header Authorization configuré dans le dashboard). */
export interface WebhookAuthenticator {
  isAuthentic(authorizationHeader: string | undefined): boolean;
}
export const WEBHOOK_AUTHENTICATOR = Symbol('WebhookAuthenticator');

/** Événement webhook normalisé (indépendant du format fournisseur). */
export interface NormalizedWebhookEvent {
  readonly providerEventId: string;
  readonly type: string;
  readonly eventAt: Date;
  readonly environment: BillingEnvironment;
  /** Identifiants candidats (app_user_id, original_app_user_id, aliases) — un seul est un id Blowy. */
  readonly appUserIds: readonly string[];
  readonly productId: string | null;
  readonly newProductId: string | null;
  readonly entitlementIds: readonly string[];
  readonly periodType: string | null;
  readonly purchasedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly gracePeriodExpiresAt: Date | null;
  readonly store: string | null;
  readonly transactionId: string | null;
  readonly originalTransactionId: string | null;
  readonly cancelReason: string | null;
  readonly expirationReason: string | null;
  readonly transferredFrom: readonly string[];
  readonly transferredTo: readonly string[];
}

/**
 * Planification d'une réconciliation APRÈS commit (jamais sous verrou ni dans la requête webhook).
 * Implémentation : file en mémoire du processus ; filet de sécurité = job périodique qui reprend
 * tout abonnement dont `lastProviderEventAt > lastReconciledAt`.
 */
export interface ReconcileScheduler {
  schedule(userId: string, cause: string): void;
}
export const RECONCILE_SCHEDULER = Symbol('ReconcileScheduler');
