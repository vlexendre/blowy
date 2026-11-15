import type { Provider } from '@nestjs/common';
import { dayOf } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import { type Adapters, repository } from '../../../persistence/repository';
import { AccountGate } from '../application/account-gate';
import type { ActivityRepository, AuditLogRepository, DailyStatsRepository, MetricsSource, ModerationRepository, SuspensionsRepository } from '../ports';
import { ACCOUNT_GATE, ACTIVITY, AUDIT_LOG, DAILY_STATS, METRICS_SOURCE, MODERATION, SUSPENSIONS } from '../tokens';
import {
  MemoryActivityRepository,
  MemoryAuditLogRepository,
  MemoryDailyStatsRepository,
  MemoryMetricsSource,
  MemoryModerationRepository,
  MemorySuspensionsRepository,
} from './memory-admin.repositories';
import {
  SupabaseActivityRepository,
  SupabaseAuditLogRepository,
  SupabaseDailyStatsRepository,
  SupabaseMetricsSource,
  SupabaseModerationRepository,
  SupabaseSuspensionsRepository,
} from './supabase-admin.repositories';

/**
 * Fournis par CoreModule (globaux) : la garde de compte sert à la garde d'authentification de toute l'API.
 */
export const adminProviders = (adapters: Adapters): Provider[] => [
  repository<SuspensionsRepository>(SUSPENSIONS, adapters, (db) => new MemorySuspensionsRepository(db), (c) => new SupabaseSuspensionsRepository(c)),
  repository<AuditLogRepository>(AUDIT_LOG, adapters, (db) => new MemoryAuditLogRepository(db), (c) => new SupabaseAuditLogRepository(c)),
  repository<ModerationRepository>(MODERATION, adapters, (db) => new MemoryModerationRepository(db), (c) => new SupabaseModerationRepository(c)),
  repository<ActivityRepository>(ACTIVITY, adapters, (db) => new MemoryActivityRepository(db), (c) => new SupabaseActivityRepository(c)),
  repository<DailyStatsRepository>(DAILY_STATS, adapters, (db) => new MemoryDailyStatsRepository(db), (c) => new SupabaseDailyStatsRepository(c)),
  repository<MetricsSource>(METRICS_SOURCE, adapters, (db: MemoryDb) => new MemoryMetricsSource(db, (iso) => dayOf(new Date(iso))), (c) => new SupabaseMetricsSource(c)),
  AccountGate,
  { provide: ACCOUNT_GATE, useExisting: AccountGate },
];
