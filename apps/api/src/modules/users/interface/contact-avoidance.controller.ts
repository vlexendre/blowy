/**
 * V5.4 (A.6) : `/v1/me/contact-avoidance` — « éviter les personnes que je connais » (opt-in, protocole
 * `oprf-p256-v1`, spec §4.5). Aucune réponse ne révèle qui est inscrit.
 */
import { Body, Controller, Delete, Get, HttpCode, Inject, Post } from '@nestjs/common';
import {
  ContactAvoidanceContactsRequestSchema,
  ContactAvoidanceContactsResponseSchema,
  ContactAvoidanceEvaluateRequestSchema,
  ContactAvoidanceEvaluateResponseSchema,
  ContactAvoidanceStatusSchema,
  EnableContactAvoidanceRequestSchema,
} from '@blowy/api-contract';
import type { z } from 'zod';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { ContactAvoidanceUseCases } from '../application/contact-avoidance.use-cases.js';

@Controller('v1/me/contact-avoidance')
export class ContactAvoidanceController {
  constructor(@Inject(ContactAvoidanceUseCases) private readonly uc: ContactAvoidanceUseCases) {}

  @Get()
  async status(@CurrentUser() u: AuthenticatedUser) {
    return ContactAvoidanceStatusSchema.parse(await this.uc.status(u.userId));
  }

  @Post()
  @HttpCode(200)
  async enable(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(EnableContactAvoidanceRequestSchema)) b: z.infer<typeof EnableContactAvoidanceRequestSchema>) {
    return ContactAvoidanceStatusSchema.parse(await this.uc.enable(u.userId, b.phoneVerificationToken, cid));
  }

  @Post('decline')
  @HttpCode(200)
  async decline(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string) {
    return ContactAvoidanceStatusSchema.parse(await this.uc.decline(u.userId, cid));
  }

  @Post('evaluate')
  @HttpCode(200)
  async evaluate(@CurrentUser() u: AuthenticatedUser, @Body(new ZodPipe(ContactAvoidanceEvaluateRequestSchema)) b: z.infer<typeof ContactAvoidanceEvaluateRequestSchema>) {
    return ContactAvoidanceEvaluateResponseSchema.parse(await this.uc.evaluate(u.userId, b.blinded));
  }

  @Post('contacts')
  @HttpCode(200)
  async contacts(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(ContactAvoidanceContactsRequestSchema)) b: z.infer<typeof ContactAvoidanceContactsRequestSchema>) {
    return ContactAvoidanceContactsResponseSchema.parse(await this.uc.contacts(u.userId, b.tokens, cid));
  }

  @Delete()
  async disable(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string) {
    return ContactAvoidanceStatusSchema.parse(await this.uc.disable(u.userId, cid));
  }
}
