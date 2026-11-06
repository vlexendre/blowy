/**
 * Transactions et verrouillage ordonné.
 *
 * Ordre global imposé (anti-deadlock) : users → pets → relations → wallets ;
 * à l'intérieur d'une classe, tri lexicographique des identifiants.
 * Les verrous sont pris par `SELECT … FOR NO KEY UPDATE` dans la transaction courante :
 * exclusifs entre commandes, mais compatibles avec le `FOR KEY SHARE` implicite des INSERT
 * qui référencent la ligne par clé étrangère (ex. `CommandRecord.actorId → User`). Avec
 * `FOR UPDATE`, deux commandes concurrentes du même utilisateur s'interbloquaient
 * systématiquement (chacune tenait le KEY SHARE attendu par l'autre) — bug B1.
 */
import { Prisma } from './generated/prisma/client.js';
import type { Db } from './client.js';

export type Tx = Prisma.TransactionClient;

export const LOCK_ORDER = ['User', 'Pet', 'RelationshipContext', 'Wallet'] as const;
export type LockClass = (typeof LOCK_ORDER)[number];

/** Colonne de clé verrouillée par classe. */
const LOCK_KEY: Record<LockClass, string> = {
  User: 'id',
  Pet: 'id',
  RelationshipContext: 'id',
  Wallet: 'userId',
};

export class LockOrderViolation extends Error {
  constructor(prev: LockClass, next: LockClass) {
    super(`Ordre de verrouillage violé : ${next} après ${prev}`);
  }
}

/**
 * Verrouilleur d'une transaction : refuse de reprendre une classe antérieure
 * (garantit l'ordre global même si un use case l'oublie).
 */
export class OrderedLocker {
  private lastIndex = -1;
  private readonly held = new Set<string>();

  constructor(private readonly tx: Tx) {}

  async lock(cls: LockClass, ids: readonly string[]): Promise<void> {
    const idx = LOCK_ORDER.indexOf(cls);
    if (idx < this.lastIndex) throw new LockOrderViolation(LOCK_ORDER[this.lastIndex]!, cls);
    const todo = [...new Set(ids)].filter((id) => !this.held.has(`${cls}:${id}`)).sort();
    if (idx === this.lastIndex && todo.length > 0) {
      // Même classe reprise plus tard : autorisé uniquement si tous les nouveaux ids sont > aux précédents.
      const maxHeld = [...this.held].filter((k) => k.startsWith(`${cls}:`)).map((k) => k.slice(cls.length + 1)).sort().at(-1);
      if (maxHeld && todo[0]! < maxHeld) {
        throw new LockOrderViolation(cls, cls);
      }
    }
    this.lastIndex = Math.max(this.lastIndex, idx);
    if (todo.length === 0) return;
    const key = LOCK_KEY[cls];
    await this.tx.$queryRawUnsafe(
      `SELECT 1 FROM "${cls}" WHERE "${key}" = ANY($1::uuid[]) ORDER BY "${key}" FOR NO KEY UPDATE`,
      todo,
    );
    for (const id of todo) this.held.add(`${cls}:${id}`);
  }

  users(ids: readonly string[]) {
    return this.lock('User', ids);
  }
  pets(ids: readonly string[]) {
    return this.lock('Pet', ids);
  }
  relationships(ids: readonly string[]) {
    return this.lock('RelationshipContext', ids);
  }
  wallets(userIds: readonly string[]) {
    return this.lock('Wallet', userIds);
  }
}

const RETRYABLE_PG = new Set(['40001', '40P01']); // serialization_failure, deadlock_detected
const LOCK_TIMEOUT_PG = '55P03'; // lock_not_available (lock_timeout dépassé)

/** Détecte deadlock / échec de sérialisation (via adapter pg ou erreur Prisma P2034). */
export function isRetryableTxError(err: unknown): boolean {
  let cur: unknown = err;
  for (let depth = 0; depth < 6 && cur; depth++) {
    const e = cur as { code?: unknown; cause?: unknown; meta?: { code?: unknown } };
    if (e.code === 'P2034') return true;
    if (typeof e.code === 'string' && RETRYABLE_PG.has(e.code)) return true;
    if (e.meta && typeof e.meta.code === 'string' && RETRYABLE_PG.has(e.meta.code)) return true;
    const msg = (cur as Error).message;
    if (typeof msg === 'string' && /deadlock detected|could not serialize access/i.test(msg)) return true;
    cur = e.cause;
  }
  return false;
}

/**
 * Contention non résolue : attente de verrou au-delà de `lock_timeout` (55P03), impossibilité
 * d'obtenir une connexion/transaction à temps (P2024/P2028), ou deadlock/sérialisation après
 * épuisement des tentatives. L'appelant la traduit en refus propre et réessayable (409).
 */
export function isContentionError(err: unknown): boolean {
  if (isRetryableTxError(err)) return true;
  let cur: unknown = err;
  for (let depth = 0; depth < 6 && cur; depth++) {
    const e = cur as { code?: unknown; cause?: unknown; meta?: { code?: unknown } };
    if (e.code === LOCK_TIMEOUT_PG || e.meta?.code === LOCK_TIMEOUT_PG) return true;
    if (e.code === 'P2024' || e.code === 'P2028') return true;
    const msg = (cur as Error).message;
    if (typeof msg === 'string' && /lock timeout|canceling statement due to lock timeout|Unable to start a transaction in the given time|Transaction already closed|Timed out fetching a new connection/i.test(msg)) return true;
    cur = e.cause;
  }
  return false;
}

/** Violation d'unicité (P2002 ou 23505). */
export function isUniqueViolation(err: unknown): boolean {
  let cur: unknown = err;
  for (let depth = 0; depth < 6 && cur; depth++) {
    const e = cur as { code?: unknown; cause?: unknown };
    if (e.code === 'P2002' || e.code === '23505') return true;
    const msg = (cur as Error).message;
    if (typeof msg === 'string' && /unique constraint|duplicate key/i.test(msg)) return true;
    cur = e.cause;
  }
  return false;
}

export interface TxOptions {
  maxAttempts?: number;
  /** Attente maximale d'un verrou ligne (SET LOCAL lock_timeout) ; défaut 4 s. */
  lockTimeoutMs?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
  timeoutMs?: number;
}

/**
 * Exécute `fn` dans une transaction avec retry borné (deadlock/sérialisation)
 * et backoff exponentiel court. `fn` doit être pure vis-à-vis de l'extérieur
 * (aucun appel réseau sous verrou).
 */
export async function runInTransaction<T>(
  db: Db,
  fn: (tx: Tx, locker: OrderedLocker) => Promise<T>,
  opts: TxOptions = {},
): Promise<T> {
  const max = opts.maxAttempts ?? 4;
  let attempt = 0;
  for (;;) {
    attempt++;
    try {
      return await db.$transaction(
        async (tx) => {
          // Une commande ne reste jamais bloquée derrière un verrou : au-delà, refus réessayable.
          await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '${Math.max(1, Math.floor(opts.lockTimeoutMs ?? 4_000))}ms'`);
          return fn(tx, new OrderedLocker(tx));
        },
        {
          isolationLevel: opts.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted,
          timeout: opts.timeoutMs ?? 15_000,
          maxWait: 5_000,
        },
      );
    } catch (err) {
      if (attempt >= max || !isRetryableTxError(err)) throw err;
      await new Promise((r) => setTimeout(r, 15 * 2 ** attempt + Math.floor(attempt * 7)));
    }
  }
}
