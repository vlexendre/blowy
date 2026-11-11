import type { MemoryDb } from '../../../persistence/memory-db';
import type { BlockRecord, BlocksRepository, ReportRecord, ReportsRepository } from '../ports';

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
}
