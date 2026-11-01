import type { LedgerReason as DomainLedgerReason } from '@blowy/domain';

/**
 * Raisons ledger : vocabulaire @blowy/domain + raison propre au boost non consommé
 * (présente dans l'enum Prisma ; ajout demandé à l'orchestrateur dans @blowy/domain).
 */
export type LedgerReason = DomainLedgerReason | 'BOOST_NOT_CONSUMED_REFUND';
import { forbidden, insufficientFunds, invalid } from './errors.js';

/**
 * Ledger append-only en pièces entières.
 * - Une écriture n'est jamais modifiée ni supprimée : corrections et remboursements = nouvelles
 *   écritures (contre-écriture liée par `reversesEntryId`).
 * - Toute écriture porte une clé d'idempotence globale UNIQUE : rejouer la même cause ne crédite
 *   ni ne débite deux fois (contrainte PostgreSQL, pas seulement applicative).
 * - Le solde est une projection du ledger, maintenue sous verrou (SELECT … FOR UPDATE du wallet)
 *   et contrainte `balance >= 0`.
 */
export type LedgerSource =
  | 'SYSTEM'
  | 'STORE'
  | 'CATALOG'
  | 'STAFF'
  | 'SUBSCRIPTION'
  | 'MISSION'
  | 'STREAK'
  | 'REFERRAL'
  | 'SOCIAL'
  | 'LEAGUE';

export interface LedgerEntryDraft {
  readonly amount: number;
  readonly reason: LedgerReason;
  readonly source: LedgerSource;
  readonly idempotencyKey: string;
  /** Type de la cause métier (ex. 'catalog_purchase', 'store_transaction', 'monthly_benefit'). */
  readonly causeType: string;
  readonly causeId: string | null;
  readonly reversesEntryId?: string | null;
  /** Acteur staff pour une correction (jamais pour un gain joueur). */
  readonly actorUserId?: string | null;
  /** Motif obligatoire pour STAFF_CORRECTION. */
  readonly note?: string | null;
  readonly metadata?: Record<string, unknown>;
}

export interface LedgerEntry extends LedgerEntryDraft {
  readonly id: string;
  readonly walletId: string;
  readonly userId: string;
  readonly balanceAfter: number;
  readonly createdAt: Date;
}

export interface WalletSnapshot {
  readonly id: string;
  readonly userId: string;
  readonly balance: number;
  readonly version: number;
}

const assertInteger = (n: number, label: string) => {
  if (!Number.isSafeInteger(n)) throw invalid(`${label} doit être un entier.`, { label });
};

/** Valide une écriture et calcule le solde résultant. Refuse tout solde négatif. */
export function applyEntry(wallet: WalletSnapshot, draft: LedgerEntryDraft): { balanceAfter: number } {
  assertInteger(draft.amount, 'amount');
  if (draft.amount === 0) throw invalid('Écriture nulle interdite.');
  if (!draft.idempotencyKey || draft.idempotencyKey.length > 200) {
    throw invalid("Clé d'idempotence invalide.");
  }
  if (draft.reason === 'STAFF_CORRECTION') {
    if (!draft.actorUserId) throw forbidden('Correction sans acteur staff.');
    if (!draft.note || draft.note.trim().length < 5) {
      throw invalid('Motif de correction obligatoire.');
    }
  }
  const balanceAfter = wallet.balance + draft.amount;
  if (balanceAfter < 0) throw insufficientFunds(wallet.balance, -draft.amount);
  return { balanceAfter };
}

/**
 * Contre-écriture d'un crédit (remboursement store, annulation). Débite au plus le solde disponible :
 * le solde ne devient jamais négatif. Le manque éventuel est tracé (`unrecovered`) pour l'admin ;
 * aucune dette cachée n'est créée.
 */
export function planReversal(
  wallet: WalletSnapshot,
  original: Pick<LedgerEntry, 'id' | 'amount'>,
  draft: Omit<LedgerEntryDraft, 'amount' | 'reversesEntryId'>,
): { draft: LedgerEntryDraft | null; recovered: number; unrecovered: number } {
  if (original.amount <= 0) throw invalid('Seul un crédit peut être annulé.');
  const recovered = Math.min(wallet.balance, original.amount);
  const unrecovered = original.amount - recovered;
  if (recovered === 0) return { draft: null, recovered, unrecovered };
  return {
    draft: {
      ...draft,
      amount: -recovered,
      reversesEntryId: original.id,
      metadata: { ...(draft.metadata ?? {}), originalAmount: original.amount, unrecovered },
    },
    recovered,
    unrecovered,
  };
}

/** Clés d'idempotence canoniques : une seule fabrique, aucune clé construite ailleurs. */
export const LedgerKeys = {
  catalogPurchase: (userId: string, commandId: string) => `catalog:${userId}:${commandId}`,
  storeTransaction: (provider: string, environment: string, storeTransactionId: string) =>
    `store:${provider}:${environment}:${storeTransactionId}`,
  storeRefund: (provider: string, environment: string, storeTransactionId: string) =>
    `store-refund:${provider}:${environment}:${storeTransactionId}`,
  storeRefundReversed: (provider: string, environment: string, storeTransactionId: string) =>
    `store-refund-reversed:${provider}:${environment}:${storeTransactionId}`,
  monthlyBenefit: (userId: string, period: string) => `monthly:${userId}:${period}`,
  boostRefund: (inventoryItemId: string) => `boost-refund:${inventoryItemId}`,
  staffCorrection: (actorUserId: string, commandId: string) => `staff:${actorUserId}:${commandId}`,
  /** Parrainage (P-5.9) : une écriture par claim et par côté, quel que soit le nombre de livraisons. */
  referral: (claimId: string, side: 'referrer' | 'referee') => `referral:${claimId}:${side}`,
} as const;
