import type { Db } from '@blowy/database';
import type { ProjectedEntry, ProjectionInput, ProjectionReader, ProjectionWriter } from '../../application/projection.js';
import type { TxScope } from '../../application/unit-of-work.js';
import { txOf } from './prisma-unit-of-work.js';

export class PrismaProjectionWriter implements ProjectionWriter {
  async append(scope: TxScope, input: ProjectionInput): Promise<ProjectedEntry> {
    const tx = txOf(scope);
    const existing = await tx.projectionEntry.findUnique({ where: { recipientId_sourceEventId: { recipientId: input.recipientId, sourceEventId: input.sourceEventId } } });
    if (existing) return { ...input, seq: existing.seq };
    // Compteur par destinataire, verrouillé par l'upsert (ligne unique).
    const rows = await tx.$queryRaw<{ lastSeq: number }[]>`
      INSERT INTO "ProjectionCursor" ("recipientId", "lastSeq") VALUES (${input.recipientId}::uuid, 1)
      ON CONFLICT ("recipientId") DO UPDATE SET "lastSeq" = "ProjectionCursor"."lastSeq" + 1
      RETURNING "lastSeq"`;
    const seq = Number(rows[0]!.lastSeq);
    await tx.projectionEntry.create({
      data: {
        recipientId: input.recipientId,
        seq,
        sourceEventId: input.sourceEventId,
        room: input.room,
        type: input.type,
        aggregateId: input.aggregateId,
        payload: input.payload as object,
        occurredAt: input.occurredAt,
      },
    });
    return { ...input, seq };
  }
}

export class PrismaProjectionReader implements ProjectionReader {
  constructor(private readonly db: Db) {}
  async since(recipientId: string, room: string, afterSeq: number, limit: number): Promise<ProjectedEntry[]> {
    const rows = await this.db.projectionEntry.findMany({ where: { recipientId, room, seq: { gt: afterSeq } }, orderBy: { seq: 'asc' }, take: limit });
    return rows.map((r) => ({ ...r, payload: r.payload as Record<string, unknown> }));
  }
  async head(recipientId: string): Promise<number> {
    return (await this.db.projectionCursor.findUnique({ where: { recipientId } }))?.lastSeq ?? 0;
  }
}
