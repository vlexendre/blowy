/**
 * CoreModule (global) : composition root des briques transverses, écrites une seule fois.
 * Les modules métier n'instancient jamais leur propre bus, horloge, UoW ou client DB.
 */
import { Global, Module, type DynamicModule, type Provider } from '@nestjs/common';
import type { Db } from '@blowy/database';
import type { AppConfig } from '../config/env.js';
import { CommandBus, type IdempotencyStore } from './application/command-bus.js';
import type { Clock } from './application/clock.js';
import type { UnitOfWork } from './application/unit-of-work.js';
import { PrismaBlockReader } from './infrastructure/prisma/prisma-block.reader.js';
import { PrismaIdempotencyStore } from './infrastructure/prisma/prisma-idempotency.store.js';
import { createDbFromUrl } from './infrastructure/prisma/prisma.service.js';
import { PrismaUnitOfWork } from './infrastructure/prisma/prisma-unit-of-work.js';
import { createLogger } from './infrastructure/logging/logger.js';
import { CryptoRandom, SystemClock } from './infrastructure/system-clock.js';
import { NoopRealtimePublisher } from './infrastructure/outbox/noop-realtime.publisher.js';
import { EventPublisher } from './application/event-publisher.js';
import type { ProjectionWriter } from './application/projection.js';
import { PrismaProjectionReader, PrismaProjectionWriter } from './infrastructure/prisma/prisma-projection.js';
import { PrismaParticipationReader } from './infrastructure/prisma/prisma-participation.reader.js';
import { createEngineGateway } from './infrastructure/engine/engine.factory.js';
import {
  APP_CONFIG,
  BLOCK_READER,
  CLOCK,
  COMMAND_BUS,
  DB,
  IDEMPOTENCY_STORE,
  LOGGER,
  RANDOM,
  REALTIME_PUBLISHER,
  UNIT_OF_WORK,
  ENGINE_GATEWAY,
  EVENT_PUBLISHER,
  PARTICIPATION_READER,
  PROJECTION_READER,
  PROJECTION_WRITER,
} from './shared.tokens.js';

export interface CoreOverrides {
  clock?: Clock;
  db?: Db;
  realtime?: unknown;
  engine?: unknown;
}

@Global()
@Module({})
export class CoreModule {
  static forRoot(config: AppConfig, overrides: CoreOverrides = {}): DynamicModule {
    const providers: Provider[] = [
      { provide: APP_CONFIG, useValue: config },
      { provide: LOGGER, useFactory: () => createLogger(config.LOG_LEVEL, { env: config.BLOWY_ENV }) },
      overrides.db ? { provide: DB, useValue: overrides.db } : { provide: DB, useFactory: () => createDbFromUrl(config.DATABASE_URL) },
      overrides.clock ? { provide: CLOCK, useValue: overrides.clock } : { provide: CLOCK, useClass: SystemClock },
      { provide: RANDOM, useFactory: (c: Clock) => new CryptoRandom(c), inject: [CLOCK] },
      { provide: UNIT_OF_WORK, useFactory: (db: Db, c: Clock) => new PrismaUnitOfWork(db, c), inject: [DB, CLOCK] },
      { provide: IDEMPOTENCY_STORE, useClass: PrismaIdempotencyStore },
      { provide: COMMAND_BUS, useFactory: (u: UnitOfWork, s: IdempotencyStore) => new CommandBus(u, s), inject: [UNIT_OF_WORK, IDEMPOTENCY_STORE] },
      { provide: BLOCK_READER, useFactory: (db: Db) => new PrismaBlockReader(db), inject: [DB] },
      { provide: PROJECTION_WRITER, useClass: PrismaProjectionWriter },
      { provide: PROJECTION_READER, useFactory: (db: Db) => new PrismaProjectionReader(db), inject: [DB] },
      { provide: EVENT_PUBLISHER, useFactory: (w: ProjectionWriter) => new EventPublisher(w), inject: [PROJECTION_WRITER] },
      { provide: PARTICIPATION_READER, useFactory: (db: Db) => new PrismaParticipationReader(db), inject: [DB] },
      overrides.engine ? { provide: ENGINE_GATEWAY, useValue: overrides.engine } : { provide: ENGINE_GATEWAY, useFactory: createEngineGateway },
      overrides.realtime ? { provide: REALTIME_PUBLISHER, useValue: overrides.realtime } : { provide: REALTIME_PUBLISHER, useClass: NoopRealtimePublisher },
    ];
    return {
      module: CoreModule,
      providers,
      exports: providers.map((p) => (p as { provide: symbol }).provide),
    };
  }
}
