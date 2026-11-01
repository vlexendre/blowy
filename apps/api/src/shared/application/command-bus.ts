/**
 * Command bus générique (pattern Command) — UNE seule implémentation pour tous les modules.
 *
 * Pour chaque commande acteur :
 *  1. idempotence (actorId, operation, commandId) : même clé + même payload → résultat rejoué ;
 *     même clé + payload différent → IDEMPOTENCY_CONFLICT ;
 *  2. transaction (Unit of Work) avec verrouillage ordonné et retry deadlock borné ;
 *  3. le handler applique les règles, écrit événements + outbox dans la même transaction ;
 *  4. le résultat (JSON) est mémorisé avec la commande.
 * Une commande en échec métier n'est pas mémorisée (la transaction est annulée).
 */
import { createHash } from 'node:crypto';
import { AppError } from '../domain/errors.js';
import type { TxScope, UnitOfWork } from './unit-of-work.js';

export interface IdempotencyRecord {
  payloadHash: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  result: unknown;
}

/** Port de stockage des commandes (implémenté en Prisma). */
export interface IdempotencyStore {
  /** Réserve la clé dans la transaction ; renvoie l'enregistrement existant si déjà pris. */
  reserve(scope: TxScope, key: CommandKey, payloadHash: string): Promise<IdempotencyRecord | null>;
  complete(scope: TxScope, key: CommandKey, result: unknown): Promise<void>;
}
export const IDEMPOTENCY_STORE = Symbol('IdempotencyStore');

export interface CommandKey {
  actorId: string;
  operation: string;
  commandId: string;
}

export interface CommandEnvelope<P, R> extends CommandKey {
  payload: P;
  handle: (scope: TxScope, payload: P) => Promise<R>;
}

export interface CommandOutcome<R> {
  result: R;
  replayed: boolean;
}

/** Hash canonique (clés triées) du payload validé. */
export function hashPayload(payload: unknown): string {
  return createHash('sha256').update(canonicalJson(payload)).digest('hex');
}

function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`)
    .join(',')}}`;
}

export class CommandBus {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly store: IdempotencyStore,
  ) {}

  async execute<P, R>(cmd: CommandEnvelope<P, R>): Promise<CommandOutcome<R>> {
    const key: CommandKey = { actorId: cmd.actorId, operation: cmd.operation, commandId: cmd.commandId };
    const payloadHash = hashPayload(cmd.payload);
    return this.uow.run(async (scope) => {
      const existing = await this.store.reserve(scope, key, payloadHash);
      if (existing) {
        if (existing.payloadHash !== payloadHash) {
          throw new AppError('IDEMPOTENCY_CONFLICT', 'Même commandId réutilisé avec un contenu différent');
        }
        if (existing.status === 'COMPLETED') return { result: existing.result as R, replayed: true };
        throw new AppError('CONFLICT', 'Commande en cours de traitement', { retryable: true });
      }
      const result = await cmd.handle(scope, cmd.payload);
      await this.store.complete(scope, key, result ?? null);
      return { result, replayed: false };
    });
  }
}
export const COMMAND_BUS = Symbol('CommandBus');
