import type { CounterRow, Day, EventRow, GrowthCounterMetric, MemberSpan } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import type {
  AcquisitionRecord,
  AcquisitionsRepository,
  CreatorRecord,
  CreatorsRepository,
  GrowthCountersRepository,
  GrowthEventRecord,
  GrowthEventsRepository,
  GrowthReads,
} from '../ports';

export class MemoryCreatorsRepository implements CreatorsRepository {
  constructor(private readonly db: MemoryDb) {}
  async find(code: string): Promise<CreatorRecord | null> {
    const c = this.db.creators.get(code);
    return c ? { ...c } : null;
  }
  async list(): Promise<CreatorRecord[]> {
    return [...this.db.creators.values()].sort((a, b) => a.code.localeCompare(b.code)).map((c) => ({ ...c }));
  }
  async create(c: CreatorRecord): Promise<boolean> {
    if (this.db.creators.has(c.code)) return false;
    this.db.creators.set(c.code, { ...c });
    return true;
  }
  async update(code: string, patch: Partial<Pick<CreatorRecord, 'name' | 'active' | 'updatedAt'>>): Promise<CreatorRecord | null> {
    const c = this.db.creators.get(code);
    if (!c) return null;
    const next = { ...c, ...patch };
    this.db.creators.set(code, next);
    return { ...next };
  }
}

export class MemoryAcquisitionsRepository implements AcquisitionsRepository {
  constructor(private readonly db: MemoryDb) {}
  async find(userId: string): Promise<AcquisitionRecord | null> {
    const a = this.db.acquisitions.get(userId);
    return a ? { ...a } : null;
  }
  async create(a: AcquisitionRecord): Promise<boolean> {
    if (this.db.acquisitions.has(a.userId) || !this.db.profiles.has(a.userId)) return false;
    this.db.acquisitions.set(a.userId, { ...a });
    return true;
  }
  async countReferredBy(userId: string): Promise<number> {
    return [...this.db.acquisitions.values()].filter((a) => a.referredBy === userId).length;
  }
  async countByCreator(since: Day): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    for (const a of this.db.acquisitions.values()) if (a.source === 'creator' && a.ref && a.cohortOn >= since) out.set(a.ref, (out.get(a.ref) ?? 0) + 1);
    return out;
  }
}

export class MemoryGrowthEventsRepository implements GrowthEventsRepository {
  constructor(private readonly db: MemoryDb) {}
  async record(e: GrowthEventRecord): Promise<boolean> {
    if (e.userId !== null && this.db.growthEvents.some((x) => x.userId === e.userId && x.kind === e.kind)) return false;
    this.db.growthEvents.push({ ...e });
    return true;
  }
  async listSince(from: Day): Promise<EventRow[]> {
    return this.db.growthEvents.filter((e) => e.cohortOn >= from).map(({ kind, source, cohortOn }) => ({ kind, source, cohortOn }));
  }
}

export class MemoryGrowthCountersRepository implements GrowthCountersRepository {
  constructor(private readonly db: MemoryDb) {}
  async bump(day: Day, metric: GrowthCounterMetric, source: string, ref: string): Promise<void> {
    const key = [day, metric, source, ref].join('|');
    this.db.growthCounters.set(key, (this.db.growthCounters.get(key) ?? 0) + 1);
  }
  async listSince(from: Day): Promise<CounterRow[]> {
    return [...this.db.growthCounters].flatMap(([key, count]) => {
      const [day = '', metric = '', source = '', ref = ''] = key.split('|');
      return day >= from ? [{ day, metric, source, ref, count }] : [];
    });
  }
}

export class MemoryGrowthReads implements GrowthReads {
  constructor(private readonly db: MemoryDb) {}
  async groupsCreatedSince(sinceIso: string): Promise<{ createdAt: string; members: MemberSpan[] }[]> {
    const members = [...this.db.groupMembers.values()];
    return [...this.db.groups.values()]
      .filter((g) => g.createdAt >= sinceIso)
      .map((g) => ({
        createdAt: g.createdAt,
        members: members.filter((m) => m.groupId === g.id).map(({ joinedAt, leftAt, status }) => ({ joinedAt, leftAt, status })),
      }));
  }
}
