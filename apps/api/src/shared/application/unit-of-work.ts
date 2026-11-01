/**
 * Unit of Work : portée transactionnelle opaque pour la couche application.
 * L'infrastructure (Prisma) fournit l'implémentation ; les repositories reçoivent
 * la portée et en extraient le client transactionnel.
 */
export interface AggregateLocks {
  /** Ordre imposé : users → pets → relationships → wallets (sinon erreur). */
  users(ids: readonly string[]): Promise<void>;
  pets(ids: readonly string[]): Promise<void>;
  relationships(ids: readonly string[]): Promise<void>;
  wallets(userIds: readonly string[]): Promise<void>;
}

export interface OutboxMessage {
  topic: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  /** Livraison différée (ex. échéance). */
  availableAt?: Date;
}

export interface OutboxPort {
  emit(message: OutboxMessage): Promise<string>;
}

export interface TxScope {
  /** Heure d'acceptation serveur figée pour toute la commande. */
  readonly now: Date;
  readonly lock: AggregateLocks;
  readonly outbox: OutboxPort;
}

export interface UnitOfWork {
  run<T>(fn: (scope: TxScope) => Promise<T>): Promise<T>;
}
export const UNIT_OF_WORK = Symbol('UnitOfWork');
