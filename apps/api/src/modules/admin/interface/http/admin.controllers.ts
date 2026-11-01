/**
 * Contrôleurs REST /v1/admin/*. Marqués @Public() pour le guard MOBILE (aucun bearer accepté
 * ici) et protégés par AdminGuard (session staff + CSRF). Entrées validées par Zod, mutations
 * avec Idempotency-Key. Réponses = vues staff explicites.
 */
import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AdminPageQuerySchema,
  AppealResolveRequestSchema,
  AuditQuerySchema,
  CaseAssignRequestSchema,
  CaseContextQuerySchema,
  CaseDecisionRequestSchema,
  CaseListQuerySchema,
  ConfigPublishRequestSchema,
  ContentDraftRequestSchema,
  DashboardQuerySchema,
  EconomyCorrectionRequestSchema,
  MissionDraftRequestSchema,
  MissionScheduleRequestSchema,
  RedriveRequestSchema,
  RelationshipRepairRequestSchema,
  StaffLoginRequestSchema,
  StaffMfaRequestSchema,
  StepUpRequestSchema,
  TuningDraftRequestSchema,
  TuningRollbackRequestSchema,
  UserActionRequestSchema,
  UserSearchQuerySchema,
  UuidSchema,
  VerificationReviewRequestSchema,
  WebhookListQuerySchema,
} from '@blowy/api-contract';
import { z } from 'zod';
import { Public } from '../../../../shared/interface/auth.guard.js';
import { CommandId } from '../../../../shared/interface/decorators.js';
import { ZodPipe } from '../../../../shared/interface/zod.pipe.js';
import type { AdminActor } from '../../application/admin-command.js';
import { StaffAuthService } from '../../application/use-cases/staff-auth.use-cases.js';
import {
  AuditUseCases,
  ContentUseCases,
  DashboardUseCase,
  EconomyAdminUseCases,
  MissionsUseCases,
  OpsUseCases,
  PetsRelationshipsUseCases,
  ReadModelsUseCases,
  TrustUseCases,
  TuningUseCases,
  UsersUseCases,
} from '../../application/use-cases/backoffice.use-cases.js';
import { AdminSocialUseCases } from '../../application/use-cases/admin-social.use-cases.js';
import { AdminGuard, AdminPreAuth, PendingToken, RequestId, Staff } from './admin-guard.js';

const Id = new ZodPipe(UuidSchema);
const q = <T extends z.ZodType>(s: T) => new ZodPipe(s);

@Public()
@UseGuards(AdminGuard)
@Controller('v1/admin/auth')
export class AdminAuthController {
  constructor(@Inject(StaffAuthService) private readonly auth: StaffAuthService) {}

  @AdminPreAuth()
  @Post('login')
  @HttpCode(200)
  login(@Body(q(StaffLoginRequestSchema)) b: z.infer<typeof StaffLoginRequestSchema>, @RequestId() rid: string | null) {
    return this.auth.login(b.provider, b.credential, rid);
  }

  @AdminPreAuth()
  @Post('mfa/enroll')
  @HttpCode(200)
  enroll(@PendingToken() p: string | undefined, @RequestId() rid: string | null) {
    return this.auth.startEnrollment(p, rid);
  }

  @AdminPreAuth()
  @Post('mfa/verify')
  @HttpCode(200)
  verify(@PendingToken() p: string | undefined, @Body(q(StaffMfaRequestSchema)) b: { code: string }, @RequestId() rid: string | null) {
    return this.auth.completeMfa(p, b.code, rid);
  }

  @Get('me')
  me(@Staff() s: AdminActor) {
    return this.auth.me(s);
  }

  @Post('step-up')
  @HttpCode(200)
  stepUp(@Staff() s: AdminActor, @Body(q(StepUpRequestSchema)) b: { code: string }) {
    return this.auth.stepUp(s, b.code, s.requestId);
  }

  @Get('sessions')
  sessions(@Staff() s: AdminActor) {
    return this.auth.sessions(s);
  }

  @Delete('sessions/current')
  @HttpCode(204)
  async logout(@Staff() s: AdminActor) {
    await this.auth.revoke(s, s.sessionId, s.requestId);
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  async revoke(@Staff() s: AdminActor, @Param('id', Id) id: string) {
    await this.auth.revoke(s, id, s.requestId);
  }
}

@Public()
@UseGuards(AdminGuard)
@Controller('v1/admin')
export class AdminController {
  constructor(
    @Inject(DashboardUseCase) private readonly dashboard: DashboardUseCase,
    @Inject(UsersUseCases) private readonly users: UsersUseCases,
    @Inject(PetsRelationshipsUseCases) private readonly pets: PetsRelationshipsUseCases,
    @Inject(TrustUseCases) private readonly trust: TrustUseCases,
    @Inject(MissionsUseCases) private readonly missions: MissionsUseCases,
    @Inject(ContentUseCases) private readonly content: ContentUseCases,
    @Inject(TuningUseCases) private readonly tuning: TuningUseCases,
    @Inject(ReadModelsUseCases) private readonly reads: ReadModelsUseCases,
    @Inject(EconomyAdminUseCases) private readonly economy: EconomyAdminUseCases,
    @Inject(OpsUseCases) private readonly ops: OpsUseCases,
    @Inject(AuditUseCases) private readonly audit: AuditUseCases,
    @Inject(AdminSocialUseCases) private readonly social: AdminSocialUseCases,
  ) {}

  // 18.1
  @Get('dashboard')
  getDashboard(@Staff() s: AdminActor, @Query(q(DashboardQuerySchema)) x: z.infer<typeof DashboardQuerySchema>) {
    return this.dashboard.execute(s, x.from, x.to, x.zone);
  }

  // 18.2
  @Get('users')
  searchUsers(@Staff() s: AdminActor, @Query(q(UserSearchQuerySchema)) x: z.infer<typeof UserSearchQuerySchema>) {
    return this.users.search(s, x);
  }
  @Get('users/:id')
  user(@Staff() s: AdminActor, @Param('id', Id) id: string) {
    return this.users.detail(s, id);
  }
  @Post('users/:id/actions')
  userAction(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(UserActionRequestSchema)) b: z.infer<typeof UserActionRequestSchema>) {
    return this.users.act(s, id, b.kind, b.reason, cid);
  }

  // 18.3
  @Get('pets/:id')
  pet(@Staff() s: AdminActor, @Param('id', Id) id: string) {
    return this.pets.pet(s, id);
  }
  @Get('relationships/:id')
  relationship(@Staff() s: AdminActor, @Param('id', Id) id: string) {
    return this.pets.relationship(s, id);
  }
  @Post('relationships/:id/repair')
  repair(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(RelationshipRepairRequestSchema)) b: z.infer<typeof RelationshipRepairRequestSchema>) {
    return this.pets.repair(s, id, b.reason, cid);
  }

  // 18.4 / 18.5 (ports E)
  @Get('trust/status')
  trustStatus(@Staff() s: AdminActor) {
    void s;
    return this.trust.status();
  }
  @Get('moderation/cases')
  cases(@Staff() s: AdminActor, @Query(q(CaseListQuerySchema)) x: z.infer<typeof CaseListQuerySchema>) {
    return this.trust.listCases(s, x);
  }
  @Get('moderation/stats')
  modStats(@Staff() s: AdminActor) {
    return this.trust.stats(s);
  }
  @Get('moderation/cases/:id')
  getCase(@Staff() s: AdminActor, @Param('id', Id) id: string, @Query(q(CaseContextQuerySchema)) x: z.infer<typeof CaseContextQuerySchema>) {
    return this.trust.getCase(s, id, x.justification);
  }
  @Post('moderation/cases/:id/assign')
  assign(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(CaseAssignRequestSchema)) b: z.infer<typeof CaseAssignRequestSchema>) {
    return this.trust.assign(s, id, b.assigneeId, cid);
  }
  @Post('moderation/cases/:id/decisions')
  decide(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(CaseDecisionRequestSchema)) b: z.infer<typeof CaseDecisionRequestSchema>) {
    return this.trust.decide(s, id, b.action, b.reason, cid);
  }
  @Get('moderation/appeals')
  appeals(@Staff() s: AdminActor, @Query(q(AdminPageQuerySchema.extend({ status: z.enum(['OPEN', 'UPHELD', 'OVERTURNED']).optional() }))) x: { status?: 'OPEN' | 'UPHELD' | 'OVERTURNED'; cursor?: string; limit: number }) {
    return this.trust.listAppeals(s, x);
  }
  @Post('moderation/appeals/:id/resolve')
  resolveAppeal(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(AppealResolveRequestSchema)) b: z.infer<typeof AppealResolveRequestSchema>) {
    return this.trust.resolveAppeal(s, id, b.outcome, b.reason, cid);
  }
  @Get('reports')
  reports(@Staff() s: AdminActor, @Query(q(AdminPageQuerySchema.extend({ status: z.string().max(32).optional(), category: z.string().max(32).optional() }))) x: { status?: string; category?: string; cursor?: string; limit: number }) {
    return this.trust.listReports(s, x);
  }
  @Get('verifications')
  verifications(@Staff() s: AdminActor, @Query(q(AdminPageQuerySchema.extend({ status: z.string().max(32).optional() }))) x: { status?: string; cursor?: string; limit: number }) {
    return this.trust.listVerifications(s, x);
  }
  @Post('verifications/:id/review')
  review(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(VerificationReviewRequestSchema)) b: z.infer<typeof VerificationReviewRequestSchema>) {
    return this.trust.reviewVerification(s, id, b.decision, b.reason, cid);
  }
  @Get('exports')
  exportsList(@Staff() s: AdminActor, @Query(q(AdminPageQuerySchema.extend({ status: z.string().max(32).optional() }))) x: { status?: string; cursor?: string; limit: number }) {
    return this.trust.listExports(s, x);
  }
  @Get('deletions')
  deletions(@Staff() s: AdminActor, @Query(q(AdminPageQuerySchema.extend({ status: z.string().max(32).optional() }))) x: { status?: string; cursor?: string; limit: number }) {
    return this.trust.listDeletions(s, x);
  }

  // 18.6
  @Get('missions')
  listMissions(@Staff() s: AdminActor) {
    return this.missions.list(s);
  }
  @Post('missions/preview')
  @HttpCode(200)
  previewMission(@Staff() s: AdminActor, @Body(q(MissionDraftRequestSchema)) b: z.infer<typeof MissionDraftRequestSchema>) {
    return this.missions.preview(s, b);
  }
  @Post('missions')
  createMission(@Staff() s: AdminActor, @CommandId() cid: string, @Body(q(MissionDraftRequestSchema)) b: z.infer<typeof MissionDraftRequestSchema>) {
    return this.missions.createDraft(s, b, cid);
  }
  @Put('missions/:id')
  updateMission(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(MissionDraftRequestSchema)) b: z.infer<typeof MissionDraftRequestSchema>) {
    return this.missions.updateDraft(s, id, b, cid);
  }
  @Post('missions/:id/publish')
  publishMission(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(ConfigPublishRequestSchema)) b: { reason: string }) {
    return this.missions.transition(s, id, 'PUBLISHED', b.reason, cid);
  }
  @Post('missions/:id/archive')
  archiveMission(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(ConfigPublishRequestSchema)) b: { reason: string }) {
    return this.missions.transition(s, id, 'ARCHIVED', b.reason, cid);
  }
  @Post('missions/schedule')
  schedule(@Staff() s: AdminActor, @CommandId() cid: string, @Body(q(MissionScheduleRequestSchema)) b: z.infer<typeof MissionScheduleRequestSchema>) {
    return this.missions.schedule(s, b.definitionId, b.zoneCode, b.day, cid);
  }

  // 18.7
  @Get('content')
  contentOverview(@Staff() s: AdminActor) {
    return this.content.overview(s);
  }
  @Post('content/drafts')
  contentDraft(@Staff() s: AdminActor, @CommandId() cid: string, @Body(q(ContentDraftRequestSchema)) b: z.infer<typeof ContentDraftRequestSchema>) {
    return this.content.createDraft(s, b.entries, b.minClientVersion, b.note, cid);
  }
  @Get('content/versions/:id/preview')
  contentPreview(@Staff() s: AdminActor, @Param('id', Id) id: string) {
    return this.content.preview(s, id);
  }
  @Post('content/versions/:id/publish')
  contentPublish(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(ConfigPublishRequestSchema)) b: { reason: string }) {
    return this.content.publish(s, id, b.reason, cid);
  }
  @Post('content/versions/:id/archive')
  contentArchive(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(ConfigPublishRequestSchema)) b: { reason: string }) {
    return this.content.archive(s, id, b.reason, cid);
  }

  // 18.8
  @Get('tuning')
  tuningOverview(@Staff() s: AdminActor) {
    return this.tuning.overview(s);
  }
  @Post('tuning/drafts')
  tuningDraft(@Staff() s: AdminActor, @CommandId() cid: string, @Body(q(TuningDraftRequestSchema)) b: z.infer<typeof TuningDraftRequestSchema>) {
    return this.tuning.createDraft(s, b.payload, b.note, cid);
  }
  @Get('tuning/versions/:id/diff')
  tuningDiff(@Staff() s: AdminActor, @Param('id', Id) id: string) {
    return this.tuning.diff(s, id);
  }
  @Post('tuning/versions/:id/simulate')
  @HttpCode(200)
  tuningSimulate(@Staff() s: AdminActor, @Param('id', Id) id: string) {
    return this.tuning.simulate(s, id);
  }
  @Post('tuning/versions/:id/publish')
  tuningPublish(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(ConfigPublishRequestSchema)) b: { reason: string }) {
    return this.tuning.publish(s, id, b.reason, cid);
  }
  @Post('tuning/rollback')
  tuningRollback(@Staff() s: AdminActor, @CommandId() cid: string, @Body(q(TuningRollbackRequestSchema)) b: z.infer<typeof TuningRollbackRequestSchema>) {
    return this.tuning.rollback(s, b.targetVersionId, b.newVersion, b.reason, cid);
  }

  // 18.9 / 18.11 / 18.12
  @Get('matching')
  matching(@Staff() s: AdminActor) {
    return this.reads.matching(s);
  }
  @Get('social')
  socialOverview(@Staff() s: AdminActor) {
    return this.reads.social(s);
  }
  @Post('social/anonymous/:id/hide')
  hideAnonymous(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(ConfigPublishRequestSchema)) b: { reason: string }) {
    return this.social.hideAnonymous(s, id, b.reason, cid);
  }
  @Get('ai')
  ai(@Staff() s: AdminActor) {
    return this.reads.ai(s);
  }
  @Get('ai/jobs')
  aiJobs(@Staff() s: AdminActor, @Query(q(AdminPageQuerySchema.extend({ status: z.string().max(32).optional(), kind: z.string().max(64).optional() }))) x: { status?: string; kind?: string; cursor?: string; limit: number }) {
    return this.trust.listAiJobs(s, x);
  }
  @Post('ai/jobs/:id/retry')
  aiRetry(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string) {
    return this.trust.retryAiJob(s, id, cid);
  }
  @Post('ai/jobs/:id/cancel')
  aiCancel(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string) {
    return this.trust.cancelAiJob(s, id, cid);
  }

  // 18.10
  @Get('economy/users/:id/ledger')
  ledger(@Staff() s: AdminActor, @Param('id', Id) id: string, @Query(q(AdminPageQuerySchema)) x: { cursor?: string; limit: number }) {
    return this.economy.ledger(s, id, x.cursor, x.limit);
  }
  @Post('economy/users/:id/corrections')
  correct(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(EconomyCorrectionRequestSchema)) b: z.infer<typeof EconomyCorrectionRequestSchema>) {
    return this.economy.correct(s, id, b.amount, b.reason, cid);
  }
  @Post('economy/users/:id/reconcile')
  reconcile(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string) {
    return this.economy.reconcile(s, id, cid);
  }
  @Get('economy/webhooks')
  webhooks(@Staff() s: AdminActor, @Query(q(WebhookListQuerySchema)) x: z.infer<typeof WebhookListQuerySchema>) {
    return this.economy.webhooks(s, x);
  }
  @Post('economy/webhooks/:id/redrive')
  redriveWebhook(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(RedriveRequestSchema)) b: { reason: string }) {
    return this.economy.redriveWebhook(s, id, b.reason, cid);
  }

  // 18.13
  @Get('ops')
  opsStatus(@Staff() s: AdminActor) {
    return this.ops.status(s);
  }
  @Get('ops/outbox/dead')
  dead(@Staff() s: AdminActor) {
    return this.ops.dead(s);
  }
  @Post('ops/outbox/:id/redrive')
  redrive(@Staff() s: AdminActor, @Param('id', Id) id: string, @CommandId() cid: string, @Body(q(RedriveRequestSchema)) b: { reason: string }) {
    return this.ops.redrive(s, id, b.reason, cid);
  }

  // Audit
  @Get('audit')
  auditList(@Staff() s: AdminActor, @Query(q(AuditQuerySchema)) x: z.infer<typeof AuditQuerySchema>) {
    return this.audit.list(s, x);
  }
}
