/**
 * Composition root trust (agent E) : IA (services, file, journal), modération IA branchée
 * derrière le port de conversations, signalements, blocages, vérification (Veriff / démo /
 * non configuré), export/suppression, consentements IA, suggestions/signaux, et ports staff
 * ADMIN_MODERATION / ADMIN_TRUST consommés par le module admin (agent F).
 */
import { Global, Module } from '@nestjs/common';
import { ModerationPipeline } from '@blowy/ai';
import type { Db } from '@blowy/database';
import type { AppConfig } from '../../config/env.js';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import { ADMIN_MODERATION, ADMIN_TRUST } from '../../shared/application/ports/admin-trust.port.js';
import { BLOCK_SAFETY_HOOK, type BlockSafetyHook } from '../../shared/application/ports/block-hook.port.js';
import { SAFETY_STAFF_PORT, type SafetyStaffPort } from '../../shared/application/ports/safety-staff.port.js';
import { AI_SERVICES, AI_TASK_QUEUE, type AiServices, type AiTaskQueue } from '../../shared/application/ports/ai.port.js';
import { IDENTITY_VERIFICATION_PROVIDER, type IdentityVerificationProvider } from '../../shared/application/ports/identity-verification.port.js';
import { OBJECT_STORAGE, type ObjectStorage } from '../../shared/application/ports/object-storage.port.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import { createAiServices } from '../../shared/infrastructure/ai/ai.factory.js';
import { SwitchableAiTaskQueue } from '../../shared/infrastructure/ai/ai-task-queue.js';
import type { Logger } from '../../shared/infrastructure/logging/logger.js';
import { createObjectStorage } from '../../shared/infrastructure/storage/object-storage.js';
import { APP_CONFIG, CLOCK, COMMAND_BUS, DB, LOGGER, RANDOM, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { AI_MODERATION_GATEWAY, MODERATION_CASE_SINK, type ModerationCaseSink } from '../conversations/application/ports/moderation.gateway.js';
import { ModerateMessageUseCase } from '../conversations/application/moderate-message.use-case.js';
import { RELATIONSHIP_REPOSITORY, type RelationshipRepository } from '../relationships/application/ports/relationship.repository.js';
import { RelationshipLifecycle } from '../relationships/application/relationship-lifecycle.service.js';
import { VERIFICATION_GATEWAY, type VerificationGateway } from '../users/application/ports/verification.gateway.js';
import { RecordConsentsUseCase } from '../users/application/consents.use-case.js';
import { VERIFICATION_STARTER } from '../users/application/verification.use-case.js';
import { AI_FEATURE_REPOSITORY, AiConsentUseCase, ConversationSignalUseCase, SuggestionsUseCase, type AiFeatureRepository } from './application/ai-features.use-cases.js';
import { BlockService, BlockUserUseCase, ListBlocksQuery, ReportUseCase, TargetResolver } from './application/block-and-report.use-cases.js';
import { AI_INVALIDATION, TRUST_REPOSITORY, type AiInvalidation, type TrustRepository } from './application/ports/trust.repository.js';
import { BuildExportUseCase, ConsentWithdrawnHandler, CreateAppealUseCase, PRIVACY_REPOSITORY, PurgeDeletedAccountsJob, RequestDeletionUseCase, RequestExportUseCase, type PrivacyRepository } from './application/privacy.use-cases.js';
import { AdminModerationService, AdminTrustService, StaffGuard, SUBJECT_DECISION_PORT, type AiRetryAuthorizer, type SubjectDecisionPort } from './application/staff.use-cases.js';
import { StartVerificationUseCase, VerificationWebhookUseCase } from './application/verification.use-cases.js';
import { caseDueAt } from './domain/trust-rules.js';
import { AiModerationGateway, type VoiceTranscriber } from './infrastructure/ai-moderation.gateway.js';
import { PrismaAiFeatureRepository } from './infrastructure/prisma-ai-features.repository.js';
import { PrismaPrivacyRepository } from './infrastructure/prisma-privacy.repository.js';
import { PrismaAiInvalidation, PrismaTrustRepository } from './infrastructure/prisma-trust.repository.js';
import { AnonymousResponseReportedConsumer, ConsentWithdrawnConsumer, ConversationSignalEffect, ExportBuildEffect } from './infrastructure/trust.consumers.js';
import { VeriffIdentityProvider } from './infrastructure/veriff.provider.js';
import { TrustController, VerificationWebhookController } from './interface/trust.controller.js';

export const VOICE_TRANSCRIBER = Symbol.for('blowy.media.voiceTranscriber');
export const TRUST_OUTBOX = Symbol('TrustOutbox');
export const TRUST_JOBS = Symbol('TrustJobs');

/** Strategy vérification : Veriff si configuré ; démo locale hors prod ; sinon NOT_CONFIGURED. */
function selectIdentityProvider(cfg: AppConfig): IdentityVerificationProvider | null {
  if (cfg.VERIFICATION_PROVIDER !== 'veriff') return null;
  if (!cfg.VERIFF_API_KEY || !cfg.VERIFF_SHARED_SECRET || !cfg.VERIFF_BASE_URL || !cfg.VERIFF_CALLBACK_URL) return null; // production : parcours en attente
  return new VeriffIdentityProvider({ apiKey: cfg.VERIFF_API_KEY, sharedSecret: cfg.VERIFF_SHARED_SECRET, baseUrl: cfg.VERIFF_BASE_URL, callbackUrl: cfg.VERIFF_CALLBACK_URL, environment: cfg.isProduction ? 'PRODUCTION' : 'SANDBOX' });
}

type T = TrustRepository;
@Global()
@Module({
  controllers: [TrustController, VerificationWebhookController],
  providers: [
    { provide: OBJECT_STORAGE, useFactory: (c: AppConfig) => createObjectStorage(c), inject: [APP_CONFIG] },
    { provide: AI_SERVICES, useFactory: (c: AppConfig, db: Db, clock: Clock) => createAiServices(c, db, clock), inject: [APP_CONFIG, DB, CLOCK] },
    { provide: AI_TASK_QUEUE, useFactory: (l: Logger) => new SwitchableAiTaskQueue(l), inject: [LOGGER] },
    { provide: TRUST_REPOSITORY, useFactory: (db: Db) => new PrismaTrustRepository(db), inject: [DB] },
    { provide: AI_INVALIDATION, useFactory: (db: Db, c: Clock) => new PrismaAiInvalidation(db, c), inject: [DB, CLOCK] },
    { provide: PRIVACY_REPOSITORY, useFactory: (db: Db) => new PrismaPrivacyRepository(db), inject: [DB] },
    { provide: AI_FEATURE_REPOSITORY, useFactory: (db: Db) => new PrismaAiFeatureRepository(db), inject: [DB] },
    { provide: IDENTITY_VERIFICATION_PROVIDER, useFactory: selectIdentityProvider, inject: [APP_CONFIG] },
    {
      provide: MODERATION_CASE_SINK,
      useFactory: (r: T): ModerationCaseSink => ({ open: async (scope, c) => void (await r.openCase(scope, { ...c, dueAt: caseDueAt(scope.now, c.priority) })) }),
      inject: [TRUST_REPOSITORY],
    },
    {
      provide: AI_MODERATION_GATEWAY,
      useFactory: (ai: AiServices, db: Db, v: VoiceTranscriber | null, l: Logger) => (ai.providers ? new AiModerationGateway(new ModerationPipeline(ai.providers.moderation, ai.runner), ai.providers.moderation.name, db, v ?? null, l) : null),
      inject: [AI_SERVICES, DB, { token: VOICE_TRANSCRIBER, optional: true }, LOGGER],
    },
    { provide: TargetResolver, useFactory: (r: T) => new TargetResolver(r), inject: [TRUST_REPOSITORY] },
    {
      provide: BlockService,
      useFactory: (r: T, rr: RelationshipRepository, l: RelationshipLifecycle, ai: AiInvalidation, h: BlockSafetyHook | null) => new BlockService(r, rr, l, ai, h ?? null),
      inject: [TRUST_REPOSITORY, RELATIONSHIP_REPOSITORY, RelationshipLifecycle, AI_INVALIDATION, { token: BLOCK_SAFETY_HOOK, optional: true }],
    },
    { provide: BlockUserUseCase, useFactory: (b: CommandBus, t: TargetResolver, s: BlockService) => new BlockUserUseCase(b, t, s), inject: [COMMAND_BUS, TargetResolver, BlockService] },
    {
      provide: ReportUseCase,
      useFactory: (b: CommandBus, r: T, t: TargetResolver, s: BlockService, rr: RelationshipRepository, l: RelationshipLifecycle, rnd: RandomSource) => new ReportUseCase(b, r, t, s, rr, l, rnd),
      inject: [COMMAND_BUS, TRUST_REPOSITORY, TargetResolver, BlockService, RELATIONSHIP_REPOSITORY, RelationshipLifecycle, RANDOM],
    },
    { provide: ListBlocksQuery, useFactory: (r: T) => new ListBlocksQuery(r), inject: [TRUST_REPOSITORY] },
    { provide: CreateAppealUseCase, useFactory: (b: CommandBus, r: T) => new CreateAppealUseCase(b, r), inject: [COMMAND_BUS, TRUST_REPOSITORY] },
    {
      provide: StartVerificationUseCase,
      useFactory: (b: CommandBus, r: T, p: IdentityVerificationProvider | null, g: VerificationGateway, rnd: RandomSource) => new StartVerificationUseCase(b, r, p, g, rnd),
      inject: [COMMAND_BUS, TRUST_REPOSITORY, IDENTITY_VERIFICATION_PROVIDER, VERIFICATION_GATEWAY, RANDOM],
    },
    { provide: VERIFICATION_STARTER, useExisting: StartVerificationUseCase },
    { provide: VerificationWebhookUseCase, useFactory: (u: UnitOfWork, r: T, p: IdentityVerificationProvider | null) => new VerificationWebhookUseCase(u, r, p), inject: [UNIT_OF_WORK, TRUST_REPOSITORY, IDENTITY_VERIFICATION_PROVIDER] },
    { provide: RequestExportUseCase, useFactory: (b: CommandBus, p: PrivacyRepository, rnd: RandomSource) => new RequestExportUseCase(b, p, rnd), inject: [COMMAND_BUS, PRIVACY_REPOSITORY, RANDOM] },
    { provide: BuildExportUseCase, useFactory: (p: PrivacyRepository, s: ObjectStorage, c: Clock, rnd: RandomSource) => new BuildExportUseCase(p, s, c, rnd), inject: [PRIVACY_REPOSITORY, OBJECT_STORAGE, CLOCK, RANDOM] },
    {
      provide: RequestDeletionUseCase,
      useFactory: (b: CommandBus, p: PrivacyRepository, rr: RelationshipRepository, l: RelationshipLifecycle, ai: AiInvalidation, rnd: RandomSource) => new RequestDeletionUseCase(b, p, rr, l, ai, rnd),
      inject: [COMMAND_BUS, PRIVACY_REPOSITORY, RELATIONSHIP_REPOSITORY, RelationshipLifecycle, AI_INVALIDATION, RANDOM],
    },
    { provide: PurgeDeletedAccountsJob, useFactory: (p: PrivacyRepository, s: ObjectStorage) => new PurgeDeletedAccountsJob(p, s), inject: [PRIVACY_REPOSITORY, OBJECT_STORAGE] },
    { provide: ConsentWithdrawnHandler, useFactory: (ai: AiInvalidation) => new ConsentWithdrawnHandler(ai), inject: [AI_INVALIDATION] },
    { provide: SuggestionsUseCase, useFactory: (r: AiFeatureRepository, ai: AiServices, c: Clock, rnd: RandomSource) => new SuggestionsUseCase(r, ai, c, rnd), inject: [AI_FEATURE_REPOSITORY, AI_SERVICES, CLOCK, RANDOM] },
    { provide: ConversationSignalUseCase, useFactory: (r: AiFeatureRepository, ai: AiServices, c: Clock, rnd: RandomSource) => new ConversationSignalUseCase(r, ai, c, rnd), inject: [AI_FEATURE_REPOSITORY, AI_SERVICES, CLOCK, RANDOM] },
    { provide: AiConsentUseCase, useFactory: (r: AiFeatureRepository, ai: AiServices, rec: RecordConsentsUseCase) => new AiConsentUseCase(r, ai, rec), inject: [AI_FEATURE_REPOSITORY, AI_SERVICES, RecordConsentsUseCase] },
    { provide: StaffGuard, useFactory: (r: T, c: Clock) => new StaffGuard(r, c), inject: [TRUST_REPOSITORY, CLOCK] },
    {
      provide: ADMIN_MODERATION,
      useFactory: (r: T, b: CommandBus, g: StaffGuard, m: ModerateMessageUseCase, s: SubjectDecisionPort | null, c: Clock, rnd: RandomSource, sf: SafetyStaffPort | null) => new AdminModerationService(r, b, g, m, s ?? null, c, rnd, sf ?? null),
      inject: [TRUST_REPOSITORY, COMMAND_BUS, StaffGuard, ModerateMessageUseCase, { token: SUBJECT_DECISION_PORT, optional: true }, CLOCK, RANDOM, { token: SAFETY_STAFF_PORT, optional: true }],
    },
    {
      provide: ADMIN_TRUST,
      useFactory: (r: T, ai: AiInvalidation, b: CommandBus, u: UnitOfWork, g: StaffGuard, db: Db, rnd: RandomSource, q: AiTaskQueue, sf: SafetyStaffPort | null) => {
        const retry: AiRetryAuthorizer = {
          // Redrive : état ACTUEL (auteur actif, consentement modération, relation non bloquée).
          stillAuthorized: async (j) => {
            if (j.userId) {
              const u = await db.user.findUnique({ where: { id: j.userId }, select: { status: true } });
              if (!u || u.status === 'DELETED' || u.status === 'BANNED') return false;
            }
            if (j.contextId) {
              const c = await db.relationshipContext.findUnique({ where: { id: j.contextId }, select: { status: true } });
              if (!c || c.status === 'ENDED') return false;
            }
            return true;
          },
          requeue: async (j) => {
            if (j.subjectType === 'MEDIA') await q.enqueue(j.kind === 'vision.mission' ? 'media.assess_proof' : 'media.process_image', j.subjectId, { mediaId: j.subjectId });
          },
        };
        return new AdminTrustService(r, ai, b, u, g, retry, rnd, q, sf ?? null);
      },
      inject: [TRUST_REPOSITORY, AI_INVALIDATION, COMMAND_BUS, UNIT_OF_WORK, StaffGuard, DB, RANDOM, AI_TASK_QUEUE, { token: SAFETY_STAFF_PORT, optional: true }],
    },
    {
      provide: TRUST_OUTBOX,
      useFactory: (h: ConsentWithdrawnHandler, r: T, build: BuildExportUseCase, sig: ConversationSignalUseCase) => ({ consumers: [new ConsentWithdrawnConsumer(h), new AnonymousResponseReportedConsumer(r)], effects: [new ExportBuildEffect(build), new ConversationSignalEffect((id) => sig.refresh(id))] }),
      inject: [ConsentWithdrawnHandler, TRUST_REPOSITORY, BuildExportUseCase, ConversationSignalUseCase],
    },
    {
      provide: TRUST_JOBS,
      useFactory: (p: PurgeDeletedAccountsJob) => [{ name: 'privacy.purge', everyMs: 60 * 60_000, run: (now: Date) => p.run(now) }],
      inject: [PurgeDeletedAccountsJob],
    },
  ],
  exports: [
    OBJECT_STORAGE,
    AI_SERVICES,
    AI_TASK_QUEUE,
    TRUST_REPOSITORY,
    AI_INVALIDATION,
    MODERATION_CASE_SINK,
    AI_MODERATION_GATEWAY,
    ADMIN_MODERATION,
    ADMIN_TRUST,
    VERIFICATION_STARTER,
    BlockService,
    SuggestionsUseCase,
    ConversationSignalUseCase,
    PurgeDeletedAccountsJob,
    TRUST_OUTBOX,
    TRUST_JOBS,
  ],
})
export class TrustModule {}
