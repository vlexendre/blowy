/**
 * Routes du module `connections` (spec-v5 §7.3) : /v1/duos…, /v1/duo-lane…, /v1/band/:linkId/leave,
 * /v1/band/street. `GET /v1/band` reste servi par `outings` (lecture, même table `Friendship`).
 * Toute réponse est validée par son contrat Zod `.strict()` : un champ non prévu (fuite) échoue.
 */
import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put } from '@nestjs/common';
import {
  AcceptDuoProposalResultSchema,
  BandLeaveResponseSchema,
  CancelDuoDateRequestSchema,
  CastDuoVoteRequestSchema,
  CastDuoVoteResponseSchema,
  CheckInRequestSchema,
  CheckInResponseSchema,
  DuoDateViewSchema,
  DuoEggRequestSchema,
  DuoEggResponseSchema,
  DuoLaneFeedSchema,
  DuoLeaveResponseSchema,
  DuoListSchema,
  DuoVenueListSchema,
  DuoViewSchema,
  PassDuoProposalResultSchema,
  ProposeDuoDateRequestSchema,
  RespondDuoDateRequestSchema,
  StreetArrangementRequestSchema,
  StreetGiftRequestSchema,
  StreetGiftResponseSchema,
  StreetViewSchema,
  UuidSchema,
  type CastDuoVoteRequest,
  type CheckInRequest,
  type ProposeDuoDateRequest,
  type RespondDuoDateRequest,
} from '@blowy/api-contract';
import type { SeatCancelRequestKind } from '@blowy/domain';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { DuoUseCases } from '../application/duos.use-cases.js';
import { ConnectionQueries } from '../application/queries.js';

const Id = new ZodPipe(UuidSchema);

@Controller('v1')
export class ConnectionsController {
  constructor(
    @Inject(DuoUseCases) private readonly duos: DuoUseCases,
    @Inject(ConnectionQueries) private readonly queries: ConnectionQueries,
  ) {}

  // ------------------------------------------------------------------ duos
  @Get('duos')
  async list(@CurrentUser() u: AuthenticatedUser) {
    return DuoListSchema.parse(await this.queries.list(u.userId));
  }

  @Get('duos/:id')
  async get(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string) {
    return DuoViewSchema.parse(await this.queries.get(u.userId, id));
  }

  @Get('duos/:id/venues')
  async venues(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string) {
    return DuoVenueListSchema.parse(await this.queries.venues(u.userId, id));
  }

  @Post('duos/:id/dates')
  async propose(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(ProposeDuoDateRequestSchema)) b: ProposeDuoDateRequest) {
    const date = await this.duos.proposeDate(u.userId, id, b, cid);
    return DuoDateViewSchema.parse(await this.queries.dateViewById(u.userId, id, date.id));
  }

  @Post('duos/:id/dates/:dateId/respond')
  @HttpCode(200)
  async respond(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Param('dateId', Id) dateId: string, @Body(new ZodPipe(RespondDuoDateRequestSchema)) b: RespondDuoDateRequest) {
    await this.duos.respondDate(u.userId, id, dateId, b.decision, cid);
    return DuoDateViewSchema.parse(await this.queries.dateViewById(u.userId, id, dateId));
  }

  @Post('duos/:id/dates/:dateId/cancel')
  @HttpCode(200)
  async cancel(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Param('dateId', Id) dateId: string, @Body(new ZodPipe(CancelDuoDateRequestSchema)) b: { kind: SeatCancelRequestKind }) {
    await this.duos.cancelDate(u.userId, id, dateId, b.kind, cid);
    return DuoDateViewSchema.parse(await this.queries.dateViewById(u.userId, id, dateId));
  }

  @Post('duos/:id/dates/:dateId/check-in')
  @HttpCode(200)
  async checkIn(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Param('dateId', Id) dateId: string, @Body(new ZodPipe(CheckInRequestSchema)) b: CheckInRequest) {
    return CheckInResponseSchema.parse(await this.duos.checkIn(u.userId, id, dateId, b, cid));
  }

  @Put('duos/:id/dates/:dateId/vote')
  async vote(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Param('dateId', Id) dateId: string, @Body(new ZodPipe(CastDuoVoteRequestSchema)) b: CastDuoVoteRequest) {
    return CastDuoVoteResponseSchema.parse(await this.duos.vote(u.userId, id, dateId, b.choice, cid));
  }

  @Post('duos/:id/leave')
  @HttpCode(200)
  async leave(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string) {
    return DuoLeaveResponseSchema.parse(await this.duos.leave(u.userId, id, cid));
  }

  /** Drapeau œuf (T9) : désactivé par défaut, actif seulement si les deux l'activent. */
  @Put('duos/:id/egg')
  async egg(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(DuoEggRequestSchema)) b: { enabled: boolean }) {
    return DuoEggResponseSchema.parse(await this.duos.setEgg(u.userId, id, b.enabled, cid));
  }

  // ------------------------------------------------------------------ voie Duo
  @Get('duo-lane')
  async feed(@CurrentUser() u: AuthenticatedUser) {
    return DuoLaneFeedSchema.parse(await this.queries.feed(u.userId));
  }

  @Post('duo-lane/proposals/:id/accept')
  @HttpCode(200)
  async accept(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string) {
    return AcceptDuoProposalResultSchema.parse(await this.duos.acceptProposal(u.userId, id, cid));
  }

  @Post('duo-lane/proposals/:id/pass')
  @HttpCode(200)
  async pass(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string) {
    return PassDuoProposalResultSchema.parse(await this.duos.passProposal(u.userId, id, cid));
  }

  // ------------------------------------------------------------------ bande
  @Post('band/:linkId/leave')
  @HttpCode(200)
  async leaveBand(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('linkId', Id) linkId: string) {
    return BandLeaveResponseSchema.parse(await this.duos.leaveBand(u.userId, linkId, cid));
  }

  /** « Ta rue » (V5.2 G.21) : vue calme, facultative, sans jauge ni notification. */
  @Get('band/street')
  async street(@CurrentUser() u: AuthenticatedUser) {
    return StreetViewSchema.parse(await this.queries.street(u.userId));
  }

  /** V5.3 (F.24) : « ranger ses souvenirs » (facultatif, aucun événement). */
  @Put('band/street/arrangement')
  async arrange(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(StreetArrangementRequestSchema)) b: { memoryIds: string[] }) {
    await this.duos.arrangeStreet(u.userId, b.memoryIds, cid);
    return StreetViewSchema.parse(await this.queries.street(u.userId));
  }

  /** V5.3 (F.24) : offrir un accessoire gagné au pet d'un membre de ma bande (aucune notification). */
  @Post('band/street/gifts')
  @HttpCode(200)
  async gift(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(StreetGiftRequestSchema)) b: { linkId: string; accessoryId: string }) {
    return StreetGiftResponseSchema.parse(await this.duos.giftAccessory(u.userId, b.linkId, b.accessoryId, cid));
  }
}
