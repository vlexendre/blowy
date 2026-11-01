/**
 * Module racine HTTP/WS. CoreModule (global) fournit les briques transverses ; chaque module
 * métier est sa propre composition root.
 */
import { Module, type DynamicModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core';
import type { Redis } from 'ioredis';
import type { AppConfig } from './config/env.js';
import { CoreModule, type CoreOverrides } from './shared/core.module.js';
import { ApiErrorFilter } from './shared/interface/error.filter.js';
import { AuthGuard, type SessionResolver } from './shared/interface/auth.guard.js';
import type { Logger } from './shared/infrastructure/logging/logger.js';
import { LOGGER, REDIS, SESSION_RESOLVER } from './shared/shared.tokens.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { FEATURE_MODULES } from './modules/feature-modules.js';

export interface AppModuleOptions {
  config: AppConfig;
  redis: Redis | null;
  overrides?: CoreOverrides;
}

@Module({})
export class AppModule {
  static forRoot(opts: AppModuleOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [
        CoreModule.forRoot(opts.config, opts.overrides),
        RedisHolderModule.forRoot(opts.redis),
        AuthModule,
        HealthModule,
        UsersModule,
        ...FEATURE_MODULES,
      ],
      providers: [
        { provide: APP_GUARD, useFactory: (r: Reflector, s: SessionResolver) => new AuthGuard(r, s), inject: [Reflector, SESSION_RESOLVER] },
        { provide: APP_FILTER, useFactory: (l: Logger) => new ApiErrorFilter(l), inject: [LOGGER] },
      ],
    };
  }
}

@Module({})
class RedisHolderModule {
  static forRoot(redis: Redis | null): DynamicModule {
    return { module: RedisHolderModule, global: true, providers: [{ provide: REDIS, useValue: redis }], exports: [REDIS] };
  }
}
