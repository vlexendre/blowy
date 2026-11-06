/**
 * Implémentation économie du port `SeatFundingPort` de `outings` (T3) :
 * 1ʳᵉ sortie offerte → Blowy+ (toutes les sorties incluses) → crédit (lot consommé une seule fois,
 * clé unique) → paiement. Paiement Stripe : place HELD dans la transaction, intention créée après
 * commit (`prepareIntent`, idempotente `seat:<seatId>` côté fournisseur), confirmation par webhook.
 * LOCAL_DEMO (hors production) : confirmation immédiate étiquetée, sans débit réel.
 * Remboursements (§6.4) : carte → demande journalisée, exécutée par le job `economy.refunds` hors
 * verrou ; ancien lot de crédit consommé → rendu (déprécié, D-042). Une place ne produit qu'un remboursement (clés uniques).
 */
import type { EntitlementKey, SeatFunding } from '@blowy/domain';
import type { TxScope, UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import type { FundingDecision, SeatFundingPort, SeatPaymentView, SeatRefundCause } from '../../../outings/application/ports/seat-funding.port.js';
import { availableLots, chooseFunding, EUR, LedgerKeys, refundOutcome, type CreditMovement, type PaymentsParams } from '../../domain/index.js';
import { providerUnavailable } from '../../domain/errors.js';
import type { EconomyJournal, JournalEntry, PaymentProvider } from './ports.js';

const DAY = 86_400_000;
type KeysOf = (userId: string, at: Date, scope?: TxScope) => Promise<ReadonlySet<EntitlementKey>>;

export const plusActive = (keys: ReadonlySet<EntitlementKey>) => keys.has('PLUS_MONTHLY_BENEFITS');

/** Mouvements de crédit d'un utilisateur, depuis le journal. */
export function creditMovements(entries: readonly JournalEntry[]): CreditMovement[] {
  return entries.map((e) => ({
    kind: e.kind as CreditMovement['kind'],
    lotKey: String(e.refs.lotKey),
    at: e.at,
    ...(e.kind === 'CREDIT_GRANT' ? { creditKind: e.refs.creditKind as 'REFUND_CREDIT', expiresAt: e.refs.expiresAt ? new Date(String(e.refs.expiresAt)) : null } : {}),
  }));
}

export class EconomySeatFunding implements SeatFundingPort {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly journal: EconomyJournal,
    private readonly provider: PaymentProvider | null,
    private readonly keysOf: KeysOf,
    private readonly params: () => PaymentsParams,
  ) {}

  async lots(scope: TxScope | null, userId: string, now: Date) {
    return availableLots(creditMovements(await this.journal.forUser(scope, userId, ['CREDIT_GRANT', 'CREDIT_CONSUME', 'CREDIT_REVERSAL'])), now);
  }

  async fund(scope: TxScope, i: { userId: string; seatId: string; outingId: string; mode: 'AUTO' | 'PAY'; freeFirstAvailable: boolean }): Promise<FundingDecision> {
    const p = this.params();
    const keys = await this.keysOf(i.userId, scope.now, scope);
    const lots = i.mode === 'AUTO' ? await this.lots(scope, i.userId, scope.now) : [];
    const choice = chooseFunding({ mode: i.mode, freeFirstAvailable: i.freeFirstAvailable, plusActive: plusActive(keys), plusIncludesAllOutings: p.plusIncludesAllOutings, lots });
    if (choice.kind === 'FREE_FIRST' || choice.kind === 'PLUS_INCLUDED') return { kind: 'FUNDED', funding: choice.kind, paymentRef: null, creditRef: null, payment: null };
    if (choice.kind === 'CREDIT') {
      // Verrou users tenu par l'appelant ; la clé unique par lot interdit toute double consommation.
      for (const lot of lots) {
        const { inserted } = await this.journal.append(scope, {
          key: LedgerKeys.creditConsume(lot.lotKey),
          kind: 'CREDIT_CONSUME',
          account: `user:${i.userId}`,
          userId: i.userId,
          amount: -1,
          unit: 'CREDIT',
          refs: { lotKey: lot.lotKey, creditKind: lot.kind, seatId: i.seatId, outingId: i.outingId },
        });
        if (inserted) return { kind: 'FUNDED', funding: 'CREDIT', paymentRef: null, creditRef: lot.lotKey, payment: null };
      }
    }
    if (!this.provider) return { kind: 'UNAVAILABLE' };
    if (this.provider.confirmsImmediately) {
      const ref = `local_demo:${i.seatId}`;
      await this.journal.append(scope, {
        key: LedgerKeys.paymentSucceeded(ref),
        kind: 'PAYMENT_SUCCEEDED',
        account: `user:${i.userId}`,
        userId: i.userId,
        amount: p.seatPriceCents,
        unit: 'EUR_CENTS',
        refs: { seatId: i.seatId, outingId: i.outingId, providerPaymentId: ref, provider: this.provider.kind, environment: this.provider.environment },
      });
      return { kind: 'FUNDED', funding: 'PAID', paymentRef: ref, creditRef: null, payment: { provider: 'LOCAL_DEMO', clientSecret: `local_demo_${i.seatId}`, amountCents: p.seatPriceCents, currency: EUR } };
    }
    return { kind: 'HOLD', holdExpiresAt: new Date(scope.now.getTime() + p.paymentHoldMinutes * 60_000) };
  }

  /** Après commit (hors verrou) : intention de paiement idempotente côté fournisseur, journalisée une fois. */
  async prepareIntent(i: { userId: string; seatId: string }): Promise<SeatPaymentView> {
    if (!this.provider || this.provider.confirmsImmediately) throw providerUnavailable('payments');
    const p = this.params();
    const intent = await this.provider.createSeatIntent({ seatId: i.seatId, userId: i.userId, amountCents: p.seatPriceCents, currency: EUR, idempotencyKey: LedgerKeys.providerSeatIntent(i.seatId) });
    await this.uow.run((scope) =>
      this.journal.append(scope, {
        key: LedgerKeys.paymentIntent(i.seatId),
        kind: 'PAYMENT_INTENT',
        account: `user:${i.userId}`,
        userId: i.userId,
        amount: p.seatPriceCents,
        unit: 'EUR_CENTS',
        refs: { seatId: i.seatId, providerPaymentId: intent.providerPaymentId, provider: this.provider!.kind, environment: this.provider!.environment },
      }),
    );
    return { provider: 'STRIPE', clientSecret: intent.clientSecret, amountCents: p.seatPriceCents, currency: EUR };
  }

  async refundCard(scope: TxScope, i: { userId: string; seatId: string; paymentRef: string | null; cause?: SeatRefundCause }): Promise<'REFUNDED' | 'PENDING' | 'RECREDITED'> {
    // D-042 : une place payée est toujours remboursée sur la carte (plus de crédit 90 j).
    const cause = i.cause ?? 'OUTING_CANCELLED';
    const paid = (await this.journal.byRef(scope, 'PAYMENT_SUCCEEDED', 'seatId', i.seatId))[0] ?? null;
    return this.requestCardRefund(scope, { userId: i.userId, seatId: i.seatId, providerPaymentId: paid ? String(paid.refs.providerPaymentId) : (i.paymentRef ?? `unknown:${i.seatId}`), amountCents: paid?.amount ?? this.params().seatPriceCents, cause });
  }

  /** Demande de remboursement carte (journal) ; LOCAL_DEMO : réglée immédiatement. */
  async requestCardRefund(scope: TxScope, i: { userId: string; seatId: string; providerPaymentId: string; amountCents: number; cause: string }): Promise<'REFUNDED' | 'PENDING'> {
    const local = i.providerPaymentId.startsWith('local_demo:');
    await this.journal.append(scope, {
      key: LedgerKeys.refundRequested(i.providerPaymentId),
      kind: 'REFUND_REQUESTED',
      account: `user:${i.userId}`,
      userId: i.userId,
      amount: i.amountCents,
      unit: 'EUR_CENTS',
      refs: { seatId: i.seatId, providerPaymentId: i.providerPaymentId, cause: i.cause },
    });
    if (!local) return 'PENDING';
    const settled = await this.journal.append(scope, {
      key: LedgerKeys.refundSettled(i.providerPaymentId),
      kind: 'REFUND_SETTLED',
      account: `user:${i.userId}`,
      userId: i.userId,
      amount: -i.amountCents,
      unit: 'EUR_CENTS',
      refs: { seatId: i.seatId, providerPaymentId: i.providerPaymentId, refundId: `local_demo_refund:${i.seatId}` },
    });
    // T8 : « Ton remboursement est effectué » (consommé par notifications ; jamais de montant ni de carte).
    if (settled.inserted) await scope.outbox.emit({ topic: 'economy.refund_settled', aggregateType: 'OutingSeat', aggregateId: i.seatId, payload: { seatId: i.seatId, userId: i.userId } });
    return 'REFUNDED';
  }

  async refundCredit(scope: TxScope, i: { userId: string; seatId: string; funding: SeatFunding; cause: SeatRefundCause }): Promise<'RECREDITED'> {
    const keys = await this.keysOf(i.userId, scope.now, scope);
    if (refundOutcome(i.funding, i.cause, { plusActive: plusActive(keys) }) === 'REFUND_CREDIT') await this.grantRefundCredit(scope, i.userId, i.seatId);
    return 'RECREDITED';
  }

  private async grantRefundCredit(scope: TxScope, userId: string, seatId: string) {
    const lotKey = LedgerKeys.creditGrant('refund', seatId);
    await this.journal.append(scope, {
      key: lotKey,
      kind: 'CREDIT_GRANT',
      account: `user:${userId}`,
      userId,
      amount: 1,
      unit: 'CREDIT',
      refs: { lotKey, creditKind: 'REFUND_CREDIT', seatId, expiresAt: new Date(scope.now.getTime() + this.params().refundCreditValidityDays * DAY).toISOString() },
    });
  }
}
