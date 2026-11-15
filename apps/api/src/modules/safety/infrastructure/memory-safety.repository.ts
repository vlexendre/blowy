import type { MemoryDb } from '../../../persistence/memory-db';
import type { BlockRecord, BlocksRepository, ReportAlertRow, ReportRecord, ReportsRepository } from '../ports';

export class MemoryBlocksRepository implements BlocksRepository {
  constructor(private readonly db: MemoryDb) {}

  async add(block: BlockRecord): Promise<void> {
    const key = `${block.blocker}:${block.blocked}`;
    if (!this.db.blocks.has(key)) this.db.blocks.set(key, { ...block });
  }

  async remove(blocker: string, blocked: string): Promise<void> {
    this.db.blocks.delete(`${blocker}:${blocked}`);
  }

  async listBy(blocker: string): Promise<BlockRecord[]> {
    return [...this.db.blocks.values()].filter((b) => b.blocker === blocker).map((b) => ({ ...b }));
  }

  async blockedEitherWay(userId: string): Promise<Set<string>> {
    const out = new Set<string>();
    for (const b of this.db.blocks.values()) {
      if (b.blocker === userId) out.add(b.blocked);
      if (b.blocked === userId) out.add(b.blocker);
    }
    return out;
  }
}

export class MemoryReportsRepository implements ReportsRepository {
  constructor(private readonly db: MemoryDb) {}

  async add(report: ReportRecord): Promise<void> {
    this.db.reports.push({ ...report });
  }

  async reportedBy(reporter: string): Promise<Set<string>> {
    return new Set(this.db.reports.flatMap((r) => (r.reporter === reporter && r.targetUser !== null ? [r.targetUser] : [])));
  }

  /** Signalements encore là (non purgés), avec leur identifiant (rang + 1) et leur état de traitement. */
  private live(): { id: string; r: ReportRecord; open: boolean }[] {
    return this.db.reports.flatMap((r, i) => {
      const id = String(i + 1);
      if (this.db.purgedReports.has(id)) return [];
      return [{ id, r, open: !this.db.reportReviews.has(id) }];
    });
  }

  private row(id: string, r: ReportRecord): ReportAlertRow {
    return { id, reason: r.reason, source: r.source ?? 'person', category: r.category ?? null, priority: r.priority ?? 0, createdAt: r.createdAt };
  }

  async openReportersOf(targetUser: string): Promise<{ distinct: number; minor: number }> {
    const open = this.live().filter((x) => x.open && x.r.targetUser === targetUser && x.r.reporter !== null && (x.r.source ?? 'person') === 'person');
    return { distinct: new Set(open.map((x) => x.r.reporter)).size, minor: new Set(open.filter((x) => x.r.reason === 'mineur').map((x) => x.r.reporter)).size };
  }

  async raisePriority(targetUser: string, priority: number): Promise<void> {
    for (const x of this.live()) if (x.open && x.r.targetUser === targetUser) x.r.priority = Math.max(x.r.priority ?? 0, priority);
  }

  async claimUnalerted(at: string, limit: number): Promise<ReportAlertRow[]> {
    const rows = this.live().filter((x) => !x.r.review && !x.r.alertedAt).slice(0, limit);
    for (const x of rows) x.r.alertedAt = at;
    return rows.map((x) => this.row(x.id, x.r));
  }

  async pendingAlerts(): Promise<{ count: number; urgent: boolean }> {
    const rows = this.live().filter((x) => !x.r.review && !x.r.alertedAt);
    return { count: rows.length, urgent: rows.some((x) => (x.r.priority ?? 0) >= 2) };
  }

  async lastAlertAt(): Promise<string | null> {
    return this.live().reduce<string | null>((max, x) => (!x.r.review && x.r.alertedAt && (max === null || x.r.alertedAt > max) ? x.r.alertedAt : max), null);
  }

  async claimOverdue(before: string, at: string, limit: number): Promise<ReportAlertRow[]> {
    const rows = this.live()
      .filter((x) => x.open && !x.r.review && !x.r.escalatedAt && x.r.createdAt < before)
      .slice(0, limit);
    for (const x of rows) {
      x.r.escalatedAt = at;
      x.r.priority = Math.max(x.r.priority ?? 0, 1);
    }
    return rows.map((x) => this.row(x.id, x.r));
  }

  async removeBy(reporter: string): Promise<void> {
    // Les identifiants suivent le rang : on marque comme purgés plutôt que de décaler le tableau.
    for (const x of this.live()) if (x.r.reporter === reporter) this.db.purgedReports.add(x.id);
  }
}
