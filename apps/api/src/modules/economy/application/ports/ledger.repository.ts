import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { Page } from '../../../../shared/application/pagination.js';
import type { LedgerEntry, LedgerEntryDraft, WalletSnapshot } from '../../domain/index.js';

/**
 * Repository du ledger. Toute écriture passe par `append`, qui exige un wallet VERROUILLÉ
 * (obtenu par `lockWallet` dans la même portée) : solde et écriture sont cohérents.
 */
export interface LedgerRepository {
  /** Crée le wallet si absent, puis le verrouille (SELECT … FOR UPDATE via scope.lock.wallets). */
  lockWallet(scope: TxScope, userId: string): Promise<WalletSnapshot>;
  /** Ajoute une écriture et met à jour le solde. Lève INSUFFICIENT_FUNDS si solde < 0. */
  append(scope: TxScope, wallet: WalletSnapshot, draft: LedgerEntryDraft): Promise<{ entry: LedgerEntry; wallet: WalletSnapshot }>;
  findByIdempotencyKey(scope: TxScope, key: string): Promise<LedgerEntry | null>;
  findById(scope: TxScope, id: string): Promise<LedgerEntry | null>;
  balanceOf(userId: string): Promise<number>;
  listEntries(userId: string, cursor: string | undefined, limit: number): Promise<Page<LedgerEntry>>;
}
export const LEDGER_REPOSITORY = Symbol('LedgerRepository');
