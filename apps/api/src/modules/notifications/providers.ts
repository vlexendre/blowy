import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../persistence/repository';
import {
  MemoryDevicesRepository,
  MemoryLiveActivityTokensRepository,
  MemoryNotificationLogRepository,
  MemoryNotificationSettingsRepository,
  MemoryPushReceiptsRepository,
} from './memory-notifications.repositories';
import {
  type DevicesRepository,
  LIVE_ACTIVITY_TOKENS,
  type LiveActivityTokensRepository,
  NOTIFICATION_LOG,
  NOTIFICATION_SETTINGS,
  type NotificationLogRepository,
  type NotificationSettingsRepository,
  PUSH_DEVICES,
  PUSH_RECEIPTS,
  type PushReceiptsRepository,
} from './ports';
import {
  SupabaseDevicesRepository,
  SupabaseLiveActivityTokensRepository,
  SupabaseNotificationLogRepository,
  SupabaseNotificationSettingsRepository,
  SupabasePushReceiptsRepository,
} from './supabase-notifications.repositories';

export const notificationsRepositories = (adapters: Adapters): Provider[] => [
  repository<DevicesRepository>(PUSH_DEVICES, adapters, (db) => new MemoryDevicesRepository(db), (c) => new SupabaseDevicesRepository(c)),
  repository<NotificationSettingsRepository>(NOTIFICATION_SETTINGS, adapters, (db) => new MemoryNotificationSettingsRepository(db), (c) => new SupabaseNotificationSettingsRepository(c)),
  repository<NotificationLogRepository>(NOTIFICATION_LOG, adapters, (db) => new MemoryNotificationLogRepository(db), (c) => new SupabaseNotificationLogRepository(c)),
  repository<LiveActivityTokensRepository>(LIVE_ACTIVITY_TOKENS, adapters, (db) => new MemoryLiveActivityTokensRepository(db), (c) => new SupabaseLiveActivityTokensRepository(c)),
  repository<PushReceiptsRepository>(PUSH_RECEIPTS, adapters, (db) => new MemoryPushReceiptsRepository(db), (c) => new SupabasePushReceiptsRepository(c)),
];
