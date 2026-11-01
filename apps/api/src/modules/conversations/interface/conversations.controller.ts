import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import {
  ConversationListSchema,
  MarkReadRequestSchema,
  MessagePageSchema,
  MessageViewSchema,
  PageQuerySchema,
  SendMessageRequestSchema,
  SendVoiceMessageRequestSchema,
  UuidSchema,
  type SendVoiceMessageRequest,
  type PageQuery,
  type SendMessageRequest,
} from '@blowy/api-contract';
import type { z } from 'zod';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { ReadMessagesQuery } from '../application/read-messages.query.js';
import { MarkReadUseCase, RevealWarnedUseCase } from '../application/reveal-warned.use-case.js';
import { SendMessageUseCase } from '../application/send-message.use-case.js';

const Id = new ZodPipe(UuidSchema);

@Controller('v1')
export class ConversationsController {
  constructor(
    @Inject(ReadMessagesQuery) private readonly read: ReadMessagesQuery,
    @Inject(SendMessageUseCase) private readonly send: SendMessageUseCase,
    @Inject(RevealWarnedUseCase) private readonly reveal: RevealWarnedUseCase,
    @Inject(MarkReadUseCase) private readonly markRead: MarkReadUseCase,
  ) {}

  @Get('conversations')
  async list(@CurrentUser() u: AuthenticatedUser) {
    return ConversationListSchema.parse({ items: await this.read.conversations(u.userId) });
  }

  @Get('conversations/:id/messages')
  async messages(@CurrentUser() u: AuthenticatedUser, @Param('id', Id) id: string, @Query(new ZodPipe(PageQuerySchema)) q: PageQuery) {
    return MessagePageSchema.parse(await this.read.messages(u.userId, id, q.cursor, q.limit));
  }

  @Post('conversations/:id/messages')
  async post(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(SendMessageRequestSchema)) body: SendMessageRequest) {
    return MessageViewSchema.parse(await this.send.execute(u.userId, id, cid, body));
  }

  /** Message vocal (agent E) : média VOICE_MESSAGE finalisé ; publié seulement après transcription + modération. */
  @Post('conversations/:id/voice-messages')
  async postVoice(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(SendVoiceMessageRequestSchema)) body: SendVoiceMessageRequest) {
    return MessageViewSchema.parse(await this.send.executeVoice(u.userId, id, cid, body));
  }

  @Post('conversations/:id/read')
  async read_(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(MarkReadRequestSchema)) body: z.infer<typeof MarkReadRequestSchema>) {
    return (await this.markRead.execute(u.userId, id, cid, body.seq)).result;
  }

  /** Révélation explicite d'un message WARNED (destinataire uniquement). */
  @Post('messages/:id/reveal')
  async revealWarned(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string) {
    return MessageViewSchema.parse(await this.reveal.execute(u.userId, id, cid));
  }
}
