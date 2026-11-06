/**
 * Routes /v1 du module `notifications` (contrats `@blowy/api-contract/notifications`) :
 *  GET/PUT /v1/me/notifications/settings · PUT/DELETE /v1/me/push-token ·
 *  GET /v1/dev/push-inbox (boîte locale, hors production seulement ; 404 sinon).
 */
import { Body, Controller, Delete, Get, HttpCode, Inject, Put } from '@nestjs/common';
import { DevPushInboxSchema, NotificationSettingsViewSchema, RegisterPushTokenRequestSchema, RegisterPushTokenResponseSchema, UpdateNotificationSettingsRequestSchema, type RegisterPushTokenRequest, type UpdateNotificationSettingsRequest } from '@blowy/api-contract';
import { Errors } from '../../../shared/domain/errors.js';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { PUSH_SENDER, type PushSender } from '../application/ports.js';
import { NotificationSettingsUseCases } from '../application/settings.use-cases.js';
import { LocalInboxPushSender } from '../infrastructure/push-senders.js';

@Controller('v1')
export class NotificationsController {
  constructor(
    @Inject(NotificationSettingsUseCases) private readonly settings: NotificationSettingsUseCases,
    @Inject(PUSH_SENDER) private readonly sender: PushSender,
  ) {}

  @Get('me/notifications/settings')
  async get(@CurrentUser() u: AuthenticatedUser) {
    return NotificationSettingsViewSchema.parse(await this.settings.view(u.userId, u.sessionId));
  }

  @Put('me/notifications/settings')
  async put(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(UpdateNotificationSettingsRequestSchema)) body: UpdateNotificationSettingsRequest) {
    await this.settings.update(u.userId, cid, body);
    return NotificationSettingsViewSchema.parse(await this.settings.view(u.userId, u.sessionId));
  }

  @Put('me/push-token')
  async register(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(RegisterPushTokenRequestSchema)) body: RegisterPushTokenRequest) {
    await this.settings.registerToken(u.userId, u.sessionId, cid, body);
    return RegisterPushTokenResponseSchema.parse({ registered: true });
  }

  @Delete('me/push-token')
  @HttpCode(204)
  async unregister(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string) {
    await this.settings.unregisterToken(u.userId, u.sessionId, cid);
  }

  @Get('dev/push-inbox')
  async inbox(@CurrentUser() u: AuthenticatedUser) {
    if (!(this.sender instanceof LocalInboxPushSender)) throw Errors.notFound('Boîte locale');
    return DevPushInboxSchema.parse({ items: await this.sender.inbox(u.userId) });
  }
}
