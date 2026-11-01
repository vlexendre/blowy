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

/** Strategy : vérification démo en local/test ; Veriff (agent E) sinon, absent = NOT_CONFIGURED. */
function selectVerification(cfg: AppConfig): VerificationGateway {
  return cfg.VERIFICATION_PROVIDER === 'local_demo' && !cfg.isProduction ? new LocalDemoVerificationGateway(cfg.isProduction) : new NotConfiguredVerificationGateway();
}

type R = UserProfileRepository;
@Global()
@Module({
  controllers: [MeController],
  providers: [
    { provide: USER_PROFILE_REPOSITORY, useFactory: (db: Db) => new PrismaUserProfileRepository(db), inject: [DB] },
    { provide: VERIFICATION_GATEWAY, useFactory: selectVerification, inject: [APP_CONFIG] },
    { provide: GetSelfProfileQuery, useFactory: (r: R, v: VerificationGateway, c: Clock) => new GetSelfProfileQuery(r, v, c), inject: [USER_PROFILE_REPOSITORY, VERIFICATION_GATEWAY, CLOCK] },
    { provide: UpdateProfileUseCase, useFactory: (b: CommandBus, r: R) => new UpdateProfileUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
    { provide: UpdatePreferencesUseCase, useFactory: (b: CommandBus, r: R) => new UpdatePreferencesUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
    { provide: UpdatePrivacyUseCase, useFactory: (b: CommandBus, r: R) => new UpdatePrivacyUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
    { provide: RecordConsentsUseCase, useFactory: (b: CommandBus, r: R) => new RecordConsentsUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
    { provide: GetConsentsQuery, useFactory: (r: R) => new GetConsentsQuery(r), inject: [USER_PROFILE_REPOSITORY] },
    { provide: StartPauseUseCase, useFactory: (b: CommandBus, r: R, rnd: RandomSource) => new StartPauseUseCase(b, r, rnd), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY, RANDOM] },
    { provide: EndPauseUseCase, useFactory: (b: CommandBus, r: R) => new EndPauseUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
    {
      provide: StartVerificationUseCase,
      useFactory: (b: CommandBus, r: R, v: VerificationGateway, rnd: RandomSource, d: VerificationStarter | null) => new StartVerificationUseCase(b, r, v, rnd, d ?? null),
      inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY, VERIFICATION_GATEWAY, RANDOM, { token: VERIFICATION_STARTER, optional: true }],
    },
    { provide: CompleteOnboardingUseCase, useFactory: (b: CommandBus, r: R) => new CompleteOnboardingUseCase(b, r), inject: [COMMAND_BUS, USER_PROFILE_REPOSITORY] },
  ],
  exports: [StartPauseUseCase, USER_PROFILE_REPOSITORY, VERIFICATION_GATEWAY, GetSelfProfileQuery, RecordConsentsUseCase],
})
export class UsersModule {}
