import { type Day, dayOf } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import type { InactiveAccount, RetentionRepository } from '../ports';

/** Comme la colonne `profiles.last_active_on` (défaut : jour de création du profil). */
export class MemoryRetentionRepository implements RetentionRepository {
  constructor(private readonly db: MemoryDb) {}

  private accounts(): InactiveAccount[] {
    return [...this.db.profiles.values()].map((p) => {
      const a = this.db.accountActivity.get(p.id);
      return { userId: p.id, lastActiveOn: a?.lastActiveOn ?? dayOf(new Date(p.createdAt)), noticedOn: a?.noticedOn ?? null };
    });
  }

  async touch(userId: string, day: Day): Promise<void> {
    if (!this.db.profiles.has(userId)) return;
    const a = this.db.accountActivity.get(userId);
    if (!a || a.lastActiveOn < day) this.db.accountActivity.set(userId, { lastActiveOn: day, noticedOn: null });
  }

  async lastActiveOn(userId: string): Promise<Day | null> {
    const p = this.db.profiles.get(userId);
    if (!p) return null;
    return this.db.accountActivity.get(userId)?.lastActiveOn ?? dayOf(new Date(p.createdAt));
  }

  async listToNotice(cutoff: Day, limit: number): Promise<InactiveAccount[]> {
    return this.accounts()
      .filter((a) => a.lastActiveOn <= cutoff && a.noticedOn === null)
      .sort((a, b) => a.lastActiveOn.localeCompare(b.lastActiveOn))
      .slice(0, limit);
  }

  async listToDelete(cutoff: Day, noticedBy: Day, limit: number): Promise<InactiveAccount[]> {
    return this.accounts()
      .filter((a) => a.lastActiveOn <= cutoff && a.noticedOn !== null && a.noticedOn <= noticedBy)
      .sort((a, b) => a.lastActiveOn.localeCompare(b.lastActiveOn))
      .slice(0, limit);
  }

  async markNoticed(userIds: readonly string[], day: Day): Promise<void> {
    for (const a of this.accounts()) if (userIds.includes(a.userId)) this.db.accountActivity.set(a.userId, { lastActiveOn: a.lastActiveOn, noticedOn: day });
  }

  async addBans(hashes: readonly string[], at: string, until: string): Promise<void> {
    for (const h of hashes) this.db.bannedIdentities.set(h, { bannedAt: at, until });
  }

  async isBanned(hashes: readonly string[], now: string): Promise<boolean> {
    return hashes.some((h) => {
      const b = this.db.bannedIdentities.get(h);
      return b !== undefined && b.until > now;
    });
  }

  async purgeBans(now: string): Promise<number> {
    let n = 0;
    for (const [h, b] of this.db.bannedIdentities) {
      if (b.until <= now) {
        this.db.bannedIdentities.delete(h);
        n += 1;
      }
    }
    return n;
  }

  async purgeClosedReports(before: string): Promise<number> {
    let n = 0;
    for (const [id, review] of this.db.reportReviews) {
      if (review.handledAt < before && !this.db.purgedReports.has(id)) {
        this.db.purgedReports.add(id);
        n += 1;
      }
    }
    return n;
  }

  async purgeAuditLog(before: string): Promise<number> {
    const kept = this.db.auditLog.filter((e) => e.at >= before);
    const n = this.db.auditLog.length - kept.length;
    this.db.auditLog.splice(0, this.db.auditLog.length, ...kept);
    return n;
  }
}
