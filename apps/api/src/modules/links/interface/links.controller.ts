import { Body, Controller, Delete, Get, Inject, Param, Post, Query } from '@nestjs/common';
import {
  ConfirmUploadBody,
  Iso,
  type Link,
  type LinkAction,
  type Memories,
  type MessagesPage,
  SendMessageBody,
  UploadTicketBody,
  type UploadTicket,
  Uuid,
} from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { MEDIA_URL_SECONDS, type Storage } from '../../../integrations/storage/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { STORAGE } from '../../../shared/tokens';
import { ZodPipe } from '../../../shared/zod.pipe';
import { ArchiveLink } from '../application/archive-link.usecase';
import { GetLink } from '../application/get-link.usecase';
import { GetMemories } from '../application/get-memories.usecase';
import type { LinkActionResult } from '../application/link-action';
import { ListLinks } from '../application/list-links.usecase';
import { ListMessages } from '../application/list-messages.usecase';
import { MarkRead } from '../application/mark-read.usecase';
import { PhotoTicket } from '../application/photo-ticket.usecase';
import { ReviveLink } from '../application/revive-link.usecase';
import { SendMessage } from '../application/send-message.usecase';
import { SendPhoto } from '../application/send-photo.usecase';
import { LinkPresenter } from './link.presenter';

const LinkId = new ZodPipe(Uuid);
const Before = new ZodPipe(Iso.datetime({ offset: true }).optional());

@Controller('v1/links')
export class LinksController {
  constructor(
    @Inject(ListLinks) private readonly listLinks: ListLinks,
    @Inject(GetLink) private readonly getLink: GetLink,
    @Inject(ArchiveLink) private readonly archiveLink: ArchiveLink,
    @Inject(ListMessages) private readonly listMessages: ListMessages,
    @Inject(SendMessage) private readonly sendMessage: SendMessage,
    @Inject(MarkRead) private readonly markRead: MarkRead,
    @Inject(ReviveLink) private readonly reviveLink: ReviveLink,
    @Inject(PhotoTicket) private readonly photoTicket: PhotoTicket,
    @Inject(SendPhoto) private readonly sendPhoto: SendPhoto,
    @Inject(GetMemories) private readonly getMemories: GetMemories,
    @Inject(LinkPresenter) private readonly presenter: LinkPresenter,
    @Inject(STORAGE) private readonly storage: Storage,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser): Promise<Link[]> {
    return this.presenter.links(await this.listLinks.execute(user.userId), user.userId);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id', LinkId) id: string): Promise<Link> {
    return this.presenter.link(await this.getLink.execute(id, user.userId), user.userId);
  }

  @Delete(':id')
  async archive(@CurrentUser() user: AuthUser, @Param('id', LinkId) id: string): Promise<{ ok: true }> {
    await this.archiveLink.execute(id, user.userId);
    return { ok: true };
  }

  @Get(':id/messages')
  async messages(@CurrentUser() user: AuthUser, @Param('id', LinkId) id: string, @Query('before', Before) before?: string): Promise<MessagesPage> {
    const page = await this.listMessages.execute(id, user.userId, before ? new Date(before).toISOString() : null);
    return { messages: await this.presenter.messagesFor(page.link, page.messages, user.userId), nextBefore: page.nextBefore };
  }

  @Post(':id/messages')
  async send(
    @CurrentUser() user: AuthUser,
    @Param('id', LinkId) id: string,
    @Body(new ZodPipe(SendMessageBody)) body: z.infer<typeof SendMessageBody>,
  ): Promise<LinkAction> {
    return this.action(await this.sendMessage.execute({ linkId: id, userId: user.userId, body: body.body, tone: body.tone }), user.userId);
  }

  @Post(':id/read')
  async read(@CurrentUser() user: AuthUser, @Param('id', LinkId) id: string): Promise<{ ok: true }> {
    await this.markRead.execute(id, user.userId);
    return { ok: true };
  }

  @Post(':id/revive')
  async revive(@CurrentUser() user: AuthUser, @Param('id', LinkId) id: string): Promise<LinkAction> {
    return this.action(await this.reviveLink.execute(id, user.userId), user.userId);
  }

  @Post(':id/photo/ticket')
  async ticket(
    @CurrentUser() user: AuthUser,
    @Param('id', LinkId) id: string,
    @Body(new ZodPipe(UploadTicketBody)) body: z.infer<typeof UploadTicketBody>,
  ): Promise<UploadTicket> {
    return this.photoTicket.execute(id, user.userId, body.contentType);
  }

  @Post(':id/photo')
  async photo(
    @CurrentUser() user: AuthUser,
    @Param('id', LinkId) id: string,
    @Body(new ZodPipe(ConfirmUploadBody)) body: z.infer<typeof ConfirmUploadBody>,
  ): Promise<LinkAction> {
    return this.action(await this.sendPhoto.execute(id, user.userId, body.path), user.userId);
  }

  @Get(':id/memories')
  async memories(@CurrentUser() user: AuthUser, @Param('id', LinkId) id: string): Promise<Memories> {
    const result = await this.getMemories.execute(id, user.userId);
    const sign = (path: string | null): Promise<string | null> => (path ? this.storage.signedUrl(path, MEDIA_URL_SECONDS) : Promise.resolve(null));
    const days = await Promise.all(
      result.days.map(async (d) => ({ day: d.day, myPhotoUrl: await sign(d.myPath), theirPhotoUrl: await sign(d.theirPath) })),
    );
    return { days, stats: result.stats };
  }

  private async action(result: LinkActionResult, viewerId: string): Promise<LinkAction> {
    const [link, messages] = await Promise.all([
      this.presenter.link(result.link, viewerId),
      this.presenter.messagesFor(result.link, result.messages, viewerId),
    ]);
    return { link, messages };
  }
}
