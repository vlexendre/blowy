import { Body, Controller, Get, Inject, Patch, Post } from '@nestjs/common';
import { type NotificationSettings as SettingsDto, NotificationSettingsBody, RegisterDeviceBody, RemoveDeviceBody } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../integrations/auth/ports';
import { CurrentUser } from '../../shared/auth.guard';
import { RateLimit } from '../../shared/user-rate-limit';
import { ZodPipe } from '../../shared/zod.pipe';
import { LiveActivities } from './live-activities';
import { NotificationSettings } from './notification-settings';

/** Appareils (`/v1/devices`) et réglages des notifications (`/v1/notifications/settings`). */
@Controller('v1')
export class NotificationsController {
  constructor(
    @Inject(NotificationSettings) private readonly settings: NotificationSettings,
    @Inject(LiveActivities) private readonly live: LiveActivities,
  ) {}

  @Post('devices')
  @RateLimit('write')
  async register(@CurrentUser() user: AuthUser, @Body(new ZodPipe(RegisterDeviceBody)) body: z.infer<typeof RegisterDeviceBody>): Promise<SettingsDto> {
    // Jeton APNs d'activité en direct : rangé à part, jamais envoyé au service Expo.
    if (body.kind === 'apns_live_activity') {
      await this.settings.requireProfile(user.userId);
      if (body.platform !== 'ios') return this.settings.view(user.userId);
      await this.live.register(user.userId, body, (await this.settings.resolve(user.userId)).timeZone);
      return this.settings.view(user.userId);
    }
    return this.settings.registerDevice(user.userId, body);
  }

  @Post('devices/remove')
  @RateLimit('write')
  async remove(@CurrentUser() user: AuthUser, @Body(new ZodPipe(RemoveDeviceBody)) body: z.infer<typeof RemoveDeviceBody>): Promise<{ ok: true }> {
    await Promise.all([this.settings.removeDevice(user.userId, body.token), this.live.remove(user.userId, body.token)]);
    return { ok: true };
  }

  @Get('notifications/settings')
  async get(@CurrentUser() user: AuthUser): Promise<SettingsDto> {
    return this.settings.view(user.userId);
  }

  @Patch('notifications/settings')
  @RateLimit('write')
  async update(@CurrentUser() user: AuthUser, @Body(new ZodPipe(NotificationSettingsBody)) body: z.infer<typeof NotificationSettingsBody>): Promise<SettingsDto> {
    return this.settings.update(user.userId, body);
  }
}
