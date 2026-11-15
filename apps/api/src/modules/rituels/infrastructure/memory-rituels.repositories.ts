import type { Day } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import {
  type DailyChallengePatch,
  type DailyChallengeRecord,
  type DailyChallengesRepository,
  EMPTY_RITUAL_STATE,
  type HabitCheckRecord,
  type HabitChecksRepository,
  type HabitRecord,
  type HabitsRepository,
  type RitualPhotoRecord,
  type RitualPhotosRepository,
  type RitualMarker,
  type RitualStatePatch,
  type RitualStateRecord,
  type RitualStatesRepository,
  type WeeklyReviewRecord,
  type WeeklyReviewsRepository,
} from '../ports';

const clone = <T>(v: T): T => structuredClone(v);
const requireProfile = (db: MemoryDb, userId: string): void => {
  if (!db.profiles.has(userId)) throw new Error('profil introuvable');
};

export class MemoryRitualStatesRepository implements RitualStatesRepository {
  constructor(private readonly db: MemoryDb) {}

  async find(userId: string): Promise<RitualStateRecord | null> {
    const s = this.db.ritualStates.get(userId);
    return s ? clone(s) : null;
  }

  async findMany(userIds: readonly string[]): Promise<RitualStateRecord[]> {
    return userIds.flatMap((id) => {
      const s = this.db.ritualStates.get(id);
      return s ? [clone(s)] : [];
    });
  }

  async upsert(userId: string, patch: RitualStatePatch): Promise<void> {
    requireProfile(this.db, userId);
    const current = this.db.ritualStates.get(userId) ?? EMPTY_RITUAL_STATE(userId);
    this.db.ritualStates.set(userId, clone({ ...current, ...patch, userId }));
  }

  async mark(userIds: readonly string[], marker: RitualMarker, value: Day): Promise<void> {
    for (const id of userIds) {
      const s = this.db.ritualStates.get(id);
      if (s) s[marker] = value;
    }
  }

  async addHabitsKept(userId: string, n: number): Promise<number> {
    requireProfile(this.db, userId);
    const current = this.db.ritualStates.get(userId) ?? EMPTY_RITUAL_STATE(userId);
    const next = { ...current, habitsKept: current.habitsKept + n };
    this.db.ritualStates.set(userId, next);
    return next.habitsKept;
  }

  async listActive(sinceDay: Day, afterUserId: string | null, limit: number, pending?: { marker: RitualMarker; before: Day }): Promise<RitualStateRecord[]> {
    return [...this.db.ritualStates.values()]
      .filter((s) => s.lastSeenOn !== null && s.lastSeenOn >= sinceDay && (afterUserId === null || s.userId > afterUserId))
      .filter((s) => {
        if (!pending) return true;
        const v = s[pending.marker];
        return v === null || v < pending.before;
      })
      .sort((a, b) => a.userId.localeCompare(b.userId))
      .slice(0, limit)
      .map(clone);
  }
}

export class MemoryDailyChallengesRepository implements DailyChallengesRepository {
  constructor(private readonly db: MemoryDb) {}

  private row(userId: string, day: Day): DailyChallengeRecord | undefined {
    return this.db.dailyChallenges.find((c) => c.userId === userId && c.day === day);
  }

  async find(userId: string, day: Day): Promise<DailyChallengeRecord | null> {
    const r = this.row(userId, day);
    return r ? clone(r) : null;
  }

  async insertIfAbsent(record: DailyChallengeRecord): Promise<DailyChallengeRecord> {
    requireProfile(this.db, record.userId);
    const existing = this.row(record.userId, record.day);
    if (existing) return clone(existing);
    this.db.dailyChallenges.push(clone(record));
    return clone(record);
  }

  async update(userId: string, day: Day, patch: DailyChallengePatch): Promise<void> {
    const r = this.row(userId, day);
    if (r) Object.assign(r, patch);
  }

  async markDone(userId: string, day: Day, patch: DailyChallengePatch, doneAt: string): Promise<boolean> {
    const r = this.row(userId, day);
    if (!r || r.status === 'done') return false;
    Object.assign(r, patch, { status: 'done', doneAt });
    return true;
  }

  async findForDay(userIds: readonly string[], day: Day): Promise<DailyChallengeRecord[]> {
    const wanted = new Set(userIds);
    return this.db.dailyChallenges.filter((c) => c.day === day && wanted.has(c.userId)).map(clone);
  }

  async listBetween(userId: string, from: Day, to: Day): Promise<DailyChallengeRecord[]> {
    return this.db.dailyChallenges
      .filter((c) => c.userId === userId && c.day >= from && c.day <= to)
      .sort((a, b) => a.day.localeCompare(b.day))
      .map(clone);
  }
}

export class MemoryHabitsRepository implements HabitsRepository {
  constructor(private readonly db: MemoryDb) {}

  async listActive(userId: string): Promise<HabitRecord[]> {
    return [...this.db.habits.values()]
      .filter((h) => h.userId === userId && h.archivedAt === null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
      .map(clone);
  }

  async find(id: string): Promise<HabitRecord | null> {
    const h = this.db.habits.get(id);
    return h ? clone(h) : null;
  }

  async create(habit: HabitRecord): Promise<boolean> {
    requireProfile(this.db, habit.userId);
    const taken = [...this.db.habits.values()].some((h) => h.userId === habit.userId && h.habitId === habit.habitId && h.archivedAt === null);
    if (taken) return false;
    this.db.habits.set(habit.id, clone(habit));
    return true;
  }

  async update(id: string, patch: Partial<Pick<HabitRecord, 'rhythm' | 'proofHour' | 'archivedAt' | 'askedOn'>>): Promise<void> {
    const h = this.db.habits.get(id);
    if (h) Object.assign(h, patch);
  }

  async markAsked(ids: readonly string[], day: Day): Promise<void> {
    for (const id of ids) {
      const h = this.db.habits.get(id);
      if (h) h.askedOn = day;
    }
  }

  async listToAsk(hour: number, today: Day, afterId: string | null, limit: number): Promise<HabitRecord[]> {
    return [...this.db.habits.values()]
      .filter((h) => h.archivedAt === null && h.proofHour <= hour && (h.askedOn === null || h.askedOn < today) && (afterId === null || h.id > afterId))
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, limit)
      .map(clone);
  }
}

export class MemoryHabitChecksRepository implements HabitChecksRepository {
  constructor(private readonly db: MemoryDb) {}

  async find(habitRef: string, day: Day): Promise<HabitCheckRecord | null> {
    const c = this.db.habitChecks.find((x) => x.habitRef === habitRef && x.day === day);
    return c ? clone(c) : null;
  }

  async upsert(check: HabitCheckRecord): Promise<void> {
    if (!this.db.habits.has(check.habitRef)) throw new Error('habitude introuvable');
    const i = this.db.habitChecks.findIndex((x) => x.habitRef === check.habitRef && x.day === check.day);
    if (i >= 0) this.db.habitChecks[i] = clone(check);
    else this.db.habitChecks.push(clone(check));
  }

  async listSince(habitRefs: readonly string[], from: Day): Promise<HabitCheckRecord[]> {
    const wanted = new Set(habitRefs);
    return this.db.habitChecks.filter((c) => wanted.has(c.habitRef) && c.day >= from).map(clone);
  }

  async countKept(userId: string, from: Day, to: Day): Promise<number> {
    return this.db.habitChecks.filter((c) => c.userId === userId && c.day >= from && c.day <= to && c.verdict !== 'no').length;
  }
}

export class MemoryRitualPhotosRepository implements RitualPhotosRepository {
  constructor(private readonly db: MemoryDb) {}

  async create(photo: RitualPhotoRecord): Promise<void> {
    requireProfile(this.db, photo.userId);
    this.db.ritualPhotos.set(photo.id, clone(photo));
  }

  async find(id: string): Promise<RitualPhotoRecord | null> {
    const p = this.db.ritualPhotos.get(id);
    return p ? clone(p) : null;
  }

  async setKeep(id: string, keep: boolean): Promise<void> {
    const p = this.db.ritualPhotos.get(id);
    if (p) p.keep = keep;
  }

  async listExpired(beforeIso: string, limit: number): Promise<RitualPhotoRecord[]> {
    return [...this.db.ritualPhotos.values()]
      .filter((p) => !p.keep && p.deletedAt === null && p.createdAt < beforeIso)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit)
      .map(clone);
  }

  async markDeleted(ids: readonly string[], at: string): Promise<void> {
    for (const id of ids) {
      const p = this.db.ritualPhotos.get(id);
      if (p) p.deletedAt = at;
    }
  }

  async listKept(userId: string, before: string | null, limit: number): Promise<RitualPhotoRecord[]> {
    return [...this.db.ritualPhotos.values()]
      .filter((p) => p.userId === userId && p.keep && p.deletedAt === null && (before === null || p.createdAt < before))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(clone);
  }
}

export class MemoryWeeklyReviewsRepository implements WeeklyReviewsRepository {
  constructor(private readonly db: MemoryDb) {}

  async insertIfAbsent(review: WeeklyReviewRecord): Promise<boolean> {
    requireProfile(this.db, review.userId);
    if ([...this.db.weeklyReviews.values()].some((r) => r.userId === review.userId && r.weekStart === review.weekStart)) return false;
    this.db.weeklyReviews.set(review.id, clone(review));
    return true;
  }

  async find(id: string): Promise<WeeklyReviewRecord | null> {
    const r = this.db.weeklyReviews.get(id);
    return r ? clone(r) : null;
  }

  async list(userId: string, before: Day | null, limit: number): Promise<WeeklyReviewRecord[]> {
    return [...this.db.weeklyReviews.values()]
      .filter((r) => r.userId === userId && (before === null || r.weekStart < before))
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      .slice(0, limit)
      .map(clone);
  }

  async latestUnread(userId: string): Promise<WeeklyReviewRecord | null> {
    const [latest] = await this.list(userId, null, 1);
    return latest && latest.readAt === null ? latest : null;
  }

  async markRead(id: string, at: string): Promise<void> {
    const r = this.db.weeklyReviews.get(id);
    if (r && r.readAt === null) r.readAt = at;
  }
}
