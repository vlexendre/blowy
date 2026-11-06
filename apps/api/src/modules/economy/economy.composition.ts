import type { Db } from '@blowy/database';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock } from '../../shared/application/clock.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import type { RelationshipReader } from '../../shared/application/ports/relationship-reader.port.js';
import type { BillingProvider, ReconcileScheduler, WebhookAuthenticator } from './application/ports/billing-provider.port.js';
import type { EconomyParamsProvider } from './application/ports/economy-config.port.js';
import { EntitlementStateService } from './application/entitlement-state.service.js';
import { StoreCreditService } from './application/store-credit.service.js';
import { WebhookStrategyRegistry } from './application/webhook/webhook-strategies.js';
import { PurchaseCatalogItemUseCase } from './application/use-cases/purchase-catalog-item.use-case.js';
import { UseStreakFreezeUseCase } from './application/use-cases/use-streak-freeze.use-case.js';
import { ReconcileCustomerUseCase } from './application/use-cases/reconcile-customer.use-case.js';
import { ProcessWebhookEventUseCase, ReceiveWebhookUseCase } from './application/use-cases/process-webhook.use-case.js';
import { EconomyEntitlementsReader, GetCatalogQuery, GetMySubscriptionQuery, GetWalletQuery } from './application/use-cases/queries.js';
import { SyncPurchasesUseCase } from './application/use-cases/sync-purchases.use-case.js';
import { GrantMonthlyBenefitsUseCase } from './application/use-cases/grant-monthly-benefits.use-case.js';
import {
  ConsumeBoostUseCase,
  ExpireDerivedEntitlementsUseCase,
  PeriodicReconciliationUseCase,
  RefundExpiredBoostsUseCase,
  RelationshipEntitlementsUseCase,
} from './application/use-cases/entitlement-jobs.use-case.js';
import { AdminEconomyUseCases } from './application/use-cases/admin-economy.use-cases.js';
import { LocalDemoPurchaseUseCase, type LocalDemoControl } from './application/use-cases/local-demo-purchase.use-case.js';
import type { EconomyConfig } from './infrastructure/config/economy-config.js';
import { TuningEconomyParams } from './infrastructure/config/economy-params.js';
import { LocalDemoBillingProvider } from './infrastructure/local-demo/local-demo-billing.provider.js';
import { RevenueCatBillingProvider } from './infrastructure/revenuecat/revenuecat-billing.provider.js';
import { AuthorizationHeaderAuthenticator, RejectAllAuthenticator, parseRevenueCatWebhook } from './infrastructure/revenuecat/revenuecat-webhook.js';
import { PrismaLedgerRepository } from './infrastructure/prisma/prisma-ledger.repository.js';
import { PrismaCatalogRepository } from './infrastructure/prisma/prisma-catalog.repository.js';
import { PrismaEntitlementRepository } from './infrastructure/prisma/prisma-entitlement.repository.js';
import { PrismaBillingRecordRepository, PrismaUserDirectory } from './infrastructure/prisma/prisma-billing-record.repository.js';
import { EconomyReferralRewardConsumer, EconomyRelationshipConsumer } from './interface/economy-outbox.consumer.js';
import { GrantReferralRewardUseCase } from './application/use-cases/referral-reward.use-case.js';
import { EconomyJobs } from './interface/economy.jobs.js';
import type { SeatPaymentSink } from '../../shared/application/ports/seat-payment-sink.port.js';
import type { LoggerPort } from '../../shared/application/logger.port.js';
import type { PaymentsParams } from './domain/index.js';
import type { PaymentProvider } from './application/payments/ports.js';
import { EconomySeatFunding } from './application/payments/seat-funding.service.js';
import { HandleStripeWebhookUseCase } from './application/payments/stripe-webhook.use-case.js';
import { PaymentsQueries, PlusCheckoutUseCase, ProcessRefundsUseCase, VenueCompensationConsumer } from './application/payments/payments.use-cases.js';
import { loadPaymentsConfig, type PaymentsConfig } from './infrastructure/config/payments-config.js';
import { defaultPaymentsParams } from './infrastructure/config/payments-params.js';
import { LocalDemoPaymentProvider } from './infrastructure/local-demo/local-demo-payment.provider.js';
import { PrismaEconomyJournal, PrismaSeatDirectory } from './infrastructure/prisma/prisma-economy-journal.js';
import { StripePaymentProvider } from './infrastructure/stripe/stripe-payment.provider.js';
import { StripeWebhookVerifier } from './infrastructure/stripe/stripe-webhook-verifier.js';

export interface EconomyDeps {
  db: Db;
  uow: UnitOfWork;
  bus: CommandBus;
  clock: Clock;
  relationships: RelationshipReader;
  config: EconomyConfig;
  /** Remplacements (tests) : fournisseur, planificateur, paramètres. */
  provider?: BillingProvider;
  scheduler?: ReconcileScheduler | ((reconcile: ReconcileCustomerUseCase) => ReconcileScheduler);
  params?: EconomyParamsProvider;
  /** V5 (T3) : configuration paiements (défaut : variables d'environnement validées). */
  payments?: PaymentsConfig;
  paymentProvider?: PaymentProvider | null;
  paymentsParams?: () => PaymentsParams;
  /** Port `outings` (écrit les places) résolu tardivement : évite le cycle economy ↔ outings. */
  seatPaymentSink?: () => SeatPaymentSink;
  fetchImpl?: typeof fetch;
  logger?: Pick<LoggerPort, 'warn'>;
}

/** Strategy de sélection du fournisseur de PAIEMENT (Stripe | démo locale | aucun). */
export function selectPaymentProvider(config: PaymentsConfig, fetchImpl: typeof fetch = fetch): PaymentProvider | null {
  if (config.provider === 'none') return null;
  if (config.provider === 'local_demo') return new LocalDemoPaymentProvider(config.env);
  return new StripePaymentProvider({ ...config.stripe }, fetchImpl);
}

/** Strategy de sélection du fournisseur selon la configuration validée. */
export function selectBillingProvider(config: EconomyConfig, clock: Clock): BillingProvider {
  if (config.provider === 'local_demo') {
    if (config.env === 'production') throw new Error('LocalDemoBillingProvider interdit en production');
    return new LocalDemoBillingProvider(() => clock.now());
  }
  return new RevenueCatBillingProvider({ ...config.revenueCat!, isProduction: config.env === 'production' }, fetch, () => clock.now());
}

export function selectWebhookAuthenticator(config: EconomyConfig): WebhookAuthenticator {
  const secret = config.revenueCat?.webhookAuth ?? config.localWebhookAuth;
  return secret ? new AuthorizationHeaderAuthenticator(secret) : new RejectAllAuthenticator();
}

/** Composition root PURE du module (aucune dépendance Nest) — utilisée par le module, le worker et les tests. */
export function composeEconomy(deps: EconomyDeps) {
  const { db, uow, bus, clock, relationships } = deps;
  const params = deps.params ?? new TuningEconomyParams();
  const provider = deps.provider ?? selectBillingProvider(deps.config, clock);
  const ledger = new PrismaLedgerRepository(db);
  const catalog = new PrismaCatalogRepository(db);
  const entitlements = new PrismaEntitlementRepository(db);
  const records = new PrismaBillingRecordRepository(db);
  const users = new PrismaUserDirectory(db);

  const paymentsConfig = deps.payments ?? loadPaymentsConfig();
  const paymentProvider = deps.paymentProvider !== undefined ? deps.paymentProvider : selectPaymentProvider(paymentsConfig, deps.fetchImpl);
  const state = new EntitlementStateService(entitlements, provider, params);
  const credits = new StoreCreditService(ledger, records);
  const reconcile = new ReconcileCustomerUseCase(uow, provider, entitlements, state, credits, relationships, users);
  const scheduler = typeof deps.scheduler === 'function' ? deps.scheduler(reconcile) : deps.scheduler;
  if (!scheduler) throw new Error('ReconcileScheduler requis');
  const processWebhook = new ProcessWebhookEventUseCase(uow, records, entitlements, state, credits, new WebhookStrategyRegistry(), provider, relationships, users, parseRevenueCatWebhook, scheduler);
  const receiveWebhook = new ReceiveWebhookUseCase(selectWebhookAuthenticator(deps.config), parseRevenueCatWebhook, records, processWebhook, clock, 'revenuecat');
  const subscriptionView = new GetMySubscriptionQuery(entitlements, state, provider, params, clock);
  const sync = new SyncPurchasesUseCase(reconcile, subscriptionView);
  const monthly = new GrantMonthlyBenefitsUseCase(uow, ledger, catalog, entitlements, state, params, clock);
  const periodic = new PeriodicReconciliationUseCase(entitlements, reconcile, clock);
  const derivedExpiry = new ExpireDerivedEntitlementsUseCase(uow, entitlements, state, clock);
  const boostRefund = new RefundExpiredBoostsUseCase(uow, catalog, ledger, clock);
  const relationshipEntitlements = new RelationshipEntitlementsUseCase(entitlements, state);

  // ---- V5 (T3) : paiements, crédits, remboursements, compensation lieu, Blowy+ Stripe.
  const paymentsParams = deps.paymentsParams ?? defaultPaymentsParams;
  const journal = new PrismaEconomyJournal(db);
  const seats = new PrismaSeatDirectory(db);
  const keysOf = (userId: string, at: Date, scope?: Parameters<EntitlementStateService['keysOf']>[2]) => state.keysOf(userId, at, scope);
  const seatFunding = new EconomySeatFunding(uow, journal, paymentProvider, keysOf, paymentsParams);
  const noSink = (): SeatPaymentSink => {
    throw new Error('SeatPaymentSink (outings) non branché');
  };
  const sink = deps.seatPaymentSink ?? noSink;
  const verifier = new StripeWebhookVerifier(paymentsConfig.provider === 'stripe' ? paymentsConfig.stripe.webhookSecret : null, paymentsConfig.provider === 'stripe' ? paymentsConfig.stripe.toleranceSeconds : 300, paymentsConfig.provider === 'stripe' && paymentsConfig.stripe.livemode);
  const stripeWebhook = new HandleStripeWebhookUseCase(verifier, records, uow, journal, seatFunding, sink, users, paymentsParams, clock);
  const refunds = new ProcessRefundsUseCase(uow, journal, paymentProvider, () => stripeWebhook, deps.logger ?? { warn: () => undefined });
  const localDemoControl = provider instanceof LocalDemoBillingProvider ? (provider as LocalDemoControl) : null;
  const localDemo = new LocalDemoPurchaseUseCase(provider, localDemoControl, records, sync, bus);
  const localDemoPlus = localDemoControl ? async (userId: string, commandId: string) => void (await localDemo.execute(userId, commandId, { action: 'SUBSCRIBE', productId: 'blowy_plus_monthly', trial: false })) : null;
  const plusCheckout = new PlusCheckoutUseCase(provider.mode, (u, at) => state.keysOf(u, at), localDemoPlus, clock);
  const paymentsQueries = new PaymentsQueries(seatFunding, seats, paymentProvider, (u, at) => state.keysOf(u, at), paymentsParams, clock);

  return {
    provider,
    params,
    payments: { config: paymentsConfig, provider: paymentProvider, params: paymentsParams, journal, seatFunding, stripeWebhook, refunds, plusCheckout, queries: paymentsQueries },
    repositories: { ledger, catalog, entitlements, records },
    entitlementsReader: new EconomyEntitlementsReader(state, params),
    getCatalog: new GetCatalogQuery(catalog),
    getWallet: new GetWalletQuery(ledger, catalog, clock),
    purchaseCatalogItem: new PurchaseCatalogItemUseCase(bus, ledger, catalog, params),
    useStreakFreeze: new UseStreakFreezeUseCase(bus, catalog),
    subscriptionView,
    sync,
    reconcile,
    processWebhook,
    receiveWebhook,
    monthly,
    consumeBoost: new ConsumeBoostUseCase(uow, catalog),
    localDemo,
    admin: new AdminEconomyUseCases(bus, ledger, records, processWebhook, reconcile),
    referralReward: new GrantReferralRewardUseCase(ledger),
    outboxConsumers: [new EconomyRelationshipConsumer(relationshipEntitlements), new EconomyReferralRewardConsumer(new GrantReferralRewardUseCase(ledger)), new VenueCompensationConsumer(journal, seats, paymentsParams)],
    jobs: new EconomyJobs(monthly, periodic, derivedExpiry, boostRefund, processWebhook, records, refunds, stripeWebhook),
  };
}
export type EconomyGraph = ReturnType<typeof composeEconomy>;
