import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { Page } from '../../../../shared/application/pagination.js';
import type { BillingEnvironment, BillingProviderKind } from '../../domain/index.js';
import type { NormalizedWebhookEvent } from './billing-provider.port.js';

export interface StoreProductRecord {
  readonly id: string;
  readonly kind: 'SUBSCRIPTION' | 'CONSUMABLE_COINS';
  readonly coinsAmount: number | null;
  readonly entitlementId: string | null;
  readonly active: boolean;
}

export interface StoreTransactionRecord {
  readonly id: string;
  readonly userId: string;
  readonly provider: BillingProviderKind;
  readonly environment: BillingEnvironment;
  readonly storeTransactionId: string;
  readonly productId: string;
  readonly status: 'CREDITED' | 'REFUNDED' | 'RECORDED';
  readonly coinsCredited: number;
  readonly ledgerEntryId: string | null;
  readonly refundLedgerEntryId: string | null;
}

export type WebhookStatus = 'RECEIVED' | 'PROCESSED' | 'IGNORED' | 'FAILED';

export interface WebhookEventRecord {
  readonly id: string;
  readonly provider: string;
  readonly providerEventId: string;
  readonly environment: BillingEnvironment;
  readonly eventType: string;
  readonly appUserId: string | null;
  readonly eventTimestamp: Date;
  readonly receivedAt: Date;
  readonly processedAt: Date | null;
  readonly status: WebhookStatus;
  readonly attempts: number;
  readonly lastError: string | null;
}

/** Produits store, transactions store et journal des webhooks fournisseur. */
export interface BillingRecordRepository {
  listStoreProducts(): Promise<StoreProductRecord[]>;
  /** Lecture verrouillée (FOR UPDATE) d'une transaction store par sa clé naturelle. */
  lockStoreTransaction(scope: TxScope, provider: BillingProviderKind, environment: BillingEnvironment, storeTransactionId: string): Promise<StoreTransactionRecord | null>;
  /** INSERT … ON CONFLICT DO NOTHING ; null si la transaction existe déjà (crédit unique). */
  insertStoreTransaction(scope: TxScope, data: Omit<StoreTransactionRecord, 'id' | 'refundLedgerEntryId'> & { store: string; kind: 'SUBSCRIPTION' | 'CONSUMABLE_COINS'; purchasedAt: Date }): Promise<StoreTransactionRecord | null>;
  markStoreTransactionRefunded(scope: TxScope, id: string, refundLedgerEntryId: string | null, at: Date): Promise<boolean>;
  markStoreTransactionRecredited(scope: TxScope, id: string): Promise<boolean>;

  /** Enregistre l'événement ; `duplicate=true` si (provider, providerEventId) déjà vu. */
  recordWebhook(event: NormalizedWebhookEvent, provider: string, appUserId: string | null, payload: unknown, now: Date): Promise<{ record: WebhookEventRecord; duplicate: boolean }>;
  /** Verrouille l'événement pour traitement (skip si déjà PROCESSED/IGNORED). */
  claimWebhook(scope: TxScope, id: string): Promise<WebhookEventRecord | null>;
  completeWebhook(scope: TxScope, id: string, status: 'PROCESSED' | 'IGNORED', at: Date): Promise<void>;
  failWebhook(id: string, error: string): Promise<void>;
  getWebhookPayload(id: string): Promise<{ record: WebhookEventRecord; payload: unknown } | null>;
  listWebhooks(filter: { status?: WebhookStatus; appUserId?: string }, cursor: string | undefined, limit: number): Promise<Page<WebhookEventRecord>>;
  listRetryableWebhooks(limit: number, maxAttempts: number): Promise<WebhookEventRecord[]>;
}
export const BILLING_RECORD_REPOSITORY = Symbol('BillingRecordRepository');
