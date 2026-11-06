/**
 * Routes /v1/outings, /v1/teams, /v1/band, /v1/me/reliability (spec-v5 §7.2–7.3, V5.1). Toute
 * réponse est validée par son contrat Zod `.strict()` : un champ non prévu (fuite) échoue.
 */
import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, Query, Delete } from '@nestjs/common';
import {
  AttendanceDisputeRequestSchema,
  BandPageSchema,
  CheckInRequestSchema,
  CheckInResponseSchema,
  CreateTeamResponseSchema,
  JoinTeamRequestSchema,
  KnowsSomeoneRequestSchema,
  KnowsSomeoneResponseSchema,
  type KnowsSomeoneRequest,
  LeaveTeamResponseSchema,
  OutingHistoryPageSchema,
  OutingRequestViewSchema,
  OutingViewSchema,
  OutingVotesViewSchema,
  OutingWeekViewSchema,
  PageQuerySchema,
  PutOutingRequestSchema,
  ReliabilityViewSchema,
  SeatAcceptRequestSchema,
  SeatAcceptResponseSchema,
  SeatCancelRequestSchema,
  SeatCancelResponseSchema,
  SubmitOutingVotesRequestSchema,
  SubmitOutingVotesResponseSchema,
  UuidSchema,
  WeekKeySchema,
  type CheckInRequest,
  type PutOutingRequest,
  type SeatAcceptRequest,
  type SeatCancelRequest,
  type SubmitOutingVotesRequest,
} from '@blowy/api-contract';
import { z } from 'zod';
import { OUTING_CANCEL_REQUEST_KINDS, type OutingCancelRequestKind } from '@blowy/domain';
import type { Clock } from '../../../shared/application/clock.js';
import { CLOCK } from '../../../shared/shared.tokens.js';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { OutingQueries } from '../application/queries.js';
import { OutingRequestsUseCases } from '../application/requests.use-cases.js';
import { SeatUseCases } from '../application/seats.use-cases.js';
import { TeamUseCases } from '../application/teams.use-cases.js';

const Id = new ZodPipe(UuidSchema);
const CancelPreviewQuery = z.object({ kind: z.enum(OUTING_CANCEL_REQUEST_KINDS).default('CANT_MAKE_IT') });

@Controller('v1')
export class OutingsController {
  constructor(
    @Inject(OutingRequestsUseCases) private readonly requests: OutingRequestsUseCases,
    @Inject(SeatUseCases) private readonly seats: SeatUseCases,
    @Inject(OutingQueries) private readonly queries: OutingQueries,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Get('outings/week')
  async week(@CurrentUser() u: AuthenticatedUser) {
    return OutingWeekViewSchema.parse(await this.requests.week(u.userId));
  }

  @Put('outings/requests/:weekKey')
  async request(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('weekKey', new ZodPipe(WeekKeySchema)) weekKey: string, @Body(new ZodPipe(PutOutingRequestSchema)) b: PutOutingRequest) {
    return OutingRequestViewSchema.parse(await this.requests.put(u.userId, weekKey, b, cid));
  }

  @Delete('outings/requests/:weekKey')
  withdraw(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('weekKey', new ZodPipe(WeekKeySchema)) weekKey: string) {
    return this.requests.withdraw(u.userId, weekKey, cid);
  }

  @Get('outings/history')
  async history(@CurrentUser() u: AuthenticatedUser, @Query(new ZodPipe(PageQuerySchema)) q: { cursor?: string; limit: number }) {
    return OutingHistoryPageSchema.parse(await this.queries.history(u.userId, q.cursor, q.limit));
  }

  @Get('outings/:id')
  async outing(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string) {
    return OutingViewSchema.parse(await this.queries.outing(u.userId, id));
  }

  @Post('outings/:id/seat/accept')
  @HttpCode(200)
  async accept(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(SeatAcceptRequestSchema)) b: SeatAcceptRequest) {
    return SeatAcceptResponseSchema.parse(await this.seats.accept(u.userId, id, b.funding, cid));
  }

  @Post('outings/:id/seat/decline')
  @HttpCode(200)
  decline(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string) {
    return this.seats.decline(u.userId, id, cid);
  }

  @Get('outings/:id/seat/cancel-preview')
  async cancelPreview(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string, @Query(new ZodPipe(CancelPreviewQuery)) q: { kind: OutingCancelRequestKind }) {
    return SeatCancelResponseSchema.parse(await this.seats.preview(u.userId, id, q.kind, this.clock.now()));
  }

  @Post('outings/:id/seat/cancel')
  @HttpCode(200)
  async cancel(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(SeatCancelRequestSchema)) b: SeatCancelRequest) {
    return SeatCancelResponseSchema.parse(await this.seats.cancel(u.userId, id, b.kind, cid));
  }

  /** V5.2 (C.10) : « je connais quelqu'un ici » (privé, 1×/mois). */
  @Post('outings/:id/seat/knows-someone')
  @HttpCode(200)
  async knowsSomeone(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(KnowsSomeoneRequestSchema)) b: KnowsSomeoneRequest) {
    return KnowsSomeoneResponseSchema.parse(await this.seats.knowsSomeone(u.userId, id, b.userId, cid));
  }

  @Post('outings/:id/check-in')
  @HttpCode(200)
  async checkIn(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(CheckInRequestSchema)) b: CheckInRequest) {
    return CheckInResponseSchema.parse(await this.seats.checkIn(u.userId, id, b, cid));
  }

  @Get('outings/:id/votes')
  async votes(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string) {
    return OutingVotesViewSchema.parse(await this.queries.votes(u.userId, id));
  }

  @Put('outings/:id/votes')
  async submitVotes(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(SubmitOutingVotesRequestSchema)) b: SubmitOutingVotesRequest) {
    return SubmitOutingVotesResponseSchema.parse(await this.seats.vote(u.userId, id, b.choices, cid));
  }

  @Post('outings/:id/attendance/dispute')
  @HttpCode(201)
  dispute(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(AttendanceDisputeRequestSchema)) b: { note: string }) {
    return this.seats.dispute(u.userId, id, b.note, cid);
  }

  @Get('me/reliability')
  async reliability(@CurrentUser() u: AuthenticatedUser) {
    return ReliabilityViewSchema.parse(await this.queries.reliability(u.userId));
  }

  /** Ma bande (lecture ; « partir proprement » et duos : module connections, T5). */
  @Get('band')
  async band(@CurrentUser() u: AuthenticatedUser) {
    return BandPageSchema.parse(await this.queries.band(u.userId));
  }
}

@Controller('v1/teams')
export class TeamsController {
  constructor(@Inject(TeamUseCases) private readonly teams: TeamUseCases) {}

  @Get('mine')
  async mine(@CurrentUser() u: AuthenticatedUser) {
    return CreateTeamResponseSchema.parse(await this.teams.mine(u.userId));
  }

  @Post()
  async create(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string) {
    return CreateTeamResponseSchema.parse(await this.teams.create(u.userId, cid));
  }

  @Post('join')
  @HttpCode(200)
  async join(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(JoinTeamRequestSchema)) b: { inviteRef: string }) {
    return CreateTeamResponseSchema.parse(await this.teams.join(u.userId, b.inviteRef, cid));
  }

  @Post(':id/leave')
  @HttpCode(200)
  async leave(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string) {
    return LeaveTeamResponseSchema.parse(await this.teams.leave(u.userId, id, cid));
  }
}
