import { Global, Module, type Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Db } from '@blowy/database';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock } from '../../shared/application/clock.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import type { RelationshipReader } from '../../shared/application/ports/relationship-reader.port.js';
import type { Logger } from '../../shared/infrastructure/logging/logger.js';
import { CLOCK, COMMAND_BUS, DB, ENTITLEMENTS_READER, LOGGER, RELATIONSHIP_READER, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { BILLING_PROVIDER } from './application/ports/billing-provider.port.js';
import { BILLING_RECORD_REPOSITORY } from './application/ports/billing-record.repository.js';
import { ADMIN_ECONOMY } from './application/use-cases/admin-economy.use-cases.js';
import { PurchaseCatalogItemUseCase } from './application/use-cases/purchase-catalog-item.use-case.js';
import { UseStreakFreezeUseCase } from './application/use-cases/use-streak-freeze.use-case.js';
import { GetCatalogQuery, GetMySubscriptionQuery, GetWalletQuery } from './application/use-cases/queries.js';
import { SyncPurchasesUseCase } from './application/use-cases/sync-purchases.use-case.js';
import { ReceiveWebhookUseCase } from './application/use-cases/process-webhook.use-case.js';
import { LocalDemoPurchaseUseCase } from './application/use-cases/local-demo-purchase.use-case.js';
import { composeEconomy, type EconomyGraph } from './economy.composition.js';
import { ECONOMY_CONFIG, loadEconomyConfig, type EconomyConfig } from './infrastructure/config/economy-config.js';
import { InProcessReconcileScheduler } from './infrastructure/reconcile-scheduler.js';
import { ECONOMY_GRAPH_TOKEN, EconomyController, RevenueCatWebhookController, StripeWebhookController } from './interface/http/economy.controller.js';
import { SEAT_PAYMENT_SINK, type SeatPaymentSink } from '../../shared/application/ports/seat-payment-sink.port.js';
import { DUO_ALLOWANCE } from '../../shared/application/ports/duo-allowance.port.js';

/** Implémentation économie du port `SeatFundingPort` d'outings (T3), consommée par OutingsModule. */
export const ECONOMY_SEAT_FUNDING = Symbol.for('blowy.economy.seat_funding');

export const ECONOMY_GRAPH = ECONOMY_GRAPH_TOKEN;
/** Consommateurs outbox et jobs exposés au worker (agent C les enregistre dans worker.ts). */
export const ECONOMY_OUTBOX_CONSUMERS = Symbol('EconomyOutboxConsumers');
export const ECONOMY_JOBS = Symbol('EconomyJobs');

const fromGraph = <K extends keyof EconomyGraph>(provide: unknown, key: K): Provider => ({ provide: provide as symbol, useFactory: (g: EconomyGraph) => g[key], inject: [ECONOMY_GRAPH] });

/**
 * Composition root Nest du module économie. @Global : fournit le VRAI `ENTITLEMENTS_READER`
 * (remplace l'adapter par défaut du CoreModule) et `ADMIN_ECONOMY` pour le module admin.
 * La configuration est validée au démarrage : BILLING_PROVIDER=local_demo refusé en production.
 */
@Global()
@Module({
  controllers: [EconomyController, RevenueCatWebhookController, StripeWebhookController],
  providers: [
    { provide: ECONOMY_CONFIG, useFactory: () => loadEconomyConfig() },
    {
      provide: ECONOMY_GRAPH,
      useFactory: (config: EconomyConfig, db: Db, uow: UnitOfWork, bus: CommandBus, clock: Clock, relationships: RelationshipReader, logger: Logger, refs: ModuleRef) =>
        composeEconomy({
          config,
          db,
          uow,
          bus,
          clock,
          relationships,
          logger,
          scheduler: (r) => new InProcessReconcileScheduler((u) => r.execute(u), logger),
          // Résolution tardive (le module outings consomme aussi ECONOMY_SEAT_FUNDING) : aucun cycle d'injection.
          seatPaymentSink: () => refs.get<SeatPaymentSink>(SEAT_PAYMENT_SINK, { strict: false }),
        }),
      inject: [ECONOMY_CONFIG, DB, UNIT_OF_WORK, COMMAND_BUS, CLOCK, RELATIONSHIP_READER, LOGGER, ModuleRef],
    },
    { provide: ECONOMY_SEAT_FUNDING, useFactory: (g: EconomyGraph) => g.payments.seatFunding, inject: [ECONOMY_GRAPH] },
    { provide: DUO_ALLOWANCE, useFactory: (g: EconomyGraph) => g.payments.queries, inject: [ECONOMY_GRAPH] },
    fromGraph(BILLING_PROVIDER, 'provider'),
    { provide: BILLING_RECORD_REPOSITORY, useFactory: (g: EconomyGraph) => g.repositories.records, inject: [ECONOMY_GRAPH] },
    fromGraph(ENTITLEMENTS_READER, 'entitlementsReader'),
    fromGraph(ADMIN_ECONOMY, 'admin'),
    fromGraph(ECONOMY_OUTBOX_CONSUMERS, 'outboxConsumers'),
    fromGraph(ECONOMY_JOBS, 'jobs'),
    fromGraph(GetCatalogQuery, 'getCatalog'),
    fromGraph(GetWalletQuery, 'getWallet'),
    fromGraph(PurchaseCatalogItemUseCase, 'purchaseCatalogItem'),
    fromGraph(UseStreakFreezeUseCase, 'useStreakFreeze'),
    fromGraph(GetMySubscriptionQuery, 'subscriptionView'),
    fromGraph(SyncPurchasesUseCase, 'sync'),
    fromGraph(ReceiveWebhookUseCase, 'receiveWebhook'),
    fromGraph(LocalDemoPurchaseUseCase, 'localDemo'),
  ],
  exports: [ENTITLEMENTS_READER, ADMIN_ECONOMY, ECONOMY_OUTBOX_CONSUMERS, ECONOMY_JOBS, ECONOMY_GRAPH, ECONOMY_SEAT_FUNDING, DUO_ALLOWANCE],
})
export class EconomyModule {}
