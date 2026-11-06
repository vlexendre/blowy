/**
 * Unit of Work Prisma : transaction + verrouillage ordonné + outbox dans la même transaction.
 * Les repositories obtiennent le client transactionnel via `txOf(scope)`.
 */
import { isContentionError, runInTransaction, uuidv7, type Db, type OrderedLocker, type Tx } from '@blowy/database';
import type { Clock } from '../../application/clock.js';
import { AppError } from '../../domain/errors.js';
import type { OutboxMessage, TxScope, UnitOfWork } from '../../application/unit-of-work.js';

const TX = Symbol('prismaTx');

interface PrismaTxScope extends TxScope {
  [TX]: Tx;
}

/** Accès au client transactionnel depuis l'infrastructure uniquement. */
export function txOf(scope: TxScope): Tx {
  const tx = (scope as PrismaTxScope)[TX];
  if (!tx) throw new Error('Portée transactionnelle Prisma attendue');
  return tx;
}

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  async run<T>(fn: (scope: TxScope) => Promise<T>): Promise<T> {
    try {
      return await runInTransaction(this.db, (tx, locker) => fn(this.scope(tx, locker)));
    } catch (err) {
      // Contention persistante (verrou, pool, deadlock après retries) : refus propre et réessayable,
      // jamais un 500 après 20 s (B1).
      if (!(err instanceof AppError) && isContentionError(err)) {
        throw new AppError('CONFLICT', 'Opération concurrente en cours, réessaie', { retryable: true, detailsSafe: { reason: 'CONTENTION' } });
      }
      throw err;
    }
  }

  private scope(tx: Tx, locker: OrderedLocker): PrismaTxScope {
    const now = this.clock.now();
    return {
      [TX]: tx,
      now,
      lock: locker,
      outbox: {
        emit: async (m: OutboxMessage) => {
          const id = uuidv7(now.getTime());
          await tx.outboxEvent.create({
            data: {
              id,
              topic: m.topic,
              aggregateType: m.aggregateType,
              aggregateId: m.aggregateId,
              payload: m.payload as object,
              createdAt: now,
              availableAt: m.availableAt ?? now,
            },
          });
          return id;
        },
      },
    };
  }
}
