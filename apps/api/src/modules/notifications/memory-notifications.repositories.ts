import type { Day } from '@blowy/domain';
import type { MemoryDb } from '../../persistence/memory-db';
import type {
  DevicesRepository,
  LiveActivityKindKey,
  LiveActivityTokenRecord,
  LiveActivityTokensRepository,
  LiveActivityUse,
  NotificationLogRecord,
  NotificationLogRepository,
  NotificationSettingsRecord,
  NotificationSettingsRepository,
  PushDeviceRecord,
  PushReceiptsRepository,
} from './ports';

export class MemoryDevicesRepository implements DevicesRepository {
  constructor(private readonly db: MemoryDb) {}

  async upsert(device: PushDeviceRecord): Promise<void> {
    const existing = this.db.pushDevices.get(device.token);
    this.db.pushDevices.set(device.token, { ...device, createdAt: existing?.createdAt ?? device.createdAt, disabledAt: null });
  }

  async forUser(userId: string): Promise<PushDeviceRecord[]> {
    return [...this.db.pushDevices.values()].filter((d) => d.userId === userId && d.disabledAt === null).map((d) => ({ ...d }));
  }

  async remove(token: string, userId: string): Promise<void> {
    if (this.db.pushDevices.get(token)?.userId === userId) this.db.pushDevices.delete(token);
  }

  async disable(tokens: readonly string[], at: string): Promise<void> {
    for (const t of tokens) {
      const d = this.db.pushDevices.get(t);
      if (d) this.db.pushDevices.set(t, { ...d, disabledAt: at });
    }
  }
}

export class MemoryNotificationSettingsRepository implements NotificationSettingsRepository {
  constructor(private readonly db: MemoryDb) {}

  async get(userId: string): Promise<NotificationSettingsRecord | null> {
    const s = this.db.notificationSettings.get(userId);
    return s ? { ...s, disabledKinds: [...s.disabledKinds] } : null;
  }

  async save(settings: NotificationSettingsRecord): Promise<void> {
    this.db.notificationSettings.set(settings.userId, { ...settings, disabledKinds: [...settings.disabledKinds] });
  }

  async dueMorning(at: string, limit: number): Promise<NotificationSettingsRecord[]> {
    return [...this.db.notificationSettings.values()]
      .filter((s) => s.nextMorningAt !== null && s.nextMorningAt <= at)
      .sort((a, b) => (a.nextMorningAt ?? '').localeCompare(b.nextMorningAt ?? ''))
      .slice(0, limit)
      .map((s) => ({ ...s, disabledKinds: [...s.disabledKinds] }));
  }
}

export class MemoryNotificationLogRepository implements NotificationLogRepository {
  constructor(private readonly db: MemoryDb) {}

  async add(entry: Omit<NotificationLogRecord, 'id'>): Promise<void> {
    this.db.notificationLog.push({ ...entry, id: this.db.nextId() });
  }

  async forUserDay(userId: string, localDay: Day): Promise<NotificationLogRecord[]> {
    return this.db.notificationLog.filter((l) => l.userId === userId && l.localDay === localDay).map((l) => ({ ...l }));
  }

  async dueDeferred(at: string, limit: number): Promise<NotificationLogRecord[]> {
    return this.db.notificationLog
      .filter((l) => l.status === 'deferred' && l.sendAfter !== null && l.sendAfter <= at)
      .sort((a, b) => (a.sendAfter ?? '').localeCompare(b.sendAfter ?? ''))
      .slice(0, limit)
      .map((l) => ({ ...l }));
  }

  async close(id: string, status: 'sent' | 'dropped'): Promise<boolean> {
    const row = this.db.notificationLog.find((l) => l.id === id);
    if (!row || row.status !== 'deferred') return false;
    row.status = status;
    row.vars = null;
    return true;
  }

  async purge(before: string): Promise<number> {
    const n = this.db.notificationLog.length;
    for (let i = this.db.notificationLog.length - 1; i >= 0; i--) {
      const l = this.db.notificationLog[i];
      if (l && l.createdAt < before && l.status !== 'deferred') this.db.notificationLog.splice(i, 1);
    }
    return n - this.db.notificationLog.length;
  }
}

export class MemoryPushReceiptsRepository implements PushReceiptsRepository {
  constructor(private readonly db: MemoryDb) {}

  async add(tickets: readonly { ticketId: string; token: string; createdAt: string }[]): Promise<void> {
    for (const t of tickets) this.db.pushReceipts.set(t.ticketId, { token: t.token, createdAt: t.createdAt });
  }

  async due(before: string, limit: number): Promise<{ ticketId: string; token: string }[]> {
    return [...this.db.pushReceipts.entries()]
      .filter(([, r]) => r.createdAt <= before)
      .slice(0, limit)
      .map(([ticketId, r]) => ({ ticketId, token: r.token }));
  }

  async remove(ticketIds: readonly string[]): Promise<void> {
    for (const id of ticketIds) this.db.pushReceipts.delete(id);
  }

  async purge(before: string): Promise<number> {
    let n = 0;
    for (const [id, r] of this.db.pushReceipts) {
      if (r.createdAt < before) {
        this.db.pushReceipts.delete(id);
        n += 1;
      }
    }
    return n;
  }
}

export class MemoryLiveActivityTokensRepository implements LiveActivityTokensRepository {
  constructor(private readonly db: MemoryDb) {}

  async upsert(r: LiveActivityTokenRecord): Promise<void> {
    if (r.use === 'update') {
      for (const [token, t] of this.db.liveActivityTokens) {
        if (token !== r.token && t.record.userId === r.userId && t.record.use === 'update' && t.record.activity === r.activity && t.record.activityId === r.activityId) this.db.liveActivityTokens.delete(token);
      }
    }
    const existing = this.db.liveActivityTokens.get(r.token);
    this.db.liveActivityTokens.set(r.token, { record: { ...r, createdAt: existing?.record.createdAt ?? r.createdAt }, disabledAt: null });
  }

  async forUser(userId: string, filter: { use: LiveActivityUse; activity?: LiveActivityKindKey; linkId?: string | null }): Promise<LiveActivityTokenRecord[]> {
    return [...this.db.liveActivityTokens.values()]
      .filter((t) => t.disabledAt === null && t.record.userId === userId && t.record.use === filter.use)
      .filter((t) => filter.activity === undefined || t.record.activity === filter.activity)
      .filter((t) => filter.linkId === undefined || t.record.linkId === filter.linkId)
      .map((t) => ({ ...t.record }));
  }

  async remove(tokens: readonly string[]): Promise<void> {
    for (const t of tokens) this.db.liveActivityTokens.delete(t);
  }

  async removeForUser(token: string, userId: string): Promise<void> {
    if (this.db.liveActivityTokens.get(token)?.record.userId === userId) this.db.liveActivityTokens.delete(token);
  }

  async disable(tokens: readonly string[], at: string): Promise<void> {
    for (const t of tokens) {
      const row = this.db.liveActivityTokens.get(t);
      if (row) row.disabledAt = at;
    }
  }

  async listEnded(at: string, limit: number): Promise<LiveActivityTokenRecord[]> {
    return [...this.db.liveActivityTokens.values()]
      .filter((t) => t.disabledAt === null && t.record.use === 'update' && t.record.endsAt !== null && t.record.endsAt <= at)
      .sort((a, b) => (a.record.endsAt ?? '').localeCompare(b.record.endsAt ?? ''))
      .slice(0, limit)
      .map((t) => ({ ...t.record }));
  }

  async purgeDisabled(before: string): Promise<number> {
    let n = 0;
    for (const [token, t] of this.db.liveActivityTokens) {
      if (t.disabledAt !== null && t.disabledAt < before) {
        this.db.liveActivityTokens.delete(token);
        n += 1;
      }
    }
    return n;
  }
}
