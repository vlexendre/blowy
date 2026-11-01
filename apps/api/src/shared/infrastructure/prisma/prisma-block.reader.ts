import type { Db } from '@blowy/database';
import type { BlockReader } from '../../application/ports/block-reader.port.js';

export class PrismaBlockReader implements BlockReader {
  constructor(private readonly db: Db) {}
  async isBlockedBetween(a: string, b: string): Promise<boolean> {
    const n = await this.db.block.count({
      where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    });
    return n > 0;
  }
}
