import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { type LinkMinimoas, LinkMinimoasBody, type MyMinimoas, PageQuery, ReadingAllBody, type ReadingAll, ReadingDefaultBody, type ReadingDefault, Uuid } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { RateLimit } from '../../../shared/user-rate-limit';
import { ZodPipe } from '../../../shared/zod.pipe';
import { LinkSession } from '../application/link-session';
import { ChatMinimoas } from './chat-minimoas';

const LinkId = new ZodPipe(Uuid);

/**
 * Réglages des minimoas : `GET|PATCH /v1/links/:id/minimoas` (options du lien), `GET /v1/me/minimoas` (« Moi »),
 * `PUT /v1/me/minimoas/default` (réglage des nouveaux liens) et `POST /v1/me/minimoas/all` (tous les liens d'un coup).
 */
@Controller('v1')
export class LinkMinimoasController {
  constructor(
    @Inject(ChatMinimoas) private readonly minimoas: ChatMinimoas,
    @Inject(LinkSession) private readonly session: LinkSession,
  ) {}

  @Get('links/:id/minimoas')
  async get(@CurrentUser() user: AuthUser, @Param('id', LinkId) id: string): Promise<LinkMinimoas> {
    const draft = await this.session.open(id, user.userId);
    return this.minimoas.view(draft.link, user.userId);
  }

  @Patch('links/:id/minimoas')
  @RateLimit('write')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', LinkId) id: string,
    @Body(new ZodPipe(LinkMinimoasBody)) body: z.infer<typeof LinkMinimoasBody>,
  ): Promise<LinkMinimoas> {
    return this.minimoas.update(id, user.userId, body);
  }

  @Get('me/minimoas')
  async mine(@CurrentUser() user: AuthUser, @Query(new ZodPipe(PageQuery)) q: z.infer<typeof PageQuery>): Promise<MyMinimoas> {
    return this.minimoas.listForUser(user.userId, q.cursor ?? null, q.limit);
  }

  @Put('me/minimoas/default')
  @RateLimit('write')
  async setDefault(@CurrentUser() user: AuthUser, @Body(new ZodPipe(ReadingDefaultBody)) body: z.infer<typeof ReadingDefaultBody>): Promise<ReadingDefault> {
    return { readingDefault: await this.minimoas.setDefault(user.userId, body.readingDefault) };
  }

  @Post('me/minimoas/all')
  @HttpCode(200)
  @RateLimit('write')
  async setAll(@CurrentUser() user: AuthUser, @Body(new ZodPipe(ReadingAllBody)) body: z.infer<typeof ReadingAllBody>): Promise<ReadingAll> {
    return { updated: await this.minimoas.setAll(user.userId, body.consent) };
  }
}
