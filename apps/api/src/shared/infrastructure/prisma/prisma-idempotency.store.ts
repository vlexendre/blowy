import { isUniqueViolation } from '@blowy/database';
import type { CommandKey, IdempotencyRecord, IdempotencyStore } from '../../application/command-bus.js';
import type { TxScope } from '../../application/unit-of-work.js';
import { txOf } from './prisma-unit-of-work.js';

/**
 * Réservation par INSERT … ON CONFLICT DO NOTHING : sous concurrence, la seconde transaction
 * attend la première (verrou d'index unique) puis voit la ligne commitée ou rien (rollback).
 */
export class PrismaIdempotencyStore implements IdempotencyStore {
  async reserve(scope: TxScope, key: CommandKey, payloadHash: string): Promise<IdempotencyRecord | null> {
    const tx = txOf(scope);
    try {
      const inserted = await tx.$executeRaw`
        INSERT INTO "CommandRecord" (id, "actorId", operation, "commandId", "payloadHash", status, "createdAt")
        VALUES (gen_random_uuid(), ${key.actorId}::uuid, ${key.operation}, ${key.commandId}::uuid, ${payloadHash}, 'IN_PROGRESS', ${scope.now})
        ON CONFLICT ("actorId", operation, "commandId") DO NOTHING`;
      if (inserted === 1) return null;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
    const row = await tx.commandRecord.findUnique({
      where: { actorId_operation_commandId: { actorId: key.actorId, operation: key.operation, commandId: key.commandId } },
    });
    if (!row) return null;
    return { payloadHash: row.payloadHash, status: row.status, result: row.result };
  }

  async complete(scope: TxScope, key: CommandKey, result: unknown): Promise<void> {
    await txOf(scope).commandRecord.update({
      where: { actorId_operation_commandId: { actorId: key.actorId, operation: key.operation, commandId: key.commandId } },
      data: { status: 'COMPLETED', result: (result ?? null) as object, completedAt: scope.now },
    });
  }
}
