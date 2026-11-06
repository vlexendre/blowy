/**
 * Routes du back-office V5 (spec-v5 §10.1, T6) sous /v1/admin/*. Même garde que le back-office :
 * session staff + CSRF (AdminGuard), permission par action et step-up dans les cas d'usage.
 */
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  CompensationQuerySchema,
  DecisionRequestSchema,
  NeighborhoodStatusRequestSchema,
  OutingCancelRequestSchema,
  OutingListQuerySchema,
  ReasonOnlyRequestSchema,
  OnCallShiftCreateRequestSchema,
  OnCallShiftListQuerySchema,
  TravelTimeUpsertRequestSchema,
  NeighborhoodCenterRequestSchema,
  VenueCountersignRequestSchema,
  SafetyAlertReadQuerySchema,
  SafetyListQuerySchema,
  SlotTemplateRequestSchema,
  UuidSchema,
  VenueCreateRequestSchema,
  VenuePartnerAccessRequestSchema,
  VenueUpdateRequestSchema,
} from '@blowy/api-contract';
import type { z } from 'zod';
import { Public } from '../../../../shared/interface/auth.guard.js';
import { CommandId } from '../../../../shared/interface/decorators.js';
import { ZodPipe } from '../../../../shared/interface/zod.pipe.js';
import type { AdminActor } from '../../application/admin-command.js';
import { OpsV5UseCases } from '../../application/use-cases/ops.use-cases.js';
import { AdminGuard, Staff } from './admin-guard.js';

const Id = new ZodPipe(UuidSchema);
const q = <T extends z.ZodType>(s: T) => new ZodPipe(s);

@Public()
@UseGuards(AdminGuard)
@Controller('v1/admin')
export class AdminOpsController {
  constructor(@Inject(OpsV5UseCases) private readonly ops: OpsV5UseCases) {}

  // Villes et quartiers
  @Get('neighborhoods')
  neighborhoods(@Staff() s: AdminActor) {
    return this.ops.neighborhoods(s);
  }
  @Put('neighborhoods/:id/status')
  neighborhoodStatus(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(NeighborhoodStatusRequestSchema)) b: z.infer<typeof NeighborhoodStatusRequestSchema>) {
    return this.ops.setNeighborhoodStatus(s, id, b, cid);
  }
  @Post('neighborhoods/:id/slot-templates')
  slotTemplate(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(SlotTemplateRequestSchema)) b: z.infer<typeof SlotTemplateRequestSchema>) {
    return this.ops.upsertTemplate(s, id, b, cid);
  }

  // Lieux
  @Get('venues')
  venues(@Staff() s: AdminActor) {
    return this.ops.venues(s);
  }
  @Post('venues')
  createVenue(@Staff() s: AdminActor, @CommandId() cid: string, @Body(q(VenueCreateRequestSchema)) b: z.infer<typeof VenueCreateRequestSchema>) {
    return this.ops.createVenue(s, b, cid);
  }
  @Get('venues/:id')
  venue(@Staff() s: AdminActor, @Param('id', Id) id: string) {
    return this.ops.venue(s, id);
  }
  @Put('venues/:id')
  updateVenue(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(VenueUpdateRequestSchema)) b: z.infer<typeof VenueUpdateRequestSchema>) {
    return this.ops.updateVenue(s, id, b, cid);
  }
  @Post('venues/:id/rotate-secret')
  rotate(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(ReasonOnlyRequestSchema)) b: { reason: string }) {
    return this.ops.rotateSecret(s, id, b.reason, cid);
  }
  @Post('venues/:id/partners')
  partners(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(VenuePartnerAccessRequestSchema)) b: z.infer<typeof VenuePartnerAccessRequestSchema>) {
    return this.ops.partnerAccess(s, id, b, cid);
  }

  // V5.6 (E15) : contrat bilatéral — contre-signature Blowy.
  @Post('venues/:id/contract/countersign')
  countersign(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(VenueCountersignRequestSchema)) b: z.infer<typeof VenueCountersignRequestSchema>) {
    return this.ops.countersignContract(s, id, b, cid);
  }

  // V5.6 (E12) : planning d'astreinte.
  @Get('oncall/shifts')
  onCall(@Staff() s: AdminActor, @Query(q(OnCallShiftListQuerySchema)) x: z.infer<typeof OnCallShiftListQuerySchema>) {
    return this.ops.onCallPlanning(s, x);
  }
  @Post('oncall/shifts')
  createShift(@Staff() s: AdminActor, @CommandId() cid: string, @Body(q(OnCallShiftCreateRequestSchema)) b: z.infer<typeof OnCallShiftCreateRequestSchema>) {
    return this.ops.createOnCallShift(s, b, cid);
  }
  @Post('oncall/shifts/:id/delete')
  deleteShift(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(ReasonOnlyRequestSchema)) b: { reason: string }) {
    return this.ops.deleteOnCallShift(s, id, b.reason, cid);
  }

  // V5.6 (E11) : temps de trajet entre quartiers.
  @Get('neighborhoods/:id/travel-times')
  travelTimes(@Staff() s: AdminActor, @Param('id', Id) id: string) {
    return this.ops.travelTimes(s, id);
  }
  @Put('neighborhoods/:id/center')
  center(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(NeighborhoodCenterRequestSchema)) b: z.infer<typeof NeighborhoodCenterRequestSchema>) {
    return this.ops.setNeighborhoodCenter(s, id, b, cid);
  }
  @Post('travel-times')
  upsertTravelTime(@Staff() s: AdminActor, @CommandId() cid: string, @Body(q(TravelTimeUpsertRequestSchema)) b: z.infer<typeof TravelTimeUpsertRequestSchema>) {
    return this.ops.upsertTravelTime(s, b, cid);
  }

  // Sorties
  @Get('outings')
  outings(@Staff() s: AdminActor, @Query(q(OutingListQuerySchema)) x: z.infer<typeof OutingListQuerySchema>) {
    return this.ops.outings(s, x);
  }
  @Get('outings/:id')
  outing(@Staff() s: AdminActor, @Param('id', Id) id: string) {
    return this.ops.outing(s, id);
  }
  @Post('outings/:id/cancel')
  cancel(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(OutingCancelRequestSchema)) b: z.infer<typeof OutingCancelRequestSchema>) {
    return this.ops.cancelOuting(s, id, b, cid);
  }
  @Post('seats/:id/remove')
  removeSeat(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(ReasonOnlyRequestSchema)) b: { reason: string }) {
    return this.ops.removeSeat(s, id, b.reason, cid);
  }

  // « Je connais quelqu'un »
  @Get('knows-someone')
  knowsSomeone(@Staff() s: AdminActor) {
    return this.ops.knowsSomeone(s);
  }
  @Post('knows-someone/:seatId/decision')
  knowsSomeoneDecision(@Staff() s: AdminActor, @Param('seatId', Id) seatId: string, @CommandId() cid: string, @Body(q(DecisionRequestSchema)) b: z.infer<typeof DecisionRequestSchema>) {
    return this.ops.decideKnowsSomeone(s, seatId, b, cid);
  }

  // Présences, absences, pauses
  @Get('attendance')
  attendance(@Staff() s: AdminActor) {
    return this.ops.attendance(s);
  }
  @Post('attendance/disputes/:id/decision')
  dispute(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(DecisionRequestSchema)) b: z.infer<typeof DecisionRequestSchema>) {
    return this.ops.resolveDispute(s, id, b, cid);
  }
  @Post('reliability/:userId/lift-pause')
  liftPause(@Staff() s: AdminActor, @Param('userId', Id) userId: string, @CommandId() cid: string, @Body(q(ReasonOnlyRequestSchema)) b: { reason: string }) {
    return this.ops.liftPause(s, userId, b.reason, cid);
  }

  // Sécurité
  @Get('safety/alerts')
  alerts(@Staff() s: AdminActor, @Query(q(SafetyListQuerySchema)) x: z.infer<typeof SafetyListQuerySchema>) {
    return this.ops.safetyAlerts(s, x);
  }
  @Get('safety/alerts/:id')
  alert(@Staff() s: AdminActor, @Param('id', Id) id: string, @Query(q(SafetyAlertReadQuerySchema)) x: z.infer<typeof SafetyAlertReadQuerySchema>) {
    return this.ops.safetyAlert(s, id, x.justification);
  }
  @Post('safety/alerts/:id/handle')
  handle(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(ReasonOnlyRequestSchema)) b: { reason: string }) {
    return this.ops.handleAlert(s, id, b.reason, cid);
  }

  // Signalements V5, compensations lieu
  @Get('reports-v5')
  reportsV5(@Staff() s: AdminActor) {
    return this.ops.reportsV5(s);
  }
  @Get('venue-compensations')
  compensations(@Staff() s: AdminActor, @Query(q(CompensationQuerySchema)) x: z.infer<typeof CompensationQuerySchema>) {
    return this.ops.compensations(s, x);
  }
  @Post('venue-compensations/:seatId/reverse')
  reverse(@Staff() s: AdminActor, @Param('seatId', Id) seatId: string, @CommandId() cid: string, @Body(q(ReasonOnlyRequestSchema)) b: { reason: string }) {
    return this.ops.reverseCompensation(s, seatId, b.reason, cid);
  }
}
