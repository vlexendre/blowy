import type { CommandBus } from '../../../../shared/application/command-bus.js';
import type { Page } from '../../../../shared/application/pagination.js';
import { LedgerKeys, invalid, type LedgerEntry } from '../../domain/index.js';
import type { BillingRecordRepository, WebhookEventRecord, WebhookStatus } from '../ports/billing-record.repository.js';
import type { LedgerRepository } from '../ports/ledger.repository.js';
import type { ProcessWebhookEventUseCase } from './process-webhook.use-case.js';
import type { ReconcileCustomerUseCase, ReconcileResult } from './reconcile-customer.use-case.js';

/**
 * Interface admin de l'économie (branchée par le module admin — agent F), qui fournit
 * l'acteur staff authentifié, son rôle et le step-up. Ici : règles métier uniquement.
 * Une correction est une NOUVELLE écriture motivée (STAFF_CORRECTION), jamais une modification ;
 * elle ne simule jamais un remboursement store (aucun « faux remboursement »).
 */
export interface AdminEconomyPort {
  correctBalance(input: { staffUserId: string; commandId: string; targetUserId: string; amount: number; reason: string }): Promise<{ ledgerEntryId: string; balance: number; replayed: boolean }>;
  readLedger(userId: string, cursor: string | undefined, limit: number): Promise<{ balance: number; page: Page<LedgerEntry> }>;
  listWebhooks(filter: { status?: WebhookStatus; appUserId?: string }, cursor: string | undefined, limit: number): Promise<Page<WebhookEventRecord>>;
  /** Re-traite un événement (contrôle l'état ACTUEL : idempotent, n'exécute pas un ancien effet deux fois). */
  redriveWebhook(webhookEventId: string): Promise<string>;
  reconcileUser(userId: string): Promise<ReconcileResult>;
}
export const ADMIN_ECONOMY = Symbol('AdminEconomyPort');

export class AdminEconomyUseCases implements AdminEconomyPort {
  constructor(
    private readonly bus: CommandBus,
    private readonly ledger: LedgerRepository,
    private readonly records: BillingRecordRepository,
    private readonly webhook: ProcessWebhookEventUseCase,
    private readonly reconcile: ReconcileCustomerUseCase,
  ) {}

  async correctBalance(input: { staffUserId: string; commandId: string; targetUserId: string; amount: number; reason: string }) {
    if (!Number.isSafeInteger(input.amount) || input.amount === 0 || Math.abs(input.amount) > 100_000) throw invalid('Montant de correction invalide.');
    const out = await this.bus.execute({
      actorId: input.staffUserId,
      operation: 'admin.economy.correct_balance',
      commandId: input.commandId,
      payload: { targetUserId: input.targetUserId, amount: input.amount, reason: input.reason },
      handle: async (scope) => {
        await scope.lock.users([input.targetUserId]);
        const wallet = await this.ledger.lockWallet(scope, input.targetUserId);
        const { entry, wallet: after } = await this.ledger.append(scope, wallet, {
          amount: input.amount,
          reason: 'STAFF_CORRECTION',
          source: 'STAFF',
          idempotencyKey: LedgerKeys.staffCorrection(input.staffUserId, input.commandId),
          causeType: 'staff_correction',
          causeId: input.commandId,
          actorUserId: input.staffUserId,
          note: input.reason,
        });
        await scope.outbox.emit({
          topic: 'audit.recorded',
          aggregateType: 'User',
          aggregateId: input.targetUserId,
          payload: { action: 'economy.correct_balance', actorUserId: input.staffUserId, targetId: input.targetUserId, amount: input.amount, reason: input.reason, ledgerEntryId: entry.id },
        });
        return { ledgerEntryId: entry.id, balance: after.balance };
      },
    });
    return { ...out.result, replayed: out.replayed };
  }

  async readLedger(userId: string, cursor: string | undefined, limit: number) {
    const [balance, page] = await Promise.all([this.ledger.balanceOf(userId), this.ledger.listEntries(userId, cursor, limit)]);
    return { balance, page };
  }

  listWebhooks(filter: { status?: WebhookStatus; appUserId?: string }, cursor: string | undefined, limit: number) {
    return this.records.listWebhooks(filter, cursor, limit);
  }

  redriveWebhook(webhookEventId: string) {
    return this.webhook.execute(webhookEventId);
  }

  reconcileUser(userId: string) {
    return this.reconcile.execute(userId);
  }
}
