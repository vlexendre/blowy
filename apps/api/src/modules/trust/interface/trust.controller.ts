import { Body, Controller, Get, HttpCode, Inject, Param, Post, Req, Res } from '@nestjs/common';
import {
  AiConsentStateSchema,
  AppealViewSchema,
  BlockListSchema,
  BlockViewSchema,
  ConversationSignalViewSchema,
  CreateAppealRequestSchema,
  CreateBlockRequestSchema,
  CreateDeletionRequestSchema,
  CreateReportRequestSchema,
  DeletionViewSchema,
  ExportViewSchema,
  RecordAiConsentRequestSchema,
  ReportViewSchema,
  RequestSuggestionsSchema,
  SuggestionSetViewSchema,
  UuidSchema,
  type CreateReportRequest,
} from '@blowy/api-contract';
import type { Response } from 'express';
import type { z } from 'zod';
import type { AppConfig } from '../../../config/env.js';
import type { ObjectStorage } from '../../../shared/application/ports/object-storage.port.js';
import { OBJECT_STORAGE } from '../../../shared/application/ports/object-storage.port.js';
import { Errors } from '../../../shared/domain/errors.js';
import { Public } from '../../../shared/interface/auth.guard.js';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser, BlowyRequest } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { APP_CONFIG, CLOCK } from '../../../shared/shared.tokens.js';
import type { Clock } from '../../../shared/application/clock.js';
import { AiConsentUseCase, ConversationSignalUseCase, SuggestionsUseCase } from '../application/ai-features.use-cases.js';
import { BlockUserUseCase, ListBlocksQuery, ReportUseCase } from '../application/block-and-report.use-cases.js';
import { CreateAppealUseCase, PRIVACY_REPOSITORY, RequestDeletionUseCase, RequestExportUseCase, type PrivacyRepository } from '../application/privacy.use-cases.js';
import { VerificationWebhookUseCase } from '../application/verification.use-cases.js';

const Id = new ZodPipe(UuidSchema);

@Controller('v1')
export class TrustController {
  constructor(
    @Inject(ReportUseCase) private readonly report: ReportUseCase,
    @Inject(BlockUserUseCase) private readonly block: BlockUserUseCase,
    @Inject(ListBlocksQuery) private readonly blocks: ListBlocksQuery,
    @Inject(CreateAppealUseCase) private readonly appeal: CreateAppealUseCase,
    @Inject(RequestExportUseCase) private readonly exportUc: RequestExportUseCase,
    @Inject(RequestDeletionUseCase) private readonly deletion: RequestDeletionUseCase,
    @Inject(PRIVACY_REPOSITORY) private readonly privacy: PrivacyRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(SuggestionsUseCase) private readonly suggestions: SuggestionsUseCase,
    @Inject(ConversationSignalUseCase) private readonly signals: ConversationSignalUseCase,
    @Inject(AiConsentUseCase) private readonly aiConsents: AiConsentUseCase,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Post('reports')
  async createReport(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(CreateReportRequestSchema)) body: CreateReportRequest) {
    return ReportViewSchema.parse((await this.report.execute(u.userId, cid, body)).result);
  }

  @Post('blocks')
  async createBlock(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(CreateBlockRequestSchema)) body: z.infer<typeof CreateBlockRequestSchema>) {
    const r = (await this.block.execute(u.userId, cid, body.target)).result;
    return BlockViewSchema.parse({ id: r.id, petName: null, createdAt: r.createdAt });
  }

  @Get('blocks')
  async listBlocks(@CurrentUser() u: AuthenticatedUser) {
    return BlockListSchema.parse(await this.blocks.execute(u.userId));
  }

  @Post('appeals')
  async createAppeal(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(CreateAppealRequestSchema)) body: z.infer<typeof CreateAppealRequestSchema>) {
    return AppealViewSchema.parse(await this.appeal.execute(u.userId, cid, body));
  }

  // ------------------------------------------------------------ export
  private exportView(e: NonNullable<Awaited<ReturnType<PrivacyRepository['loadExport']>>>) {
    const ready = e.status === 'READY' && e.downloadNonce && e.expiresAt && e.expiresAt > this.clock.now();
    return ExportViewSchema.parse({ id: e.id, status: e.status, requestedAt: e.requestedAt.toISOString(), readyAt: e.readyAt?.toISOString() ?? null, expiresAt: e.expiresAt?.toISOString() ?? null, downloadUrl: ready ? `${this.cfg.PUBLIC_API_URL}/v1/exports/${e.id}/download` : null });
  }

  @Post('exports')
  async requestExport(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string) {
    const { id } = await this.exportUc.execute(u.userId, cid);
    return this.exportView((await this.privacy.loadExport(id))!);
  }

  @Get('exports')
  async listExports(@CurrentUser() u: AuthenticatedUser) {
    return { items: (await this.privacy.listExports(u.userId)).map((e) => this.exportView(e)) };
  }

  /** Archive privée : auteur authentifié uniquement, lien limité dans le temps (nonce révocable). */
  @Get('exports/:id/download')
  async download(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string, @Res() res: Response) {
    const e = await this.privacy.loadExport(id);
    if (!e || e.userId !== u.userId || e.status !== 'READY' || !e.storageKey || !e.downloadNonce || !e.expiresAt || e.expiresAt <= this.clock.now()) throw Errors.notFound('Export');
    const obj = await this.storage.get(e.storageKey);
    if (!obj) throw Errors.notFound('Export');
    res.setHeader('cache-control', 'private, no-store');
    res.setHeader('content-disposition', `attachment; filename="blowy-export-${id}.json"`);
    res.type('application/json').send(Buffer.from(obj.bytes));
  }

  // ------------------------------------------------------------ suppression
  @Post('deletion-requests')
  async requestDeletion(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(CreateDeletionRequestSchema)) _body: z.infer<typeof CreateDeletionRequestSchema>) {
    await this.deletion.execute(u.userId, cid);
    const d = (await this.privacy.openDeletion(u.userId))!;
    return DeletionViewSchema.parse({ id: d.id, status: d.status, requestedAt: d.requestedAt.toISOString(), purgeAfter: d.purgeAfter?.toISOString() ?? null, backupPurgeAfter: d.backupPurgeAfter?.toISOString() ?? null });
  }

  // ------------------------------------------------------------ IA
  @Post('suggestions')
  @HttpCode(200)
  async suggest(@CurrentUser() u: AuthenticatedUser, @Body(new ZodPipe(RequestSuggestionsSchema)) body: z.infer<typeof RequestSuggestionsSchema>) {
    return SuggestionSetViewSchema.parse(await this.suggestions.execute(u.userId, body.conversationId, 'USER'));
  }

  @Get('conversations/:id/signal')
  async signal(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string) {
    return ConversationSignalViewSchema.parse(await this.signals.current(u.userId, id));
  }

  @Get('consents/ai')
  async aiConsentState(@CurrentUser() u: AuthenticatedUser) {
    return AiConsentStateSchema.parse(await this.aiConsents.state(u.userId));
  }

  @Post('consents/ai')
  @HttpCode(200)
  async aiConsent(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(RecordAiConsentRequestSchema)) body: z.infer<typeof RecordAiConsentRequestSchema>) {
    return AiConsentStateSchema.parse(await this.aiConsents.record(u.userId, cid, body));
  }
}

@Controller('v1/webhooks')
export class VerificationWebhookController {
  constructor(@Inject(VerificationWebhookUseCase) private readonly hook: VerificationWebhookUseCase) {}

  /** Webhook décision Veriff : HMAC-SHA256 du corps brut (X-HMAC-SIGNATURE), idempotent. */
  @Public()
  @Post('veriff')
  @HttpCode(200)
  async veriff(@Req() req: BlowyRequest) {
    if (!req.rawBody) throw Errors.validation({ reason: 'RAW_BODY_REQUIRED' });
    return { status: await this.hook.execute(req.rawBody, req.headers) };
  }
}
