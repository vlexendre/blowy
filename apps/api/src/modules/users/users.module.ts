import { DEFAULT_TUNING } from '@blowy/tuning';
import { PREFERENCES_V5_REPOSITORY, type PreferencesV5Repository } from './application/ports/preferences-v5.repository.js';
import { PreferencesV5UseCases } from './application/preferences-v5.use-cases.js';
import { PrismaPreferencesV5Repository } from './infrastructure/prisma-preferences-v5.repository.js';
import { Global, Module } from '@nestjs/common';
import type { Db } from '@blowy/database';
import type { AppConfig } from '../../config/env.js';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import { APP_CONFIG, CLOCK, COMMAND_BUS, DB, RANDOM } from '../../shared/shared.tokens.js';
import { CompleteOnboardingUseCase } from './application/complete-onboarding.use-case.js';
import { GetConsentsQuery, RecordConsentsUseCase } from './application/consents.use-case.js';
import { GetSelfProfileQuery } from './application/get-self-profile.query.js';
import { EndPauseUseCase, StartPauseUseCase } from './application/pause.use-case.js';
import { USER_PROFILE_REPOSITORY, type UserProfileRepository } from './application/ports/user-profile.repository.js';
import { VERIFICATION_GATEWAY, type VerificationGateway } from './application/ports/verification.gateway.js';
import { UpdateProfileUseCase } from './application/update-profile.use-case.js';
import { UpdatePreferencesUseCase, UpdatePrivacyUseCase } from './application/update-settings.use-case.js';
import { StartVerificationUseCase, VERIFICATION_STARTER, type VerificationStarter } from './application/verification.use-case.js';
import { LocalDemoVerificationGateway, NotConfiguredVerificationGateway } from './infrastructure/local-demo-verification.gateway.js';
import { PrismaUserProfileRepository } from './infrastructure/prisma-user-profile.repository.js';
import { MeController } from './interface/me.controller.js';
import { ContactAvoidanceController } from './interface/contact-avoidance.controller.js';
import { CONTACT_AVOIDANCE_REPOSITORY, ContactAvoidanceUseCases, PHONE_VERIFIER, type ContactAvoidanceRepository, type PhoneVerifier } from './application/contact-avoidance.use-cases.js';
import { PrismaContactAvoidanceRepository } from './infrastructure/prisma-contact-avoidance.repository.js';
import { FirebasePhoneVerifier, LocalDemoPhoneVerifier } from './infrastructure/phone-verifiers.js';
import { deriveDigestKey, deriveOprfKey } from './domain/contact-avoidance.js';

/** V5.4 (A.6) : vérification du numéro — Firebase (production) ; démo locale hors production seulement. */
function selectPhoneVerifier(cfg: AppConfig): PhoneVerifier | null {
  const kind = cfg.PHONE_VERIFICATION_PROVIDER ?? (cfg.isProduction ? 'firebase' : 'local_demo');
  if (kind === 'local_demo') return cfg.isProduction ? null : new LocalDemoPhoneVerifier(cfg.isProduction);
  return cfg.FIREBASE_PROJECT_ID ? new FirebasePhoneVerifier(cfg.FIREBASE_PROJECT_ID) : null;
}

/** V5.4 (A.6) : clés OPRF dérivées du secret dédié ; en production sans secret → fonction indisponible (503). */
function contactAvoidanceKeys(cfg: AppConfig) {
  const secret = cfg.CONTACT_AVOIDANCE_SECRET ?? (cfg.isProduction ? null : `${cfg.SESSION_SECRET}|contact-avoidance`);
  return secret ? { oprfKey: deriveOprfKey(secret), digestKey: deriveDigestKey(secret) } : null;
}

/** Strategy : vérification démo en local/test ; Veriff (agent E) sinon, absent = NOT_CONFIGURED. */
function selectVerification(cfg: AppConfig): VerificationGateway {
  return cfg.VERIFICATION_PROVIDER === 'local_demo' && !cfg.isProduction ? new LocalDemoVerificationGateway(cfg.isProduction) : new NotConfiguredVerificationGateway();
}

type R = UserProfileRepository;
@Global()
@Module({
  controllers: [MeController, ContactAvoidanceController],
  providers: [
    { provide: USER_PROFILE_REPOSITORY, useFactory: (db: Db) => new PrismaUserProfileRepository(db), inject: [DB] },
    { provide: VERIFICATION_GATEWAY, useFactory: selectVerification, inject: [APP_CONFIG] },
    { provide: GetSelfProfileQuery, useFactory: (r: R, v: VerificationGateway, c: Clock) => new GetSelfProfileQuery(r, v, c), inject: [USER_PROFILE_REPOSITORY, VERIFICATION_GATEWAY, CLOCK] },
    { provide: UpdateProfileUseCase, useFactory: (b: CommandBus, r: R) => new UpdateProfileUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
    { provide: UpdatePreferencesUseCase, useFactory: (b: CommandBus, r: R) => new UpdatePreferencesUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
    { provide: UpdatePrivacyUseCase, useFactory: (b: CommandBus, r: R) => new UpdatePrivacyUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
    { provide: PREFERENCES_V5_REPOSITORY, useFactory: (db: Db) => new PrismaPreferencesV5Repository(db), inject: [DB] },
    { provide: RecordConsentsUseCase, useFactory: (b: CommandBus, r: R, p: PreferencesV5Repository) => new RecordConsentsUseCase(b, r, p), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY, PREFERENCES_V5_REPOSITORY] },
    {
      provide: PreferencesV5UseCases,
      useFactory: (p: PreferencesV5Repository, r: R, b: CommandBus, c: Clock) => new PreferencesV5UseCases(p, r, b, c, DEFAULT_TUNING),
      inject: [PREFERENCES_V5_REPOSITORY, USER_PROFILE_REPOSITORY, COMMAND_BUS, CLOCK],
    },
    { provide: GetConsentsQuery, useFactory: (r: R) => new GetConsentsQuery(r), inject: [USER_PROFILE_REPOSITORY] },
    { provide: StartPauseUseCase, useFactory: (b: CommandBus, r: R, rnd: RandomSource) => new StartPauseUseCase(b, r, rnd), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY, RANDOM] },
    { provide: EndPauseUseCase, useFactory: (b: CommandBus, r: R) => new EndPauseUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
    {
      provide: StartVerificationUseCase,
      useFactory: (b: CommandBus, r: R, v: VerificationGateway, rnd: RandomSource, d: VerificationStarter | null) => new StartVerificationUseCase(b, r, v, rnd, d ?? null),
      inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY, VERIFICATION_GATEWAY, RANDOM, { token: VERIFICATION_STARTER, optional: true }],
    },
    { provide: CONTACT_AVOIDANCE_REPOSITORY, useFactory: (db: Db) => new PrismaContactAvoidanceRepository(db), inject: [DB] },
    { provide: PHONE_VERIFIER, useFactory: selectPhoneVerifier, inject: [APP_CONFIG] },
    {
      provide: ContactAvoidanceUseCases,
      useFactory: (r: ContactAvoidanceRepository, b: CommandBus, v: PhoneVerifier | null, cfg: AppConfig) => new ContactAvoidanceUseCases(r, b, v, contactAvoidanceKeys(cfg)),
      inject: [CONTACT_AVOIDANCE_REPOSITORY, COMMAND_BUS, PHONE_VERIFIER, APP_CONFIG],
    },
    { provide: CompleteOnboardingUseCase, useFactory: (b: CommandBus, r: R) => new CompleteOnboardingUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
  ],
  exports: [StartPauseUseCase, USER_PROFILE_REPOSITORY, VERIFICATION_GATEWAY, GetSelfProfileQuery, RecordConsentsUseCase],
})
export class UsersModule {}
