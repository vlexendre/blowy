import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import { type AiConsents as AiConsentsDto, AiProofsConsentBody } from '@blowy/contract';
import type { Locale } from '@blowy/domain';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { ReqLocale } from '../../../shared/locale';
import { RateLimit } from '../../../shared/user-rate-limit';
import { ZodPipe } from '../../../shared/zod.pipe';
import { AiConsents } from '../application/ai-consents.service';

/** `GET /v1/me/ai` (prestataire et accords) · `PUT /v1/me/ai/proofs` (accepter, refuser, retirer). */
@Controller('v1/me/ai')
export class AiConsentsController {
  constructor(@Inject(AiConsents) private readonly consents: AiConsents) {}

  @Get()
  get(@CurrentUser() user: AuthUser, @ReqLocale() locale: Locale): Promise<AiConsentsDto> {
    return this.consents.view(user.userId, locale);
  }

  @RateLimit('write')
  @Put('proofs')
  async setProofs(
    @CurrentUser() user: AuthUser,
    @ReqLocale() locale: Locale,
    @Body(new ZodPipe(AiProofsConsentBody)) body: z.infer<typeof AiProofsConsentBody>,
  ): Promise<AiConsentsDto> {
    await this.consents.setProofs(user.userId, body.consent);
    return this.consents.view(user.userId, locale);
  }
}
