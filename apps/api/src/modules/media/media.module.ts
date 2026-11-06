/** Composition root media (agent E). */
import { OUTING_REVEAL_READER, PHOTO_TOKEN_ISSUER, type OutingRevealReader, type PhotoTokenIssuer } from '../../shared/application/ports/outing-photos.port.js';
import { Global, Module, type OnModuleInit, Inject } from '@nestjs/common';
import { ModerationPipeline } from '@blowy/ai';
import type { Db } from '@blowy/database';
import type { AppConfig } from '../../config/env.js';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import { AI_SERVICES, AI_TASK_QUEUE, type AiServices, type AiTaskQueue } from '../../shared/application/ports/ai.port.js';
import { OBJECT_STORAGE, type ObjectStorage } from '../../shared/application/ports/object-storage.port.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import type { Logger } from '../../shared/infrastructure/logging/logger.js';
import { APP_CONFIG, CLOCK, COMMAND_BUS, DB, LOGGER, RANDOM, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { VOICE_MESSAGE_GATE } from '../conversations/application/ports/moderation.gateway.js';
import { TRUST_REPOSITORY, type TrustRepository } from '../trust/application/ports/trust.repository.js';
import { SUBJECT_DECISION_PORT, type SubjectDecisionPort } from '../trust/application/staff.use-cases.js';
import { caseDueAt } from '../trust/domain/trust-rules.js';
import { VOICE_TRANSCRIBER } from '../trust/trust.module.js';
import {
  AssessMissionProofUseCase,
  CreateAccessTokenUseCase,
  CreateUploadUseCase,
  FinalizeMediaUseCase,
  GetMediaContentQuery,
  GetMediaQuery,
  MEDIA_TASKS,
  MediaAccessService,
  PhotoRevealUseCase,
  ProcessImageUseCase,
  PurgeMediaJob,
  ReceiveUploadUseCase,
  ShareMediaUseCase,
  VoiceGateService,
  VoiceTranscriptionService,
  emitProofValidated,
} from './application/media.use-cases.js';
import { AUDIO_PROBE, IMAGE_PROCESSOR, MEDIA_REPOSITORY, type AudioProbe, type ImageProcessor, type MediaRepository } from './application/ports/media.ports.js';
import { ContainerAudioProbe } from './infrastructure/audio-probe.js';
import { PrismaMediaRepository } from './infrastructure/prisma-media.repository.js';
import { SharpImageProcessor } from './infrastructure/sharp-image.processor.js';
import { MediaController } from './interface/media.controller.js';

export const MEDIA_JOBS = Symbol('MediaJobs');
const CASES = Symbol('MediaCases');
type M = MediaRepository;
type Cases = { open(c: { subjectType: 'MEDIA' | 'MISSION_SUBMISSION'; subjectId: string; subjectUserId: string; reasonCode: string; priority: 1 | 2 | 3; restricted: boolean }): Promise<void> };

@Global()
@Module({
  controllers: [MediaController],
  providers: [
    { provide: MEDIA_REPOSITORY, useFactory: (db: Db, c: Clock) => new PrismaMediaRepository(db, c), inject: [DB, CLOCK] },
    { provide: IMAGE_PROCESSOR, useClass: SharpImageProcessor },
    { provide: AUDIO_PROBE, useClass: ContainerAudioProbe },
    {
      provide: CASES,
      useFactory: (r: TrustRepository, u: UnitOfWork): Cases => ({ open: (c) => u.run(async (scope) => void (await r.openCase(scope, { ...c, dueAt: caseDueAt(scope.now, c.priority) }))) }),
      inject: [TRUST_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: MediaAccessService,
      useFactory: (r: M, c: Clock, o: OutingRevealReader | null) => new MediaAccessService(r, c, o ?? null),
      inject: [MEDIA_REPOSITORY, CLOCK, { token: OUTING_REVEAL_READER, optional: true }],
    },
    {
      // V5 : jetons photo des sorties (consommé par `outings`).
      provide: PHOTO_TOKEN_ISSUER,
      useFactory: (r: M, t: CreateAccessTokenUseCase): PhotoTokenIssuer => ({
        currentProfilePhotoId: async (userId) => (await r.currentProfilePhoto(userId))?.id ?? null,
        issue: (viewerId, mediaId) => t.execute(viewerId, mediaId, 'thumbnail', undefined).then((x) => x.url, () => null),
      }),
      inject: [MEDIA_REPOSITORY, CreateAccessTokenUseCase],
    },
    { provide: CreateUploadUseCase, useFactory: (b: CommandBus, r: M, rnd: RandomSource, cfg: AppConfig, c: Clock) => new CreateUploadUseCase(b, r, rnd, cfg.PUBLIC_API_URL, c), inject: [COMMAND_BUS, MEDIA_REPOSITORY, RANDOM, APP_CONFIG, CLOCK] },
    { provide: ReceiveUploadUseCase, useFactory: (r: M, s: ObjectStorage, c: Clock) => new ReceiveUploadUseCase(r, s, c), inject: [MEDIA_REPOSITORY, OBJECT_STORAGE, CLOCK] },
    {
      provide: FinalizeMediaUseCase,
      useFactory: (r: M, s: ObjectStorage, i: ImageProcessor, a: AudioProbe, q: AiTaskQueue, c: Clock, l: Logger) => new FinalizeMediaUseCase(r, s, i, a, q, c, l),
      inject: [MEDIA_REPOSITORY, OBJECT_STORAGE, IMAGE_PROCESSOR, AUDIO_PROBE, AI_TASK_QUEUE, CLOCK, LOGGER],
    },
    {
      provide: ProcessImageUseCase,
      useFactory: (r: M, s: ObjectStorage, ai: AiServices, q: AiTaskQueue, u: UnitOfWork, c: Clock, cs: Cases) => new ProcessImageUseCase(r, s, ai, ai.providers ? new ModerationPipeline(ai.providers.moderation, ai.runner) : null, q, u, c, cs),
      inject: [MEDIA_REPOSITORY, OBJECT_STORAGE, AI_SERVICES, AI_TASK_QUEUE, UNIT_OF_WORK, CLOCK, CASES],
    },
    { provide: AssessMissionProofUseCase, useFactory: (r: M, s: ObjectStorage, ai: AiServices, u: UnitOfWork, cs: Cases) => new AssessMissionProofUseCase(r, s, ai, u, cs), inject: [MEDIA_REPOSITORY, OBJECT_STORAGE, AI_SERVICES, UNIT_OF_WORK, CASES] },
    { provide: GetMediaContentQuery, useFactory: (r: M, s: ObjectStorage, a: MediaAccessService, c: Clock) => new GetMediaContentQuery(r, s, a, c), inject: [MEDIA_REPOSITORY, OBJECT_STORAGE, MediaAccessService, CLOCK] },
    { provide: GetMediaQuery, useFactory: (r: M) => new GetMediaQuery(r), inject: [MEDIA_REPOSITORY] },
    { provide: CreateAccessTokenUseCase, useFactory: (r: M, a: MediaAccessService, rnd: RandomSource, c: Clock, cfg: AppConfig) => new CreateAccessTokenUseCase(r, a, rnd, c, cfg.PUBLIC_API_URL), inject: [MEDIA_REPOSITORY, MediaAccessService, RANDOM, CLOCK, APP_CONFIG] },
    { provide: ShareMediaUseCase, useFactory: (b: CommandBus, r: M, c: Clock) => new ShareMediaUseCase(b, r, c), inject: [COMMAND_BUS, MEDIA_REPOSITORY, CLOCK] },
    { provide: PhotoRevealUseCase, useFactory: (b: CommandBus, r: M, rnd: RandomSource, c: Clock) => new PhotoRevealUseCase(b, r, rnd, c), inject: [COMMAND_BUS, MEDIA_REPOSITORY, RANDOM, CLOCK] },
    {
      provide: VOICE_MESSAGE_GATE,
      useFactory: (r: M, db: Db, c: Clock) => new VoiceGateService(r, { conversationContext: async (id) => (await db.conversation.findUnique({ where: { id }, select: { contextId: true } }))?.contextId ?? null }, c),
      inject: [MEDIA_REPOSITORY, DB, CLOCK],
    },
    { provide: VOICE_TRANSCRIBER, useFactory: (r: M, s: ObjectStorage, ai: AiServices) => new VoiceTranscriptionService(r, s, ai), inject: [MEDIA_REPOSITORY, OBJECT_STORAGE, AI_SERVICES] },
    {
      provide: SUBJECT_DECISION_PORT,
      useFactory: (r: M, s: ObjectStorage, u: UnitOfWork, c: Clock): SubjectDecisionPort => ({
        applyMediaDecision: async (mediaId, action) => {
          const a = await r.load(null, mediaId);
          if (!a) return;
          if (action === 'ALLOW' || action === 'WARN') await r.update(null, mediaId, { status: 'READY', rejectReason: null });
          else {
            for (const k of await r.deleteDerivatives(mediaId)) await s.delete(k);
            await r.revokeTokensFor(mediaId);
            await r.update(null, mediaId, { status: 'REJECTED', rejectReason: 'MODERATION', purgeAfter: new Date(c.now().getTime() + 30 * 86_400_000) });
          }
        },
        applyProofDecision: async (proofId, action, staffUserId) => {
          await u.run(async (scope) => {
            const p = await r.loadProof(scope, proofId);
            if (!p || p.status === 'APPROVED' || p.status === 'REJECTED') return;
            const approve = action === 'ALLOW' || action === 'WARN';
            await r.updateProof(scope, proofId, { status: approve ? 'APPROVED' : 'REJECTED', decidedAt: scope.now, decidedById: staffUserId });
            // Réexamen : événement de récompense émis AU PLUS une fois (rewardKey unique).
            if (approve) await emitProofValidated(r, scope, proofId);
          });
        },
      }),
      inject: [MEDIA_REPOSITORY, OBJECT_STORAGE, UNIT_OF_WORK, CLOCK],
    },
    { provide: PurgeMediaJob, useFactory: (r: M, s: ObjectStorage) => new PurgeMediaJob(r, s), inject: [MEDIA_REPOSITORY, OBJECT_STORAGE] },
    { provide: MEDIA_JOBS, useFactory: (p: PurgeMediaJob) => [{ name: 'media.purge', everyMs: 60 * 60_000, run: (now: Date) => p.run(now) }], inject: [PurgeMediaJob] },
  ],
  exports: [PHOTO_TOKEN_ISSUER, MEDIA_REPOSITORY, VOICE_MESSAGE_GATE, VOICE_TRANSCRIBER, SUBJECT_DECISION_PORT, PurgeMediaJob, MEDIA_JOBS, ProcessImageUseCase, AssessMissionProofUseCase, MediaAccessService],
})
export class MediaModule implements OnModuleInit {
  constructor(
    @Inject(AI_TASK_QUEUE) private readonly queue: AiTaskQueue,
    @Inject(ProcessImageUseCase) private readonly process: ProcessImageUseCase,
    @Inject(AssessMissionProofUseCase) private readonly assess: AssessMissionProofUseCase,
  ) {}
  onModuleInit() {
    this.queue.register(MEDIA_TASKS.PROCESS_IMAGE, (p) => this.process.execute(String(p.mediaId)));
    this.queue.register(MEDIA_TASKS.ASSESS_PROOF, (p) => this.assess.execute(String(p.mediaId)));
  }
}
