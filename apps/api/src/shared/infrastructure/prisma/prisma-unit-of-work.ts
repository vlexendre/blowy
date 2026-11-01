/**
 * Unit of Work Prisma : transaction + verrouillage ordonné + outbox dans la même transaction.
 * Les repositories obtiennent le client transactionnel via `txOf(scope)`.
 */
import { runInTransaction, uuidv7, type Db, type OrderedLocker, type Tx } from '@blowy/database';
import type { Clock } from '../../application/clock.js';
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

  run<T>(fn: (scope: TxScope) => Promise<T>): Promise<T> {
    return runInTransaction(this.db, (tx, locker) => fn(this.scope(tx, locker)));
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
