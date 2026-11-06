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
import type { ActivityCharge, FundingDecision, SeatFundingPort, SeatPaymentView, SeatRefundCause } from '../../../outings/application/ports/seat-funding.port.js';
import { availableLots, chooseFunding, EUR, LedgerKeys, refundOutcome, type CreditMovement, type PaymentsParams } from '../../domain/index.js';
import { providerUnavailable } from '../../domain/errors.js';
import type { EconomyJournal, JournalEntry, PaymentProvider, ReferralFreeStore } from './ports.js';

const DAY = 86_400_000;
type KeysOf = (userId: string, at: Date, scope?: TxScope) => Promise<ReadonlySet<EntitlementKey>>;

export const plusActive = (keys: ReadonlySet<EntitlementKey>) => keys.has('PLUS_MONTHLY_BENEFITS');

/** V5.10 : part « activité » d'un paiement (références journalisées : montant TTC et régime de reversement au lieu). */
export const activityRefs = (act: ActivityCharge | null | undefined): Record<string, number | string> => (act && act.cents > 0 ? { activityCents: act.cents, activityTaxBasis: act.taxBasis } : {});
export const activityCentsOf = (e: Pick<JournalEntry, 'refs'> | null | undefined): number => {
  const v = Number(e?.refs.activityCents ?? 0);
  return Number.isInteger(v) && v > 0 ? v : 0;
};

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
    /** V5.5 (D-064) : sorties offertes par parrainage ; absent = aucune (tests). */
    private readonly referral: ReferralFreeStore | null = null,
  ) {}

  async lots(scope: TxScope | null, userId: string, now: Date) {
    return availableLots(creditMovements(await this.journal.forUser(scope, userId, ['CREDIT_GRANT', 'CREDIT_CONSUME', 'CREDIT_REVERSAL'])), now);
  }

  async fund(scope: TxScope, i: { userId: string; seatId: string; outingId: string; mode: 'AUTO' | 'PAY'; freeFirstAvailable: boolean; activity?: ActivityCharge | null; planned?: SeatFunding | null }): Promise<FundingDecision> {
    const p = this.params();
    // V5.10 (jury tour 11) : activité payante prépayée avec la place — jamais couverte par Blowy+ ni par une place offerte.
    const act = i.activity && i.activity.cents > 0 ? i.activity : null;
    const hold = (): Date => new Date(scope.now.getTime() + p.paymentHoldMinutes * 60_000);
    // Place HELD dont le financement est déjà acquis (offerte, Blowy+, parrainage) : seule l'activité reste due — rien n'est reconsommé.
    if (i.planned && i.planned !== 'PAID' && act) return this.activityOnly(scope, i, i.planned, null, act, hold);
    const covered = await this.coveredFunding(scope, i, p);
    if (covered) return act ? this.activityOnly(scope, i, covered.funding, covered.creditRef, act, hold) : { kind: 'FUNDED', funding: covered.funding, paymentRef: null, creditRef: covered.creditRef, payment: null };
    if (!this.provider) return { kind: 'UNAVAILABLE' };
    const total = p.seatPriceCents + (act?.cents ?? 0);
    if (this.provider.confirmsImmediately) {
      const ref = await this.recordLocalPayment(scope, i, total, act);
      return { kind: 'FUNDED', funding: 'PAID', paymentRef: ref, creditRef: null, payment: { provider: 'LOCAL_DEMO', clientSecret: `local_demo_${i.seatId}`, amountCents: total, currency: EUR, ...(act ? { activityCents: act.cents } : {}) } };
    }
    return { kind: 'HOLD', holdExpiresAt: hold() };
  }

  /** Place couverte sans carte (1ʳᵉ offerte, parrainage, Blowy+, ancien crédit) ; null = la place est à payer. */
  private async coveredFunding(scope: TxScope, i: { userId: string; seatId: string; outingId: string; mode: 'AUTO' | 'PAY'; freeFirstAvailable: boolean }, p: PaymentsParams): Promise<{ funding: SeatFunding; creditRef: string | null } | null> {
    const keys = await this.keysOf(i.userId, scope.now, scope);
    const lots = i.mode === 'AUTO' ? await this.lots(scope, i.userId, scope.now) : [];
    const reward = i.mode === 'AUTO' && !i.freeFirstAvailable && this.referral ? await this.referral.available(scope, i.userId) : null;
    const choice = chooseFunding({ mode: i.mode, freeFirstAvailable: i.freeFirstAvailable, plusActive: plusActive(keys), plusIncludesAllOutings: p.plusIncludesAllOutings, lots, referralFreeAvailable: !!reward });
    if (choice.kind === 'FREE_FIRST' || choice.kind === 'PLUS_INCLUDED') return { funding: choice.kind, creditRef: null };
    // V5.5 (D-064) : verrou users tenu par l'appelant ; la place consomme la récompense une seule fois (clé unique).
    if (choice.kind === 'REFERRAL_FREE' && reward && (await this.referral!.consume(scope, reward.id, i.seatId))) return { funding: 'REFERRAL_FREE', creditRef: null };
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
        if (inserted) return { funding: 'CREDIT', creditRef: lot.lotKey };
      }
    }
    return null;
  }

  /**
   * V5.10 : place couverte, activité à payer par carte. LOCAL_DEMO : paiement de l'activité seule journalisé, place
   * confirmée avec son financement ; Stripe : place HELD avec le financement acquis (le webhook la confirme).
   * Sans fournisseur : indisponible (l'appelant lève → transaction annulée, rien n'est consommé).
   */
  private async activityOnly(scope: TxScope, i: { userId: string; seatId: string; outingId: string }, funding: SeatFunding, creditRef: string | null, act: ActivityCharge, hold: () => Date): Promise<FundingDecision> {
    if (!this.provider) return { kind: 'UNAVAILABLE' };
    if (!this.provider.confirmsImmediately) return { kind: 'HOLD', holdExpiresAt: hold(), funding, creditRef };
    const ref = await this.recordLocalPayment(scope, i, act.cents, act);
    return { kind: 'FUNDED', funding, paymentRef: ref, creditRef, payment: { provider: 'LOCAL_DEMO', clientSecret: `local_demo_${i.seatId}`, amountCents: act.cents, currency: EUR, activityCents: act.cents } };
  }

  private async recordLocalPayment(scope: TxScope, i: { userId: string; seatId: string; outingId: string }, amount: number, act: ActivityCharge | null): Promise<string> {
    const ref = `local_demo:${i.seatId}`;
    await this.journal.append(scope, {
      key: LedgerKeys.paymentSucceeded(ref),
      kind: 'PAYMENT_SUCCEEDED',
      account: `user:${i.userId}`,
      userId: i.userId,
      amount,
      unit: 'EUR_CENTS',
      refs: { seatId: i.seatId, outingId: i.outingId, providerPaymentId: ref, provider: this.provider!.kind, environment: this.provider!.environment, ...activityRefs(act) },
    });
    return ref;
  }

  /** Après commit (hors verrou) : intention de paiement idempotente côté fournisseur, journalisée une fois. */
  async prepareIntent(i: { userId: string; seatId: string; seatDue?: boolean; activity?: ActivityCharge | null }): Promise<SeatPaymentView> {
    if (!this.provider || this.provider.confirmsImmediately) throw providerUnavailable('payments');
    const p = this.params();
    const act = i.activity && i.activity.cents > 0 ? i.activity : null;
    // V5.10 : total = place (si due) + activité (TTC) ; la répartition est journalisée avec l'intention.
    const amountCents = (i.seatDue === false ? 0 : p.seatPriceCents) + (act?.cents ?? 0);
    if (amountCents <= 0) throw providerUnavailable('payments');
    const intent = await this.provider.createSeatIntent({ seatId: i.seatId, userId: i.userId, amountCents, currency: EUR, idempotencyKey: LedgerKeys.providerSeatIntent(i.seatId) });
    await this.uow.run((scope) =>
      this.journal.append(scope, {
        key: LedgerKeys.paymentIntent(i.seatId),
        kind: 'PAYMENT_INTENT',
        account: `user:${i.userId}`,
        userId: i.userId,
        amount: amountCents,
        unit: 'EUR_CENTS',
        refs: { seatId: i.seatId, providerPaymentId: intent.providerPaymentId, provider: this.provider!.kind, environment: this.provider!.environment, ...activityRefs(act) },
      }),
    );
    return { provider: 'STRIPE', clientSecret: intent.clientSecret, amountCents, currency: EUR, ...(act ? { activityCents: act.cents } : {}) };
  }

  /**
   * V5.10 : rembourse l'activité prépayée d'une place remboursable. Une place PAYÉE est déjà remboursée en totalité
   * (place + activité) par `refundCard` : la clé unique du remboursement empêche tout doublon.
   */
  async refundActivity(scope: TxScope, i: { userId: string; seatId: string; cause: SeatRefundCause }): Promise<'REFUNDED' | 'PENDING' | null> {
    const paid = (await this.journal.byRef(scope, 'PAYMENT_SUCCEEDED', 'seatId', i.seatId))[0] ?? null;
    if (!paid || activityCentsOf(paid) <= 0) return null;
    const providerPaymentId = String(paid.refs.providerPaymentId);
    if (await this.journal.byKey(scope, LedgerKeys.refundRequested(providerPaymentId))) return null;
    return this.requestCardRefund(scope, { userId: i.userId, seatId: i.seatId, providerPaymentId, amountCents: paid.amount, cause: i.cause });
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
    // V5.5 (D-064) : une sortie offerte par parrainage « reste offerte » (la récompense redevient disponible).
    if (i.funding === 'REFERRAL_FREE') {
      await this.referral?.release(scope, i.seatId);
      return 'RECREDITED';
    }
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
