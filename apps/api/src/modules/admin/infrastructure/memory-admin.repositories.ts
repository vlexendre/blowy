import { type Day, addDays } from '@blowy/domain';
import type { ModerationActionKind } from '@blowy/contract';
import type { MemoryDb } from '../../../persistence/memory-db';
import type {
  ActivityRepository,
  AdminReportRow,
  AuditFilter,
  AuditLogRepository,
  AuditRecord,
  ContextMessage,
  DailyMetrics,
  DailyStatsRepository,
  DailyStatsRow,
  MetricsSource,
  ModerationRepository,
  ReportFilter,
  SuspensionRecord,
  SuspensionsRepository,
} from '../ports';

const ms = (iso: string): number => Date.parse(iso);

/**
 * Curseur des signalements : `<priorité>|<createdAt>|<id>` de la dernière ligne de la page précédente (file des
 * ouverts, rangée par priorité), ou `<createdAt>|<id>` (traités, tous). Un curseur à deux parties vaut priorité 0.
 */
export const reportCursor = (r: { createdAt: string; id: string; priority?: number }, withPriority = false): string =>
  withPriority ? `${r.priority ?? 0}|${r.createdAt}|${r.id}` : `${r.createdAt}|${r.id}`;
export function parseCursor(cursor: string): { createdAt: string; id: string; priority: number } | null {
  const parts = cursor.split('|');
  const [priority, createdAt, id] = parts.length === 3 ? [Number(parts[0]), parts[1], parts[2]] : [0, parts[0], parts[1]];
  return createdAt && id && Number.isInteger(priority) && !Number.isNaN(Date.parse(createdAt)) && /^\d+$/.test(id) ? { createdAt, id, priority } : null;
}

export class MemorySuspensionsRepository implements SuspensionsRepository {
  constructor(private readonly db: MemoryDb) {}
  async find(userId: string): Promise<SuspensionRecord | null> {
    const s = this.db.suspensions.get(userId);
    return s ? { ...s } : null;
  }
  async put(record: SuspensionRecord): Promise<void> {
    if (this.db.profiles.has(record.userId)) this.db.suspensions.set(record.userId, { ...record });
  }
  async remove(userId: string): Promise<void> {
    this.db.suspensions.delete(userId);
  }
  async listActive(now: string, cursor: string | null, limit: number): Promise<SuspensionRecord[]> {
    return [...this.db.suspensions.values()]
      .filter((s) => s.until === null || ms(s.until) > ms(now))
      .sort((a, b) => ms(b.since) - ms(a.since))
      .filter((s) => cursor === null || ms(s.since) < ms(cursor))
      .slice(0, limit)
      .map((s) => ({ ...s }));
  }
  async activeAmong(userIds: readonly string[], now: string): Promise<Set<string>> {
    return new Set(
      userIds.filter((id) => {
        const s = this.db.suspensions.get(id);
        return s !== undefined && (s.until === null || ms(s.until) > ms(now));
      }),
    );
  }
}

export class MemoryAuditLogRepository implements AuditLogRepository {
  constructor(private readonly db: MemoryDb) {}
  async append(entry: Omit<AuditRecord, 'id'>): Promise<AuditRecord> {
    // Identifiant croissant même après une purge (conservation : un an).
    const last = this.db.auditLog[this.db.auditLog.length - 1];
    const record = { ...entry, id: String((last ? Number(last.id) : 0) + 1) };
    this.db.auditLog.push(record);
    return { ...record };
  }
  async page(filter: AuditFilter, cursor: string | null, limit: number): Promise<AuditRecord[]> {
    const q = filter.q?.toLowerCase();
    return [...this.db.auditLog]
      .reverse()
      .filter((e) => cursor === null || Number(e.id) < Number(cursor))
      .filter((e) => !filter.action || e.action === filter.action)
      .filter((e) => !filter.targetUserId || e.targetUserId === filter.targetUserId)
      .filter((e) => !q || [e.targetName ?? '', e.adminEmail, e.reason].some((s) => s.toLowerCase().includes(q)))
      .slice(0, limit)
      .map((e) => ({ ...e }));
  }
}

export class MemoryModerationRepository implements ModerationRepository {
  constructor(private readonly db: MemoryDb) {}

  private rows(): AdminReportRow[] {
    return this.db.reports.flatMap((r, i): AdminReportRow[] => {
      if (this.db.purgedReports.has(String(i + 1))) return [];
      const id = String(i + 1);
      const review = this.db.reportReviews.get(id);
      return [{
        id,
        reporter: r.reporter,
        targetUser: r.targetUser,
        linkId: r.linkId,
        messageId: r.messageId ?? null,
        reason: r.reason,
        details: r.details,
        createdAt: r.createdAt,
        handledAt: review?.handledAt ?? null,
        handledBy: review?.handledBy ?? null,
        resolution: review?.resolution ?? null,
        priority: r.priority ?? 0,
        source: r.source ?? 'person',
        category: r.category ?? null,
        review: r.review ?? false,
      }];
    });
  }

  async page(filter: ReportFilter, cursor: string | null, limit: number): Promise<AdminReportRow[]> {
    const ascending = filter.status === 'open';
    // File des ouverts : priorité décroissante d'abord (le curseur porte la priorité).
    const cmp = (a: AdminReportRow, b: { createdAt: string; id: string; priority?: number }): number =>
      (ascending ? (b.priority ?? 0) - a.priority : 0) || ms(a.createdAt) - ms(b.createdAt) || Number(a.id) - Number(b.id);
    const after = cursor ? parseCursor(cursor) : null;
    return this.rows()
      .filter((r) => (filter.status === 'open' ? r.handledAt === null : filter.status === 'handled' ? r.handledAt !== null : true))
      .filter((r) => !filter.reason || r.reason === filter.reason)
      .filter((r) => !filter.targetIds || (r.targetUser !== null && filter.targetIds.includes(r.targetUser)))
      .sort((a, b) => (ascending ? cmp(a, b) : cmp(b, a)))
      .filter((r) => after === null || (ascending ? cmp(r, after) > 0 : cmp(r, after) < 0))
      .slice(0, limit);
  }

  async find(id: string): Promise<AdminReportRow | null> {
    return this.rows().find((r) => r.id === id) ?? null;
  }

  async counts(now: string, overdueHours: number): Promise<{ open: number; overdue: number }> {
    const open = this.rows().filter((r) => r.handledAt === null);
    const limit = ms(now) - overdueHours * 3_600_000;
    return { open: open.length, overdue: open.filter((r) => ms(r.createdAt) < limit).length };
  }

  async countsByTarget(userIds: readonly string[]): Promise<Map<string, { open: number; total: number }>> {
    const out = new Map<string, { open: number; total: number }>();
    for (const id of userIds) out.set(id, { open: 0, total: 0 });
    for (const r of this.rows()) {
      const c = r.targetUser ? out.get(r.targetUser) : undefined;
      if (!c) continue;
      c.total += 1;
      if (r.handledAt === null) c.open += 1;
    }
    return out;
  }

  async resolve(input: { reportId: string | null; targetUserId: string; at: string; by: string; resolution: ModerationActionKind }): Promise<void> {
    for (const r of this.rows()) {
      if (r.handledAt !== null) continue;
      const match = input.reportId !== null ? r.id === input.reportId : r.targetUser === input.targetUserId;
      if (match) this.db.reportReviews.set(r.id, { handledAt: input.at, handledBy: input.by, resolution: input.resolution });
    }
  }

  async context(linkId: string, messageId: string, around: number): Promise<ContextMessage[]> {
    const thread = this.db.messages.filter((m) => m.linkId === linkId).sort((a, b) => ms(a.createdAt) - ms(b.createdAt) || a.id.localeCompare(b.id));
    const at = thread.findIndex((m) => m.id === messageId);
    if (at < 0) return [];
    return thread.slice(Math.max(0, at - around), at + around + 1).map((m) => ({ ...m }));
  }

  async searchPeople(q: string, limit: number): Promise<string[]> {
    const needle = q.toLowerCase();
    return [...this.db.profiles.values()]
      .filter((p) => p.displayName.toLowerCase().includes(needle))
      .slice(0, limit)
      .map((p) => p.id);
  }
}

export class MemoryActivityRepository implements ActivityRepository {
  constructor(private readonly db: MemoryDb) {}
  async touch(userId: string, day: Day): Promise<void> {
    if (this.db.profiles.has(userId)) this.db.activityDays.add(`${day}:${userId}`);
  }
  async purgeBefore(day: Day): Promise<number> {
    let n = 0;
    for (const key of [...this.db.activityDays]) {
      if (key.slice(0, 10) < day) {
        this.db.activityDays.delete(key);
        n += 1;
      }
    }
    return n;
  }
  async usersOn(day: Day, afterUserId: string | null, limit: number): Promise<string[]> {
    return [...this.db.activityDays]
      .filter((k) => k.startsWith(`${day}:`))
      .map((k) => k.slice(11))
      .filter((id) => afterUserId === null || id > afterUserId)
      .sort()
      .slice(0, limit);
  }
}

export class MemoryDailyStatsRepository implements DailyStatsRepository {
  constructor(private readonly db: MemoryDb) {}
  async get(day: Day): Promise<DailyStatsRow | null> {
    return this.db.dailyStats.get(day) ?? null;
  }
  async range(from: Day, to: Day): Promise<DailyStatsRow[]> {
    return [...this.db.dailyStats.values()].filter((r) => r.day >= from && r.day <= to).sort((a, b) => a.day.localeCompare(b.day));
  }
  async latest(): Promise<DailyStatsRow | null> {
    const days = [...this.db.dailyStats.keys()].sort();
    const last = days[days.length - 1];
    return last ? (this.db.dailyStats.get(last) ?? null) : null;
  }
  async put(row: DailyStatsRow): Promise<void> {
    this.db.dailyStats.set(row.day, row);
  }
}

/** Mêmes chiffres que la fonction SQL `admin_daily_metrics`, calculés sur la base mémoire. */
export class MemoryMetricsSource implements MetricsSource {
  constructor(
    private readonly db: MemoryDb,
    private readonly dayOf: (iso: string) => Day,
  ) {}

  async compute(day: Day): ReturnType<MetricsSource['compute']> {
    const db = this.db;
    // Monde d'exemple du compte de revue d'Apple : hors statistiques (comme la fonction SQL).
    const rv = new Set([...db.profiles.values()].filter((p) => p.reviewWorld).map((p) => p.id));
    const profiles = [...db.profiles.values()].filter((p) => !rv.has(p.id));
    const createdOn = (iso: string): Day => this.dayOf(iso);
    const activity = [...db.activityDays].filter((k) => !rv.has(k.slice(11)));
    const activeOn = (d: Day): Set<string> => new Set(activity.filter((k) => k.startsWith(`${d}:`)).map((k) => k.slice(11)));
    const activeBetween = (from: Day, to: Day): number => new Set(activity.filter((k) => k.slice(0, 10) >= from && k.slice(0, 10) <= to).map((k) => k.slice(11))).size;
    const cohort = (n: number): { size: number; retained: number } => {
      const members = profiles.filter((p) => createdOn(p.createdAt) === addDays(day, -n));
      const active = activeOn(day);
      return { size: members.length, retained: members.filter((p) => active.has(p.id)).length };
    };
    const [c1, c7, c30] = [cohort(1), cohort(7), cohort(30)];
    const subs = [...db.subscriptions.values()].filter((s) => s.userId !== null && !rv.has(s.userId));
    const reviewLinks = new Set([...db.links.values()].filter((l) => rv.has(l.userA) || rv.has(l.userB)).map((l) => l.id));
    const petMessages = db.messages.filter((m) => m.authorKind === 'pet' && createdOn(m.createdAt) === day && !reviewLinks.has(m.linkId));
    const answered = petMessages.filter((pm) =>
      db.messages.some((r) => r.linkId === pm.linkId && r.authorKind === 'user' && ms(r.createdAt) > ms(pm.createdAt) && ms(r.createdAt) <= ms(pm.createdAt) + 86_400_000),
    );
    const links = [...db.links.values()].filter((l) => !reviewLinks.has(l.id));
    const encounters = [...db.encounters.values()].filter((e) => !rv.has(e.fromUser));
    const effectiveGhost = (l: (typeof links)[number]): boolean => {
      if (l.status === 'ghost') return true;
      if (l.status !== 'active') return false;
      const silent = (d: Day): number => Math.max(0, (Date.parse(d) - Date.parse(l.lastActiveOn)) / 86_400_000 - 1);
      return silent(day) - silent(l.lastTickOn) >= l.lives;
    };
    const reports = db.reports
      .map((r, i) => ({ ...r, handled: db.reportReviews.get(String(i + 1)), purged: db.purgedReports.has(String(i + 1)) }))
      .filter((r) => !r.purged && !r.review);
    const activeLinksOf = new Map<string, number>();
    for (const l of links) {
      if (l.status !== 'active' || effectiveGhost(l)) continue;
      for (const u of [l.userA, l.userB]) activeLinksOf.set(u, (activeLinksOf.get(u) ?? 0) + 1);
    }
    const top = [...activeLinksOf.entries()]
      .flatMap(([userId, activeLinks]) => {
        const owner = db.profiles.get(userId);
        const pet = [...db.pets.values()].find((p) => p.ownerId === userId);
        return owner && pet ? [{ userId, ownerName: owner.displayName, petName: pet.name, species: pet.species, activeLinks }] : [];
      })
      .sort((a, b) => b.activeLinks - a.activeLinks || a.ownerName.localeCompare(b.ownerName))
      .slice(0, 100);
    return {
      accountsTotal: profiles.filter((p) => createdOn(p.createdAt) <= day).length,
      accountsNew: profiles.filter((p) => createdOn(p.createdAt) === day).length,
      dau: activeOn(day).size,
      wau: activeBetween(addDays(day, -6), day),
      mau: activeBetween(addDays(day, -29), day),
      d1Cohort: c1.size,
      d1Retained: c1.retained,
      d7Cohort: c7.size,
      d7Retained: c7.retained,
      d30Cohort: c30.size,
      d30Retained: c30.retained,
      subscribers: subs.filter((s) => s.status === 'active' || s.status === 'grace').length,
      trials: subs.filter((s) => s.status === 'trial').length,
      newTrials: [...db.subscriptions.values()].filter((s) => s.trialUsed && createdOn(s.startedAt) === day && (s.userId === null || !rv.has(s.userId))).length,
      petMessages: petMessages.length,
      petMessagesAnswered: answered.length,
      encountersWaved: encounters.filter((e) => createdOn(e.createdAt) === day).length,
      encountersAccepted: encounters.filter((e) => e.status === 'accepted' && createdOn(e.statusAt) === day).length,
      linksActive: links.filter((l) => l.status === 'active' && !effectiveGhost(l)).length,
      linksGhost: links.filter(effectiveGhost).length,
      linksArchived: links.filter((l) => l.status === 'archived').length,
      linksWroteTogether: links.filter((l) => l.status === 'active' && l.recentDays.some((d) => d.day === day && d.a && d.b)).length,
      reportsOpened: reports.filter((r) => createdOn(r.createdAt) === day).length,
      reportsHandled: reports.filter((r) => r.handled && createdOn(r.handled.handledAt) === day).length,
      reportsOpen: reports.filter((r) => !r.handled).length,
      top,
    } satisfies Omit<DailyMetrics, 'averageStreak' | 'encountersProposed' | 'averageCompatibility' | 'shapes' | 'visions' | 'topDetails'>;
  }
}
