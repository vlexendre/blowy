import { Body, Controller, Get, Inject, Param, Patch, Query } from '@nestjs/common';
import { type LinkMinimoas, LinkMinimoasBody, type MyMinimoas, PageQuery, Uuid } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { RateLimit } from '../../../shared/user-rate-limit';
import { ZodPipe } from '../../../shared/zod.pipe';
import { LinkSession } from '../application/link-session';
import { ChatMinimoas } from './chat-minimoas';

const LinkId = new ZodPipe(Uuid);

/**
 * Réglages des minimoas : `GET|PATCH /v1/links/:id/minimoas` (options du lien) et `GET /v1/me/minimoas` (« Moi »).
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
}
