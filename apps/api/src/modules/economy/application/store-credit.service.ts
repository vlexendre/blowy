import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { LedgerKeys, planReversal, type BillingEnvironment, type BillingProviderKind } from '../domain/index.js';
import type { BillingRecordRepository, StoreProductRecord } from './ports/billing-record.repository.js';
import type { LedgerRepository } from './ports/ledger.repository.js';

export interface StorePurchaseFact {
  readonly userId: string;
  readonly provider: BillingProviderKind;
  readonly environment: BillingEnvironment;
  readonly store: string;
  readonly storeTransactionId: string;
  readonly productId: string;
  readonly purchasedAt: Date;
}

export type CreditOutcome = 'CREDITED' | 'ALREADY_CREDITED' | 'NOT_CONSUMABLE' | 'ENV_NOT_ACCEPTED';

/**
 * Crédit des consommables « pièces » : UNE fois par transaction store, quel que soit le chemin
 * (webhook rejoué, réconciliation, restauration multi-appareils). Garanties :
 * - verrou User pris par l'appelant (sérialise webhook/réconciliation du même utilisateur) ;
 * - clé ledger `store:<provider>:<env>:<storeTransactionId>` UNIQUE ;
 * - StoreTransaction UNIQUE (provider, environment, storeTransactionId).
 */
export class StoreCreditService {
  constructor(
    private readonly ledger: LedgerRepository,
    private readonly records: BillingRecordRepository,
  ) {}

  async productsById(): Promise<Map<string, StoreProductRecord>> {
    return new Map((await this.records.listStoreProducts()).map((p) => [p.id, p]));
  }

  async creditConsumable(scope: TxScope, fact: StorePurchaseFact, product: StoreProductRecord | undefined, accepted: ReadonlySet<BillingEnvironment>): Promise<CreditOutcome> {
    if (!product || product.kind !== 'CONSUMABLE_COINS' || !product.active || !product.coinsAmount || product.coinsAmount <= 0) return 'NOT_CONSUMABLE';
    if (!accepted.has(fact.environment)) return 'ENV_NOT_ACCEPTED';
    const existing = await this.records.lockStoreTransaction(scope, fact.provider, fact.environment, fact.storeTransactionId);
    if (existing) return 'ALREADY_CREDITED';
    const key = LedgerKeys.storeTransaction(fact.provider, fact.environment, fact.storeTransactionId);
    if (await this.ledger.findByIdempotencyKey(scope, key)) return 'ALREADY_CREDITED';
    const wallet = await this.ledger.lockWallet(scope, fact.userId);
    const { entry } = await this.ledger.append(scope, wallet, {
      amount: product.coinsAmount,
      reason: 'STORE_PURCHASE',
      source: 'STORE',
      idempotencyKey: key,
      causeType: 'store_transaction',
      causeId: fact.storeTransactionId,
      metadata: { productId: fact.productId, store: fact.store, environment: fact.environment },
    });
    const inserted = await this.records.insertStoreTransaction(scope, {
      userId: fact.userId,
      provider: fact.provider,
      environment: fact.environment,
      store: fact.store,
      storeTransactionId: fact.storeTransactionId,
      productId: fact.productId,
      kind: 'CONSUMABLE_COINS',
      purchasedAt: fact.purchasedAt,
      status: 'CREDITED',
      coinsCredited: product.coinsAmount,
      ledgerEntryId: entry.id,
    });
    // Conflit impossible sous verrou User ; par sécurité, l'échec d'unicité annule la transaction.
    if (!inserted) throw new Error('Transaction store concurrente inattendue');
    return 'CREDITED';
  }

  /**
   * Remboursement store d'un consommable : contre-écriture bornée au solde (jamais négatif),
   * le manque est tracé en métadonnée. Aucun « faux remboursement » : seul le store rembourse.
   */
  async refundConsumable(scope: TxScope, provider: BillingProviderKind, environment: BillingEnvironment, storeTransactionId: string): Promise<'REFUNDED' | 'ALREADY_REFUNDED' | 'UNKNOWN'> {
    const tx = await this.records.lockStoreTransaction(scope, provider, environment, storeTransactionId);
    if (!tx || !tx.ledgerEntryId) return 'UNKNOWN';
    if (tx.status === 'REFUNDED') return 'ALREADY_REFUNDED';
    const key = LedgerKeys.storeRefund(provider, environment, storeTransactionId);
    if (await this.ledger.findByIdempotencyKey(scope, key)) return 'ALREADY_REFUNDED';
    const original = await this.ledger.findById(scope, tx.ledgerEntryId);
    if (!original) return 'UNKNOWN';
    const wallet = await this.ledger.lockWallet(scope, tx.userId);
    const plan = planReversal(wallet, original, {
      reason: 'REFUND_REVERSAL',
      source: 'STORE',
      idempotencyKey: key,
      causeType: 'store_refund',
      causeId: storeTransactionId,
    });
    let refundEntryId: string | null = null;
    if (plan.draft) refundEntryId = (await this.ledger.append(scope, wallet, plan.draft)).entry.id;
    await this.records.markStoreTransactionRefunded(scope, tx.id, refundEntryId, scope.now);
    return 'REFUNDED';
  }

  /** Remboursement annulé par le store (REFUND_REVERSED) : re-crédit du montant repris. */
  async reverseRefund(scope: TxScope, provider: BillingProviderKind, environment: BillingEnvironment, storeTransactionId: string): Promise<boolean> {
    const tx = await this.records.lockStoreTransaction(scope, provider, environment, storeTransactionId);
    if (!tx || tx.status !== 'REFUNDED') return false;
    const key = LedgerKeys.storeRefundReversed(provider, environment, storeTransactionId);
    if (await this.ledger.findByIdempotencyKey(scope, key)) return false;
    const refund = tx.refundLedgerEntryId ? await this.ledger.findById(scope, tx.refundLedgerEntryId) : null;
    const wallet = await this.ledger.lockWallet(scope, tx.userId);
    if (refund && refund.amount < 0) {
      await this.ledger.append(scope, wallet, {
        amount: -refund.amount,
        reason: 'STORE_PURCHASE',
        source: 'STORE',
        idempotencyKey: key,
        causeType: 'store_refund_reversed',
        causeId: storeTransactionId,
        reversesEntryId: refund.id,
      });
    }
    return this.records.markStoreTransactionRecredited(scope, tx.id);
  }
}
