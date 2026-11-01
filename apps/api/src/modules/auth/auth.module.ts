/** Composition root du module auth : lie les ports aux adapters (Strategy selon la config). */
import { Module } from '@nestjs/common';
import type { AppConfig } from '../../config/env.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import type { Db } from '@blowy/database';
import { APP_CONFIG, CLOCK, DB, RANDOM, SESSION_RESOLVER, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { ListSessionsQuery, RevokeSessionUseCase } from './application/manage-sessions.use-case.js';
import { ACCOUNT_REPOSITORY, SESSION_REPOSITORY, type AccountRepository, type SessionRepository } from './application/ports/account.repository.js';
import { IDENTITY_PROVIDERS, type IdentityProvider } from './application/ports/identity-provider.port.js';
import { ResolveSessionUseCase } from './application/resolve-session.use-case.js';
import { SignInUseCase } from './application/sign-in.use-case.js';
import { FirebaseAuthProvider } from './infrastructure/firebase-auth.provider.js';
import { LocalAuthProvider } from './infrastructure/local-auth.provider.js';
import { PrismaAccountRepository, PrismaSessionRepository } from './infrastructure/prisma-account.repository.js';
import { AuthController } from './interface/auth.controller.js';

/** Strategy : fournisseurs actifs selon l'environnement (production = Firebase seul). */
export function selectIdentityProviders(cfg: AppConfig): Map<string, IdentityProvider> {
  const map = new Map<string, IdentityProvider>();
  if (cfg.FIREBASE_PROJECT_ID) {
    map.set('firebase', new FirebaseAuthProvider({ projectId: cfg.FIREBASE_PROJECT_ID, serviceAccountJson: cfg.FIREBASE_SERVICE_ACCOUNT_JSON, emulatorHost: cfg.FIREBASE_AUTH_EMULATOR_HOST }));
  }
  if (!cfg.isProduction && (cfg.AUTH_PROVIDER === 'local' || cfg.DEV_AUTH_BYPASS)) {
    map.set('local', new LocalAuthProvider(cfg.isProduction));
  }
  return map;
}

@Module({
  controllers: [AuthController],
  providers: [
    { provide: IDENTITY_PROVIDERS, useFactory: selectIdentityProviders, inject: [APP_CONFIG] },
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
    { provide: SESSION_REPOSITORY, useFactory: (db: Db) => new PrismaSessionRepository(db), inject: [DB] },
    {
      provide: SignInUseCase,
      useFactory: (p: Map<string, IdentityProvider>, u: UnitOfWork, a: AccountRepository, s: SessionRepository, c: Clock, r: RandomSource, cfg: AppConfig) =>
        new SignInUseCase(p, u, a, s, c, r, { sessionSecret: cfg.SESSION_SECRET, sessionTtlDays: cfg.SESSION_TTL_DAYS }),
      inject: [IDENTITY_PROVIDERS, UNIT_OF_WORK, ACCOUNT_REPOSITORY, SESSION_REPOSITORY, CLOCK, RANDOM, APP_CONFIG],
    },
    { provide: SESSION_RESOLVER, useFactory: (s: SessionRepository, c: Clock, cfg: AppConfig) => new ResolveSessionUseCase(s, c, cfg.SESSION_SECRET), inject: [SESSION_REPOSITORY, CLOCK, APP_CONFIG] },
    { provide: ListSessionsQuery, useFactory: (s: SessionRepository, c: Clock) => new ListSessionsQuery(s, c), inject: [SESSION_REPOSITORY, CLOCK] },
    { provide: RevokeSessionUseCase, useFactory: (u: UnitOfWork, s: SessionRepository) => new RevokeSessionUseCase(u, s), inject: [UNIT_OF_WORK, SESSION_REPOSITORY] },
  ],
  exports: [SESSION_RESOLVER],
})
export class AuthModule {}
