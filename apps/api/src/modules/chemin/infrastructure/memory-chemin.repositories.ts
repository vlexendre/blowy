import type { CheminStatus, Day } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import { buildSeedContent } from '../seed/build';
import type {
  CheminAnswerRecord,
  CheminAnswersRepository,
  CheminContent,
  CheminContentRepository,
  CheminProgressPatch,
  CheminProgressRecord,
  CheminProgressRepository,
  CheminSessionRecord,
  CheminSessionsRepository,
  ContentQuestion,
  ContentUnit,
} from '../ports';

const clone = <T>(v: T): T => structuredClone(v);
/** Date des données de départ en mémoire (stable : les tests ne dépendent pas de l'horloge). */
const SEEDED_AT = '2026-11-21T00:00:00.000Z';

/** Contenu en mémoire : le contenu de départ (`seed/`), semé au premier accès, modifiable par l'administration. */
export class MemoryCheminContentRepository implements CheminContentRepository {
  constructor(private readonly db: MemoryDb) {}

  private content(): CheminContent {
    this.db.cheminContent ??= buildSeedContent(SEEDED_AT);
    return this.db.cheminContent;
  }

  async load(): Promise<CheminContent> {
    return clone(this.content());
  }

  async upsertQuestion(q: ContentQuestion): Promise<void> {
    const c = this.content();
    const i = c.questions.findIndex((x) => x.id === q.id);
    if (i >= 0) c.questions[i] = clone(q);
    else c.questions.push(clone(q));
  }

  async setQuestionStatus(id: string, status: CheminStatus, at: string): Promise<boolean> {
    const q = this.content().questions.find((x) => x.id === id);
    if (!q) return false;
    q.status = status;
    q.updatedAt = at;
    return true;
  }

  async upsertUnit(u: ContentUnit): Promise<void> {
    const c = this.content();
    const existing = c.units.find((x) => x.id === u.id);
    if (!existing) {
      c.units.push(clone(u));
      return;
    }
    const steps = [...existing.steps];
    for (const s of u.steps) {
      const i = steps.findIndex((x) => x.id === s.id);
      if (i >= 0) steps[i] = clone(s);
      else steps.push(clone(s));
    }
    Object.assign(existing, clone({ ...u, steps }));
  }

  async setUnitStatus(id: string, status: CheminStatus, at: string): Promise<boolean> {
    const u = this.content().units.find((x) => x.id === id);
    if (!u) return false;
    u.status = status;
    u.updatedAt = at;
    for (const s of u.steps) s.status = status;
    return true;
  }
}

const emptyProgress = (userId: string, at: string): CheminProgressRecord => ({
  userId,
  completedSteps: [],
  sessionsDone: 0,
  answersCount: 0,
  bonusOn: null,
  bonusReason: null,
  referralsSeen: 0,
  lastBuild: null,
  lastPlatform: null,
  lastSessionOn: null,
  createdAt: at,
  updatedAt: at,
});

export class MemoryCheminProgressRepository implements CheminProgressRepository {
  constructor(private readonly db: MemoryDb) {}

  async find(userId: string): Promise<CheminProgressRecord | null> {
    const p = this.db.cheminProgress.get(userId);
    return p ? clone(p) : null;
  }

  async findMany(userIds: readonly string[]): Promise<CheminProgressRecord[]> {
    return userIds.flatMap((id) => {
      const p = this.db.cheminProgress.get(id);
      return p ? [clone(p)] : [];
    });
  }

  async upsert(userId: string, patch: CheminProgressPatch, at: string): Promise<CheminProgressRecord> {
    const next = { ...(this.db.cheminProgress.get(userId) ?? emptyProgress(userId, at)), ...clone(patch), updatedAt: at };
    this.db.cheminProgress.set(userId, next);
    return clone(next);
  }
}

export class MemoryCheminSessionsRepository implements CheminSessionsRepository {
  constructor(private readonly db: MemoryDb) {}

  async find(id: string): Promise<CheminSessionRecord | null> {
    const s = this.db.cheminSessions.get(id);
    return s ? clone(s) : null;
  }

  async listForDay(userId: string, day: Day): Promise<CheminSessionRecord[]> {
    return [...this.db.cheminSessions.values()].filter((s) => s.userId === userId && s.day === day).map(clone);
  }

  async insertIfAbsent(s: CheminSessionRecord): Promise<CheminSessionRecord> {
    const existing = [...this.db.cheminSessions.values()].find((x) => x.userId === s.userId && x.day === s.day && x.slot === s.slot);
    if (existing) return clone(existing);
    this.db.cheminSessions.set(s.id, clone(s));
    return clone(s);
  }

  async markDone(id: string, at: string): Promise<boolean> {
    const s = this.db.cheminSessions.get(id);
    if (!s || s.status === 'done') return false;
    s.status = 'done';
    s.completedAt = at;
    return true;
  }

  async saveResult(id: string, result: unknown): Promise<void> {
    const s = this.db.cheminSessions.get(id);
    if (s) s.result = clone(result);
  }

  async doneDays(userId: string, from: Day, to: Day): Promise<Day[]> {
    return [...this.db.cheminSessions.values()].filter((s) => s.userId === userId && s.status === 'done' && s.day >= from && s.day <= to).map((s) => s.day);
  }

  async statsForDay(day: Day): Promise<{ sessions: number; people: number; bonus: number }> {
    const done = [...this.db.cheminSessions.values()].filter((s) => s.day === day && s.status === 'done');
    return { sessions: done.length, people: new Set(done.map((s) => s.userId)).size, bonus: done.filter((s) => s.slot === 1).length };
  }
}

export class MemoryCheminAnswersRepository implements CheminAnswersRepository {
  constructor(private readonly db: MemoryDb) {}

  async insertMany(rows: readonly CheminAnswerRecord[]): Promise<void> {
    for (const r of rows) {
      if (this.db.cheminAnswers.some((a) => a.userId === r.userId && a.questionId === r.questionId && a.sessionId === r.sessionId)) continue;
      this.db.cheminAnswers.push(clone(r));
    }
  }

  async lastAnswered(userId: string): Promise<Map<string, Day>> {
    const out = new Map<string, Day>();
    for (const a of this.db.cheminAnswers) if (a.userId === userId && (out.get(a.questionId) ?? '') < a.day) out.set(a.questionId, a.day);
    return out;
  }

  async latestFor(userIds: readonly string[], questionIds: readonly string[]): Promise<CheminAnswerRecord[]> {
    const users = new Set(userIds);
    const qs = new Set(questionIds);
    const latest = new Map<string, CheminAnswerRecord>();
    for (const a of this.db.cheminAnswers) {
      if (!users.has(a.userId) || !qs.has(a.questionId)) continue;
      const key = `${a.userId}|${a.questionId}`;
      const cur = latest.get(key);
      if (!cur || cur.answeredAt < a.answeredAt) latest.set(key, a);
    }
    return [...latest.values()].map(clone);
  }

  async count(userId: string): Promise<number> {
    return this.db.cheminAnswers.filter((a) => a.userId === userId).length;
  }
}
