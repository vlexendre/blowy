import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, Query, Req, Res } from '@nestjs/common';
import {
  AccessTokenSchema,
  ContentQuerySchema,
  CreateAccessTokenRequestSchema,
  CreateUploadRequestSchema,
  MediaViewSchema,
  PhotoRevealRequestSchema,
  PhotoRevealStateSchema,
  ShareMediaRequestSchema,
  UploadSessionSchema,
  UuidSchema,
  type CreateUploadRequest,
} from '@blowy/api-contract';
import type { Response } from 'express';
import type { z } from 'zod';
import { Public } from '../../../shared/interface/auth.guard.js';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser, BlowyRequest } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { Errors } from '../../../shared/domain/errors.js';
import { CreateAccessTokenUseCase, CreateUploadUseCase, FinalizeMediaUseCase, GetMediaContentQuery, GetMediaQuery, PhotoRevealUseCase, ReceiveUploadUseCase, ShareMediaUseCase } from '../application/media.use-cases.js';

const Id = new ZodPipe(UuidSchema);

/** En-têtes de livraison : aucun cache partagé ni CDN public, jamais d'exécution inline. */
function sendPrivate(res: Response, bytes: Uint8Array, contentType: string) {
  res.setHeader('cache-control', 'private, no-store, max-age=0');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('content-security-policy', "default-src 'none'; sandbox");
  res.setHeader('content-disposition', 'inline');
  res.setHeader('cross-origin-resource-policy', 'same-site');
  res.type(contentType).send(Buffer.from(bytes));
}

@Controller('v1')
export class MediaController {
  constructor(
    @Inject(CreateUploadUseCase) private readonly createUpload: CreateUploadUseCase,
    @Inject(ReceiveUploadUseCase) private readonly receive: ReceiveUploadUseCase,
    @Inject(FinalizeMediaUseCase) private readonly finalize: FinalizeMediaUseCase,
    @Inject(GetMediaContentQuery) private readonly content: GetMediaContentQuery,
    @Inject(GetMediaQuery) private readonly getMedia: GetMediaQuery,
    @Inject(CreateAccessTokenUseCase) private readonly tokens: CreateAccessTokenUseCase,
    @Inject(ShareMediaUseCase) private readonly share: ShareMediaUseCase,
    @Inject(PhotoRevealUseCase) private readonly reveal: PhotoRevealUseCase,
  ) {}

  @Post('media/uploads')
  async upload(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(CreateUploadRequestSchema)) body: CreateUploadRequest) {
    return UploadSessionSchema.parse(await this.createUpload.execute(u.userId, cid, body));
  }

  /** Octets bruts vers la quarantaine privée (propriétaire uniquement, session non expirée). */
  @Put('media/uploads/:id')
  @HttpCode(204)
  async put(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string, @Req() req: BlowyRequest) {
    if (!req.rawBody) throw Errors.validation({ reason: 'EMPTY' });
    await this.receive.execute(u.userId, id, req.rawBody);
  }

  @Post('media/:id/finalize')
  @HttpCode(200)
  async fin(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string) {
    return MediaViewSchema.parse(await this.finalize.execute(u.userId, id));
  }

  @Get('media/:id')
  async one(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string) {
    return MediaViewSchema.parse(await this.getMedia.execute(u.userId, id));
  }

  /** Livraison authentifiée : ACL revérifiée à chaque accès ; 404 identique pour inexistant/interdit. */
  @Get('media/:id/content')
  async get(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string, @Query(new ZodPipe(ContentQuerySchema)) q: z.infer<typeof ContentQuerySchema>, @Res() res: Response) {
    const r = await this.content.execute(u.userId, id, q.variant, q.relationshipId);
    sendPrivate(res, r.bytes, r.contentType);
  }

  /** Jeton court révocable (5 min), pour les composants image qui ne posent pas d'en-tête. */
  @Post('media/:id/access-tokens')
  async token(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string, @Body(new ZodPipe(CreateAccessTokenRequestSchema)) body: z.infer<typeof CreateAccessTokenRequestSchema>) {
    return AccessTokenSchema.parse(await this.tokens.execute(u.userId, id, body.variant, body.relationshipId));
  }

  @Public()
  @Get('media/content/:token')
  async byToken(@Param('token') token: string, @Res() res: Response) {
    if (!/^[0-9a-f]{64}$/.test(token)) throw Errors.notFound('Média');
    const r = await this.content.byToken(token);
    sendPrivate(res, r.bytes, r.contentType);
  }

  @Post('media/:id/share')
  @HttpCode(200)
  async shareMedia(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(ShareMediaRequestSchema)) body: z.infer<typeof ShareMediaRequestSchema>) {
    return MediaViewSchema.parse(await this.share.execute(u.userId, id, cid, body));
  }

  @Get('relationships/:id/photo-reveal')
  async revealState(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string, @Query('scope') scope?: string) {
    return PhotoRevealStateSchema.parse(await this.reveal.state(u.userId, id, scope === 'PHOTO_ORIGINAL' ? 'PHOTO_ORIGINAL' : 'PHOTO_REVEAL'));
  }

  @Post('relationships/:id/photo-reveal')
  @HttpCode(200)
  async revealRespond(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(PhotoRevealRequestSchema)) body: z.infer<typeof PhotoRevealRequestSchema>) {
    return PhotoRevealStateSchema.parse(await this.reveal.respond(u.userId, id, cid, body));
  }
}
