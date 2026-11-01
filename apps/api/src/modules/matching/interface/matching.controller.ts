import { Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { AcceptProposalResultSchema, MatchFeedSchema, UuidSchema } from '@blowy/api-contract';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { AcceptProposalUseCase } from '../application/accept-proposal.use-case.js';
import { GetMatchFeedQuery } from '../application/get-match-feed.query.js';
import { RequestOnboardingBatchUseCase } from '../application/request-onboarding-batch.use-case.js';

@Controller('v1')
export class MatchingController {
  constructor(
    @Inject(GetMatchFeedQuery) private readonly feed: GetMatchFeedQuery,
    @Inject(AcceptProposalUseCase) private readonly accept: AcceptProposalUseCase,
    @Inject(RequestOnboardingBatchUseCase) private readonly onboardingBatch: RequestOnboardingBatchUseCase,
  ) {}

  @Get('matches')
  async matches(@CurrentUser() u: AuthenticatedUser) {
    return MatchFeedSchema.parse(await this.feed.execute(u.userId));
  }

  /** Premier lot immédiat après onboarding (selon densité ; jamais d'utilisateurs inventés). */
  @Post('matches/onboarding-batch')
  async firstBatch(@CurrentUser() u: AuthenticatedUser) {
    await this.onboardingBatch.execute(u.userId);
    return MatchFeedSchema.parse(await this.feed.execute(u.userId));
  }

  @Post('match-proposals/:id/accept')
  async acceptProposal(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', new ZodPipe(UuidSchema)) id: string) {
    return AcceptProposalResultSchema.parse(await this.accept.execute(u.userId, id, cid));
  }
}
