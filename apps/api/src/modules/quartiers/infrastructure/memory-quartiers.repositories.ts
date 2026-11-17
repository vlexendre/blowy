import type { ZoneInvite } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import type {
  FounderRecord,
  QuartiersRepository,
  QuizRecord,
  QuizResultsRepository,
  SignupRecord,
  ZoneCounts,
  ZoneRecord,
} from '../ports';

export class MemoryQuizResultsRepository implements QuizResultsRepository {
  constructor(private readonly db: MemoryDb) {}
  async create(r: QuizRecord): Promise<boolean> {
    if (this.db.quizResults.has(r.code)) return false;
    this.db.quizResults.set(r.code, { ...r, gauges: { ...r.gauges } });
    return true;
  }
  async find(code: string): Promise<QuizRecord | null> {
    const r = this.db.quizResults.get(code);
    return r ? { ...r, gauges: { ...r.gauges } } : null;
  }
  async purgeBefore(iso: string): Promise<number> {
    let n = 0;
    for (const [code, r] of this.db.quizResults) if (r.createdAt < iso) (this.db.quizResults.delete(code), n++);
    return n;
  }
}

const live = (s: SignupRecord) => s.unsubscribedAt === null;

export class MemoryQuartiersRepository implements QuartiersRepository {
  constructor(private readonly db: MemoryDb) {}
  async threshold(): Promise<number> {
    return this.db.quartierSettings.threshold;
  }
  async setThreshold(threshold: number, at: string): Promise<void> {
    this.db.quartierSettings.threshold = threshold;
    this.db.quartierSettings.updatedAt = at;
  }
  async findZone(zone: string): Promise<ZoneRecord | null> {
    const z = this.db.quartiers.get(zone);
    return z ? { ...z } : null;
  }
  async ensureZone(zone: string, at: string): Promise<ZoneRecord> {
    let z = this.db.quartiers.get(zone);
    if (!z) {
      z = { zone, openedAt: null, openedBy: null, createdAt: at };
      this.db.quartiers.set(zone, z);
    }
    return { ...z };
  }
  async listZones(): Promise<ZoneRecord[]> {
    return [...this.db.quartiers.values()].map((z) => ({ ...z }));
  }
  async open(zone: string, at: string, by: 'threshold' | 'admin'): Promise<boolean> {
    const z = this.db.quartiers.get(zone);
    if (!z || z.openedAt) return false;
    z.openedAt = at;
    z.openedBy = by;
    return true;
  }
  async counts(zones: readonly string[]): Promise<Map<string, ZoneCounts>> {
    const out = new Map<string, ZoneCounts>(zones.map((z) => [z, { confirmed: 0, pending: 0, notified: 0, founders: 0 }]));
    for (const s of this.db.quartierSignups.values()) {
      const c = out.get(s.zone);
      if (!c) continue;
      if (live(s)) c.pending += 1;
      if (live(s) && s.confirmedAt) c.confirmed += 1;
      if (s.openMailSentAt) c.notified += 1;
    }
    for (const f of this.db.quartierFounders) {
      const c = out.get(f.zone);
      if (c) c.founders += 1;
    }
    return out;
  }
  async findSignup(by: { email?: string; token?: string; code?: string; id?: string }): Promise<SignupRecord | null> {
    for (const s of this.db.quartierSignups.values()) {
      if ((by.id && s.id === by.id) || (by.email && s.email === by.email) || (by.token && s.token === by.token) || (by.code && s.code === by.code)) return { ...s };
    }
    return null;
  }
  async createSignup(s: SignupRecord): Promise<boolean> {
    for (const x of this.db.quartierSignups.values()) if ((s.email && x.email === s.email) || x.code === s.code || (s.token && x.token === s.token)) return false;
    this.db.quartierSignups.set(s.id, { ...s });
    return true;
  }
  async updateSignup(id: string, patch: Partial<Omit<SignupRecord, 'id' | 'code'>>): Promise<SignupRecord | null> {
    const s = this.db.quartierSignups.get(id);
    if (!s) return null;
    Object.assign(s, patch);
    return { ...s };
  }
  async invitesOf(zone: string): Promise<ZoneInvite[]> {
    return [...this.db.quartierSignups.values()]
      .filter((s) => s.zone === zone && live(s) && s.confirmedAt && (s.invitedByUser || s.invitedBySignup))
      .map((s) => ({ inviter: s.invitedByUser ? `u:${s.invitedByUser}` : `s:${s.invitedBySignup}`, confirmedAt: s.confirmedAt as string }));
  }
  async setFounders(zone: string, founders: readonly FounderRecord[]): Promise<void> {
    if (this.db.quartierFounders.some((f) => f.zone === zone)) return;
    this.db.quartierFounders.push(...founders.map((f) => ({ ...f })));
  }
  async founders(zone: string): Promise<FounderRecord[]> {
    return this.db.quartierFounders.filter((f) => f.zone === zone).map((f) => ({ ...f }));
  }
  async foundedBy(userId: string): Promise<number> {
    const mine = new Set([...this.db.quartierSignups.values()].filter((s) => s.userId === userId).map((s) => s.id));
    return new Set(this.db.quartierFounders.filter((f) => f.userId === userId || (f.signupId && mine.has(f.signupId))).map((f) => f.zone)).size;
  }
  async toNotify(limit: number): Promise<SignupRecord[]> {
    return [...this.db.quartierSignups.values()]
      .filter((s) => live(s) && s.confirmedAt && s.email && !s.openMailSentAt && this.db.quartiers.get(s.zone)?.openedAt)
      .slice(0, limit)
      .map((s) => ({ ...s }));
  }
  async purge(unconfirmedBefore: string, notifiedBefore: string): Promise<number> {
    let n = 0;
    for (const [id, s] of this.db.quartierSignups) {
      if (!s.confirmedAt && s.createdAt < unconfirmedBefore) {
        this.db.quartierSignups.delete(id);
        for (const x of this.db.quartierSignups.values()) if (x.invitedBySignup === id) x.invitedBySignup = null;
        n++;
      } else if (s.email && s.openMailSentAt && s.openMailSentAt < notifiedBefore) {
        s.email = null;
        s.token = null;
        n++;
      }
    }
    return n;
  }
}
