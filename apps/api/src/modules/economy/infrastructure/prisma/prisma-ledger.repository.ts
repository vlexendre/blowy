import { uuidv7, type Db } from '@blowy/database';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import { decodeCursor, pageFrom, type Page } from '../../../../shared/application/pagination.js';
import { txOf } from '../../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { applyEntry, type LedgerEntry, type LedgerEntryDraft, type WalletSnapshot } from '../../domain/index.js';
import type { LedgerRepository } from '../../application/ports/ledger.repository.js';

type Row = {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  source: string;
  idempotencyKey: string;
  causeType: string;
  causeId: string | null;
  reversesEntryId: string | null;
  actorUserId: string | null;
  note: string | null;
  metadata: unknown;
  createdAt: Date;
};

const toEntry = (r: Row): LedgerEntry => ({
  ...r,
  reason: r.reason as LedgerEntry['reason'],
  source: r.source as LedgerEntry['source'],
  metadata: (r.metadata ?? {}) as Record<string, unknown>,
});

/**
 * Ledger Prisma. Verrou : `scope.lock.wallets([userId])` = SELECT … FOR UPDATE sur Wallet (ordre
 * global du socle). Le solde est mis à jour avec une garde `balance + amount >= 0` en SQL en plus
 * du CHECK de la table : un débit concurrent ne peut jamais rendre le solde négatif.
 */
export class PrismaLedgerRepository implements LedgerRepository {
  constructor(private readonly db: Db) {}

  async lockWallet(scope: TxScope, userId: string): Promise<WalletSnapshot> {
    const tx = txOf(scope);
    await tx.$executeRaw`INSERT INTO "Wallet" (id, "userId", balance, version, "createdAt", "updatedAt")
      VALUES (${uuidv7(scope.now.getTime())}::uuid, ${userId}::uuid, 0, 0, ${scope.now}, ${scope.now})
      ON CONFLICT ("userId") DO NOTHING`;
    await scope.lock.wallets([userId]);
    const w = await tx.wallet.findUniqueOrThrow({ where: { userId } });
    return { id: w.id, userId: w.userId, balance: w.balance, version: w.version };
  }

  async append(scope: TxScope, wallet: WalletSnapshot, draft: LedgerEntryDraft): Promise<{ entry: LedgerEntry; wallet: WalletSnapshot }> {
    const tx = txOf(scope);
    const { balanceAfter } = applyEntry(wallet, draft);
    const updated = await tx.$executeRaw`UPDATE "Wallet" SET balance = balance + ${draft.amount}, version = version + 1, "updatedAt" = ${scope.now}
      WHERE id = ${wallet.id}::uuid AND version = ${wallet.version} AND balance + ${draft.amount} >= 0`;
    if (updated !== 1) throw new Error('Wallet modifié hors verrou (version)');
    const row = await tx.ledgerEntry.create({
      data: {
        id: uuidv7(scope.now.getTime()),
        walletId: wallet.id,
        userId: wallet.userId,
        amount: draft.amount,
        balanceAfter,
        reason: draft.reason,
        source: draft.source,
        idempotencyKey: draft.idempotencyKey,
        causeType: draft.causeType,
        causeId: draft.causeId,
        reversesEntryId: draft.reversesEntryId ?? null,
        actorUserId: draft.actorUserId ?? null,
        note: draft.note ?? null,
        metadata: (draft.metadata ?? {}) as object,
        createdAt: scope.now,
      },
    });
    return { entry: toEntry(row), wallet: { ...wallet, balance: balanceAfter, version: wallet.version + 1 } };
  }

  async findByIdempotencyKey(scope: TxScope, key: string): Promise<LedgerEntry | null> {
    const r = await txOf(scope).ledgerEntry.findUnique({ where: { idempotencyKey: key } });
    return r ? toEntry(r) : null;
  }

  async findById(scope: TxScope, id: string): Promise<LedgerEntry | null> {
    const r = await txOf(scope).ledgerEntry.findUnique({ where: { id } });
    return r ? toEntry(r) : null;
  }

  async balanceOf(userId: string): Promise<number> {
    return (await this.db.wallet.findUnique({ where: { userId }, select: { balance: true } }))?.balance ?? 0;
  }

  async listEntries(userId: string, cursor: string | undefined, limit: number): Promise<Page<LedgerEntry>> {
    const c = decodeCursor(cursor);
    const where =
      c && typeof c[0] === 'string' && typeof c[1] === 'string'
        ? { userId, OR: [{ createdAt: { lt: new Date(c[0]) } }, { createdAt: new Date(c[0]), id: { lt: c[1] } }] }
        : { userId };
    const rows = await this.db.ledgerEntry.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: limit + 1 });
    return pageFrom(rows.map(toEntry), limit, (e) => [e.createdAt.toISOString(), e.id]);
  }
}

