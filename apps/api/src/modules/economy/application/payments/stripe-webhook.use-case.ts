/**
 * Webhook Stripe (spec-v5 §6.3, §7.4) : signature `Stripe-Signature` vérifiée sur le CORPS BRUT
 * (aucun enregistrement si invalide), journal `ProviderWebhookEvent` UNIQUE (provider, event.id) →
 * un rejeu ne produit aucun effet, puis stratégie par type dans UNE transaction (verrou users).
 * - `payment_intent.succeeded` : place HELD → CONFIRMED (port `SeatPaymentSink`) ; paiement trop
 *   tard / doublon → remboursement intégral automatique (journal, exécuté par `economy.refunds`).
 * - `payment_intent.payment_failed` : journalisé ; la place reste HELD jusqu'à l'échéance du hold.
 * - `charge.refunded` / `refund.*` réussis : remboursement réglé (idempotent).
 * - V5.4 (C.10) : `customer.subscription.created|updated|deleted` (métadonnée `purpose=PLUS`) → état
 *   Blowy+ (Stripe Billing) ; c'est le SEUL chemin qui accorde Blowy+ hors démo locale.
 * Une erreur de traitement répond 500 : Stripe relivre, l'événement `FAILED` est repris.
 */
import type { Clock } from '../../../../shared/application/clock.js';
import type { SeatPaymentSink } from '../../../../shared/application/ports/seat-payment-sink.port.js';
import type { TxScope, UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import { LedgerKeys, type PaymentsParams } from '../../domain/index.js';
import type { BillingRecordRepository } from '../ports/billing-record.repository.js';
import type { UserDirectory } from '../ports/economy-config.port.js';
import type { EconomyJournal, SignedWebhookVerifier, VerifiedProviderEvent } from './ports.js';
import type { EconomySeatFunding } from './seat-funding.service.js';
import { readStripeSubscription } from '../../domain/index.js';
import type { PlusBillingUseCases } from './plus-billing.use-cases.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isSafeInteger(v) ? v : null);
const meta = (o: Record<string, unknown>): Record<string, unknown> => (o.metadata && typeof o.metadata === 'object' ? (o.metadata as Record<string, unknown>) : {});

export interface StripeWebhookResult {
  status: 'ACCEPTED' | 'DUPLICATE' | 'IGNORED';
}

export class HandleStripeWebhookUseCase {
  constructor(
    private readonly verifier: SignedWebhookVerifier,
    private readonly records: BillingRecordRepository,
    private readonly uow: UnitOfWork,
    private readonly journal: EconomyJournal,
    private readonly funding: EconomySeatFunding,
    private readonly sink: () => SeatPaymentSink,
    private readonly users: UserDirectory,
    private readonly params: () => PaymentsParams,
    private readonly clock: Clock,
    /** V5.4 (C.10) : Blowy+ via Stripe Billing (résolu tardivement : évite un cycle de composition). */
    private readonly plus: () => PlusBillingUseCases | null = () => null,
  ) {}

  async execute(rawBody: Buffer | undefined, signature: string | undefined): Promise<StripeWebhookResult> {
    const now = this.clock.now();
    // Lève UNAUTHENTICATED/VALIDATION avant toute écriture : rien n'est enregistré.
    const event = this.verifier.verify(rawBody ?? Buffer.alloc(0), signature, now);
    const userId = this.userIdOf(event);
    const { record, duplicate } = await this.records.recordWebhook(
      {
        providerEventId: event.id,
        type: event.type,
        eventAt: event.createdAt,
        environment: event.livemode ? 'PRODUCTION' : 'SANDBOX',
        appUserIds: userId ? [userId] : [],
        productId: null,
        newProductId: null,
        entitlementIds: [],
        periodType: null,
        purchasedAt: null,
        expiresAt: null,
        gracePeriodExpiresAt: null,
        store: 'stripe',
        transactionId: null,
        originalTransactionId: null,
        cancelReason: null,
        expirationReason: null,
        transferredFrom: [],
        transferredTo: [],
      },
      'stripe',
      userId && (await this.users.exists(userId)) ? userId : null,
      event.redacted,
      now,
    );
    if (duplicate && (record.status === 'PROCESSED' || record.status === 'IGNORED')) return { status: 'DUPLICATE' };
    const outcome = await this.process(record.id, event);
    return { status: duplicate ? 'DUPLICATE' : outcome === 'IGNORED' ? 'IGNORED' : 'ACCEPTED' };
  }

  /** Reprise (job) d'un événement Stripe `FAILED`/`RECEIVED` depuis le journal des webhooks. */
  async retry(webhookEventId: string): Promise<void> {
    const loaded = await this.records.getWebhookPayload(webhookEventId);
    if (!loaded || loaded.record.provider !== 'stripe') return;
    const raw = loaded.payload as { id?: string; type?: string; created?: number; livemode?: boolean; data?: { object?: Record<string, unknown> } };
    if (!raw?.id || !raw.type || !raw.data?.object) return;
    await this.process(webhookEventId, { id: raw.id, type: raw.type, createdAt: new Date((raw.created ?? 0) * 1000), livemode: !!raw.livemode, object: raw.data.object, redacted: raw });
  }

  private userIdOf(e: VerifiedProviderEvent): string | null {
    const m = meta(e.object);
    const id = str(m.userId) ?? str(e.object.client_reference_id);
    return id && UUID_RE.test(id) ? id : null;
  }

  private async process(webhookEventId: string, event: VerifiedProviderEvent): Promise<'PROCESSED' | 'IGNORED'> {
    try {
      return await this.uow.run(async (scope) => {
        const claimed = await this.records.claimWebhook(scope, webhookEventId);
        if (!claimed) return 'PROCESSED';
        const out = await this.apply(scope, event);
        await this.records.completeWebhook(scope, webhookEventId, out, scope.now);
        return out;
      });
    } catch (err) {
      await this.records.failWebhook(webhookEventId, (err as Error).message.slice(0, 300));
      throw err;
    }
  }

  private async apply(scope: TxScope, e: VerifiedProviderEvent): Promise<'PROCESSED' | 'IGNORED'> {
    const o = e.object;
    const m = meta(o);
    const userId = this.userIdOf(e);
    if (!userId || !(await this.users.exists(userId))) return 'IGNORED';
    switch (e.type) {
      case 'payment_intent.succeeded':
        return this.paymentSucceeded(scope, userId, o, m);
      case 'payment_intent.payment_failed': {
        const pi = str(o.id);
        if (!pi || str(m.purpose) !== 'SEAT') return 'IGNORED';
        await scope.lock.users([userId]);
        await this.journal.append(scope, { key: LedgerKeys.paymentFailed(e.id), kind: 'PAYMENT_FAILED', account: `user:${userId}`, userId, amount: num(o.amount) ?? this.params().seatPriceCents, unit: 'EUR_CENTS', refs: { seatId: str(m.seatId), providerPaymentId: pi } });
        return 'PROCESSED';
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const plus = this.plus();
        const snap = readStripeSubscription(o);
        if (!plus || !snap || str(m.purpose) !== 'PLUS') return 'IGNORED';
        return plus.applyStripeSubscription(scope, userId, snap, e.createdAt, e.type === 'customer.subscription.deleted', e.livemode);
      }
      case 'charge.refunded':
      case 'refund.created':
      case 'refund.updated': {
        const pi = str(o.payment_intent);
        const seatId = str(m.seatId);
        const settled = e.type === 'charge.refunded' ? o.refunded === true : str(o.status) === 'succeeded';
        if (!pi || !seatId || !settled) return 'IGNORED';
        await scope.lock.users([userId]);
        return (await this.settleRefund(scope, { userId, seatId, providerPaymentId: pi, refundId: str(o.id) ?? pi, amountCents: num(o.amount_refunded) ?? num(o.amount) ?? this.params().seatPriceCents })) ? 'PROCESSED' : 'IGNORED';
      }
      default:
        return 'IGNORED';
    }
  }

  private async paymentSucceeded(scope: TxScope, userId: string, o: Record<string, unknown>, m: Record<string, unknown>): Promise<'PROCESSED' | 'IGNORED'> {
    const pi = str(o.id);
    const seatId = str(m.seatId);
    if (!pi || !seatId || str(m.purpose) !== 'SEAT') return 'IGNORED';
    const amount = num(o.amount_received) ?? num(o.amount);
    if (amount === null || amount <= 0 || String(o.currency ?? '').toLowerCase() !== 'eur') return 'IGNORED';
    await scope.lock.users([userId]);
    const { inserted } = await this.journal.append(scope, {
      key: LedgerKeys.paymentSucceeded(pi),
      kind: 'PAYMENT_SUCCEEDED',
      account: `user:${userId}`,
      userId,
      amount,
      unit: 'EUR_CENTS',
      refs: { seatId, providerPaymentId: pi, provider: 'STRIPE' },
    });
    if (!inserted) return 'PROCESSED';
    const outcome = await this.sink().paymentSucceeded(scope, { seatId, userId, paymentRef: pi });
    // Paiement arrivé trop tard (hold échu, place prise, sortie close) : remboursement intégral automatique.
    if (outcome === 'REFUND_REQUIRED') await this.funding.requestCardRefund(scope, { userId, seatId, providerPaymentId: pi, amountCents: amount, cause: 'LATE_PAYMENT' });
    return 'PROCESSED';
  }

  /** Règle un remboursement (job ou webhook) : une seule fois par paiement. */
  async settleRefund(scope: TxScope, i: { userId: string; seatId: string; providerPaymentId: string; refundId: string; amountCents: number }): Promise<boolean> {
    if (!(await this.journal.byKey(scope, LedgerKeys.refundRequested(i.providerPaymentId)))) return false;
    const { inserted } = await this.journal.append(scope, {
      key: LedgerKeys.refundSettled(i.providerPaymentId),
      kind: 'REFUND_SETTLED',
      account: `user:${i.userId}`,
      userId: i.userId,
      amount: -i.amountCents,
      unit: 'EUR_CENTS',
      refs: { seatId: i.seatId, providerPaymentId: i.providerPaymentId, refundId: i.refundId },
    });
    if (inserted) {
      await this.sink().refundSettled(scope, { seatId: i.seatId, userId: i.userId, refundRef: i.refundId });
      // T8 : notification « remboursement effectué » (identifiants seulement).
      await scope.outbox.emit({ topic: 'economy.refund_settled', aggregateType: 'OutingSeat', aggregateId: i.seatId, payload: { seatId: i.seatId, userId: i.userId } });
    }
    return inserted;
  }
}
