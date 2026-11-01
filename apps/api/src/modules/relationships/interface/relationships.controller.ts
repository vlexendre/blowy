import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import {
  CastBallotRequestSchema,
  LeaveRelationshipRequestSchema,
  PauseRelationshipRequestSchema,
  RelationshipListSchema,
  RelationshipViewSchema,
  RespondOfferRequestSchema,
  UuidSchema,
} from '@blowy/api-contract';
import type { z } from 'zod';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { BranchVoteUseCase } from '../application/branch-vote.use-case.js';
import { GetRelationshipsQuery } from '../application/get-relationships.query.js';
import { LeaveRelationshipUseCase } from '../application/leave-relationship.use-case.js';
import { MoveInUseCase } from '../application/move-in.use-case.js';
import { PauseRelationshipUseCase } from '../application/pause-relationship.use-case.js';

const Id = new ZodPipe(UuidSchema);

@Controller('v1/relationships')
export class RelationshipsController {
  constructor(
    @Inject(GetRelationshipsQuery) private readonly query: GetRelationshipsQuery,
    @Inject(LeaveRelationshipUseCase) private readonly leaveUc: LeaveRelationshipUseCase,
    @Inject(PauseRelationshipUseCase) private readonly pauseUc: PauseRelationshipUseCase,
    @Inject(MoveInUseCase) private readonly moveIn: MoveInUseCase,
    @Inject(BranchVoteUseCase) private readonly vote: BranchVoteUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() u: AuthenticatedUser, @Query('includeEnded') includeEnded?: string) {
    return RelationshipListSchema.parse({ items: await this.query.list(u.userId, includeEnded === 'true') });
  }

  @Get(':id')
  async one(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string) {
    return RelationshipViewSchema.parse(await this.query.one(u.userId, id));
  }

  @Post(':id/leave')
  async leave(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(LeaveRelationshipRequestSchema)) body: z.infer<typeof LeaveRelationshipRequestSchema>) {
    await this.leaveUc.execute(u.userId, id, cid, body.reason);
    return RelationshipViewSchema.parse(await this.query.one(u.userId, id));
  }

  @Post(':id/pause')
  async pause(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(PauseRelationshipRequestSchema)) body: z.infer<typeof PauseRelationshipRequestSchema>) {
    await this.pauseUc.execute(u.userId, id, cid, body.days);
    return RelationshipViewSchema.parse(await this.query.one(u.userId, id));
  }

  @Post(':id/move-in')
  async proposeMoveIn(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string) {
    const { result } = await this.moveIn.propose(u.userId, id, cid);
    return { status: result.status, relationship: RelationshipViewSchema.parse(await this.query.one(u.userId, id)) };
  }

  @Post(':id/consents/respond')
  async respond(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(RespondOfferRequestSchema)) body: z.infer<typeof RespondOfferRequestSchema>) {
    const { result } = await this.moveIn.respond(u.userId, id, cid, body);
    return { status: result.status, relationship: RelationshipViewSchema.parse(await this.query.one(u.userId, id)) };
  }

  @Post(':id/branch/ballot')
  async ballot(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(CastBallotRequestSchema)) body: z.infer<typeof CastBallotRequestSchema>) {
    await this.vote.cast(u.userId, id, cid, body.choice);
    return RelationshipViewSchema.parse(await this.query.one(u.userId, id));
  }

  @Post(':id/branch/downgrade')
  async downgrade(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string) {
    await this.vote.downgrade(u.userId, id, cid);
    return RelationshipViewSchema.parse(await this.query.one(u.userId, id));
  }
}
