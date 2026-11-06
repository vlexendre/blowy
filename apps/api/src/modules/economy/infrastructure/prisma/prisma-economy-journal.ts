/**
 * Journal économique V5 sur la table append-only EXISTANTE `DomainEvent` (trigger anti-UPDATE, aucune
 * migration — mission T3 « tout via le ledger existant ») :
 * - `aggregateType = 'economy.journal'`, `aggregateId = UUID dérivé (SHA-256) de la clé d'idempotence`,
 *   `seq = 0` → l'unicité `(aggregateType, aggregateId, seq)` est la contrainte UNIQUE de la clé :
 *   rejouer une cause n'écrit jamais deux fois (INSERT … ON CONFLICT DO NOTHING) ;
 * - `actorUserId` = titulaire du compte utilisateur (crédits, paiements), `type` = nature, `payload` =
 *   {key, account, amount (entier signé), unit, refs}. Aucune donnée de carte ni secret client.
 * Tables dédiées proposées à C (spec §8.2 `OutingCreditEntry`, `Payment`) : même port, adapter à remplacer.
 */
import { createHash } from 'node:crypto';
import { uuidv7, type Db } from '@blowy/database';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import { txOf } from '../../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { EconomyJournal, JournalDraft, JournalEntry, JournalKind } from '../../application/payments/ports.js';

export const JOURNAL_AGGREGATE = 'economy.journal';

/** UUID (variante RFC 4122, version 8 « personnalisée ») dérivé de façon déterministe d'une clé. */
export function journalIdOf(key: string): string {
  const h = createHash('sha256').update(`economy-journal:${key}`).digest('hex');
  const v = ((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-${v}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

type Row = { id: string; aggregateId: string; type: string; actorUserId: string | null; payload: unknown; occurredAt: Date };
type Payload = { key: string; account: string; amount: number; unit: JournalDraft['unit']; refs: JournalDraft['refs'] };

const toEntry = (r: Row): JournalEntry => {
  const p = r.payload as Payload;
  return { id: r.id, key: p.key, kind: r.type as JournalKind, account: p.account, userId: r.actorUserId, amount: p.amount, unit: p.unit, refs: p.refs ?? {}, at: r.occurredAt };
};
const select = { id: true, aggregateId: true, type: true, actorUserId: true, payload: true, occurredAt: true } as const;

export class PrismaEconomyJournal implements EconomyJournal {
  constructor(private readonly db: Db) {}

  private client(scope: TxScope | null) {
    return scope ? txOf(scope) : this.db;
  }

  async append(scope: TxScope, d: JournalDraft): Promise<{ entry: JournalEntry; inserted: boolean }> {
    if (!Number.isSafeInteger(d.amount)) throw new Error('Montant du journal non entier');
    if (!d.key || d.key.length > 300) throw new Error("Clé d'idempotence invalide");
    const tx = txOf(scope);
    const aggregateId = journalIdOf(d.key);
    const payload: Payload = { key: d.key, account: d.account, amount: d.amount, unit: d.unit, refs: d.refs };
    const n = await tx.$executeRaw`INSERT INTO "DomainEvent" (id, "aggregateType", "aggregateId", seq, type, "actorUserId", payload, "occurredAt")
      VALUES (${uuidv7(scope.now.getTime())}::uuid, ${JOURNAL_AGGREGATE}, ${aggregateId}::uuid, 0, ${d.kind}, ${d.userId}::uuid, ${JSON.stringify(payload)}::jsonb, ${scope.now})
      ON CONFLICT ("aggregateType", "aggregateId", seq) DO NOTHING`;
    const row = await tx.domainEvent.findUniqueOrThrow({ where: { aggregateType_aggregateId_seq: { aggregateType: JOURNAL_AGGREGATE, aggregateId, seq: 0 } }, select });
    return { entry: toEntry(row), inserted: n === 1 };
  }

  async byKey(scope: TxScope | null, key: string): Promise<JournalEntry | null> {
    const row = await this.client(scope).domainEvent.findUnique({ where: { aggregateType_aggregateId_seq: { aggregateType: JOURNAL_AGGREGATE, aggregateId: journalIdOf(key), seq: 0 } }, select });
    return row ? toEntry(row) : null;
  }

  async forUser(scope: TxScope | null, userId: string, kinds: readonly JournalKind[]): Promise<JournalEntry[]> {
    const rows = await this.client(scope).domainEvent.findMany({ where: { aggregateType: JOURNAL_AGGREGATE, actorUserId: userId, type: { in: [...kinds] } }, select, orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] });
    return rows.map(toEntry);
  }

  async byRef(scope: TxScope | null, kind: JournalKind, ref: string, value: string): Promise<JournalEntry[]> {
    const rows = await this.client(scope).domainEvent.findMany({ where: { aggregateType: JOURNAL_AGGREGATE, type: kind, payload: { path: ['refs', ref], equals: value } }, select, orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] });
    return rows.map(toEntry);
  }

  async pendingRefunds(limit: number): Promise<JournalEntry[]> {
    const rows = await this.db.$queryRaw<Row[]>`
      SELECT r.id, r."aggregateId", r.type, r."actorUserId", r.payload, r."occurredAt" FROM "DomainEvent" r
      WHERE r."aggregateType" = ${JOURNAL_AGGREGATE} AND r.type = 'REFUND_REQUESTED'
        AND NOT EXISTS (SELECT 1 FROM "DomainEvent" s WHERE s."aggregateType" = ${JOURNAL_AGGREGATE} AND s.type = 'REFUND_SETTLED'
                        AND s.payload->'refs'->>'providerPaymentId' = r.payload->'refs'->>'providerPaymentId')
      ORDER BY r."occurredAt", r.id LIMIT ${limit}`;
    return rows.map(toEntry);
  }

  async forAccount(account: string, kinds: readonly JournalKind[], limit: number): Promise<JournalEntry[]> {
    const rows = await this.db.domainEvent.findMany({ where: { aggregateType: JOURNAL_AGGREGATE, type: { in: [...kinds] }, payload: { path: ['account'], equals: account } }, select, orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }], take: limit });
    return rows.map(toEntry);
  }
}

/** Lecture seule des places (tables du module `outings`) : jamais d'écriture ici. */
export class PrismaSeatDirectory {
  constructor(private readonly db: Db) {}

  async seat(seatId: string) {
    const s = await this.db.outingSeat.findUnique({ where: { id: seatId }, select: { id: true, userId: true, outingId: true, status: true, funding: true, cancelKind: true, cancelledAt: true, outing: { select: { venueId: true, status: true, lockAt: true } } } });
    return s ? { seatId: s.id, userId: s.userId, outingId: s.outingId, venueId: s.outing.venueId, outingStatus: s.outing.status, status: s.status, funding: s.funding, cancelKind: s.cancelKind, cancelledAfterLock: !!s.cancelledAt && s.cancelledAt >= s.outing.lockAt } : null;
  }

  async usedFreeFirst(userId: string) {
    return (await this.db.outingSeat.count({ where: { userId, funding: 'FREE_FIRST', refundState: { notIn: ['RECREDITED', 'PENDING', 'REFUNDED'] } } })) > 0;
  }
}
