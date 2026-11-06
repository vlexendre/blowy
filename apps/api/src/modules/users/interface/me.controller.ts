import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put } from '@nestjs/common';
import {
  ConsentStateSchema,
  MatchPreferencesSchema,
  PrivacySettingsSchema,
  RecordConsentsRequestSchema,
  SelfProfileSchema,
  StartPauseRequestSchema,
  StartVerificationRequestSchema,
  UpdateProfileRequestSchema,
  UuidSchema,
  IntentionsV5Schema,
  UpdateIntentionsV5RequestSchema,
  OutingPreferencesV5Schema,
  UpdateOutingPreferencesV5RequestSchema,
  type IntentionsV5Dto,
  type OutingPreferencesV5Dto,
  type MatchPreferences,
  type PrivacySettings,
  type RecordConsentsRequest,
  type StartPauseRequest,
  type UpdateProfileRequest,
} from '@blowy/api-contract';
import type { z } from 'zod';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { CompleteOnboardingUseCase } from '../application/complete-onboarding.use-case.js';
import { GetConsentsQuery, RecordConsentsUseCase } from '../application/consents.use-case.js';
import { GetSelfProfileQuery } from '../application/get-self-profile.query.js';
import { EndPauseUseCase, StartPauseUseCase } from '../application/pause.use-case.js';
import { UpdateProfileUseCase } from '../application/update-profile.use-case.js';
import { UpdatePreferencesUseCase, UpdatePrivacyUseCase } from '../application/update-settings.use-case.js';
import { StartVerificationUseCase } from '../application/verification.use-case.js';
import { PreferencesV5UseCases } from '../application/preferences-v5.use-cases.js';

@Controller('v1')
export class MeController {
  constructor(
    @Inject(GetSelfProfileQuery) private readonly getProfile: GetSelfProfileQuery,
    @Inject(UpdateProfileUseCase) private readonly updateProfile: UpdateProfileUseCase,
    @Inject(UpdatePreferencesUseCase) private readonly updatePrefs: UpdatePreferencesUseCase,
    @Inject(UpdatePrivacyUseCase) private readonly updatePrivacy: UpdatePrivacyUseCase,
    @Inject(RecordConsentsUseCase) private readonly recordConsents: RecordConsentsUseCase,
    @Inject(GetConsentsQuery) private readonly getConsents: GetConsentsQuery,
    @Inject(StartPauseUseCase) private readonly startPause: StartPauseUseCase,
    @Inject(EndPauseUseCase) private readonly endPause: EndPauseUseCase,
    @Inject(StartVerificationUseCase) private readonly startVerification: StartVerificationUseCase,
    @Inject(CompleteOnboardingUseCase) private readonly completeOnboarding: CompleteOnboardingUseCase,
    @Inject(PreferencesV5UseCases) private readonly prefsV5: PreferencesV5UseCases,
  ) {}

  /** V5.1 : intentions secrètes (lecture par la personne elle-même seulement). */
  @Get('preferences/intentions')
  async getIntentions(@CurrentUser() u: AuthenticatedUser) {
    return IntentionsV5Schema.parse(await this.prefsV5.intentions(u.userId));
  }

  @Put('preferences/intentions')
  async putIntentions(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(UpdateIntentionsV5RequestSchema)) body: IntentionsV5Dto) {
    return IntentionsV5Schema.parse(await this.prefsV5.saveIntentions(u.userId, body, cid));
  }

  /** V5.1 : préférences de sortie (âges, disponibilités, semaines off, activités, quartiers, trajet). */
  @Get('preferences/outings')
  async getOutingPrefs(@CurrentUser() u: AuthenticatedUser) {
    return OutingPreferencesV5Schema.parse(await this.prefsV5.outingPreferences(u.userId));
  }

  @Put('preferences/outings')
  async putOutingPrefs(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(UpdateOutingPreferencesV5RequestSchema)) body: OutingPreferencesV5Dto) {
    return OutingPreferencesV5Schema.parse(await this.prefsV5.saveOutingPreferences(u.userId, body, cid));
  }

  @Get('me')
  async me(@CurrentUser() u: AuthenticatedUser) {
    return SelfProfileSchema.parse(await this.getProfile.execute(u.userId));
  }

  @Patch('me')
  async patchMe(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(UpdateProfileRequestSchema)) body: UpdateProfileRequest) {
    await this.updateProfile.execute(u.userId, cid, body);
    return this.me(u);
  }

  @Put('preferences/matching')
  async putPrefs(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(MatchPreferencesSchema)) body: MatchPreferences) {
    await this.updatePrefs.execute(u.userId, cid, body);
    return this.me(u);
  }

  @Put('preferences/privacy')
  async putPrivacy(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(PrivacySettingsSchema)) body: PrivacySettings) {
    await this.updatePrivacy.execute(u.userId, cid, body);
    return this.me(u);
  }

  @Get('consents')
  async consents(@CurrentUser() u: AuthenticatedUser) {
    return ConsentStateSchema.parse(await this.getConsents.execute(u.userId));
  }

  @Post('consents')
  async postConsents(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(RecordConsentsRequestSchema)) body: RecordConsentsRequest) {
    await this.recordConsents.execute(u.userId, cid, body);
    return this.consents(u);
  }

  @Post('pauses')
  async pause(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(StartPauseRequestSchema)) body: StartPauseRequest) {
    return (await this.startPause.execute(u.userId, cid, body)).result;
  }

  @Delete('pauses/:id')
  async unpause(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', new ZodPipe(UuidSchema)) id: string) {
    return (await this.endPause.execute(u.userId, cid, id)).result;
  }

  @Post('verifications')
  async verify(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(StartVerificationRequestSchema)) body: z.infer<typeof StartVerificationRequestSchema>) {
    await this.startVerification.execute(u.userId, cid, body.kind);
    return (await this.getProfile.execute(u.userId)).verification;
  }

  @Post('me/onboarding/complete')
  async complete(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string) {
    await this.completeOnboarding.execute(u.userId, cid);
    return this.me(u);
  }
}
