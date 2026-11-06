import { Controller, Inject, Param, Post } from '@nestjs/common';
import { AcceptProposalResultSchema, UuidSchema } from '@blowy/api-contract';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { AcceptProposalUseCase } from '../application/accept-proposal.use-case.js';

@Controller('v1')
export class MatchingController {
  constructor(@Inject(AcceptProposalUseCase) private readonly accept: AcceptProposalUseCase) {}

  // V5.6 (E20) : `GET /v1/matches` et `POST /v1/matches/onboarding-batch` retirées (410 `RETIRED_IN_V5`, middleware).

  @Post('match-proposals/:id/accept')
  async acceptProposal(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', new ZodPipe(UuidSchema)) id: string) {
    return AcceptProposalResultSchema.parse(await this.accept.execute(u.userId, id, cid));
  }
}
