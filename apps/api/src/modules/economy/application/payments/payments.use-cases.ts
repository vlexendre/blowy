/**
 * Cas d'usage paiements V5 hors webhook : exécution des remboursements (job, hors verrou),
 * compensation lieu (consommateur outbox transactionnel), Blowy+ (checkout), lectures (crédits,
 * produits, droits), port `DuoAllowanceReader`.
 */
import type { EntitlementKey } from '@blowy/domain';
import type { VenueCompensationBasis, VenueCompensationCause } from '@blowy/api-contract';
import type { Clock } from '../../../../shared/application/clock.js';
import type { LoggerPort } from '../../../../shared/application/logger.port.js';
import type { DuoAllowanceReader } from '../../../../shared/application/ports/duo-allowance.port.js';
import type { OutboxConsumer, OutboxEnvelope } from '../../../../shared/application/outbox-consumer.js';
import type { TxScope, UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import { AppError } from '../../../../shared/domain/errors.js';
import { activityPayoutAmount, blowyCancelCompensated, EUR, LedgerKeys, summarizeLots, venueCompensationAmount, venueCompensationCause, type PaymentsParams } from '../../domain/index.js';
import type { EconomyJournal, JournalEntry, PaymentProvider, ReferralFreeStore, SeatDirectory } from './ports.js';
import { activityCentsOf, plusActive, type EconomySeatFunding } from './seat-funding.service.js';
import type { HandleStripeWebhookUseCase } from './stripe-webhook.use-case.js';

type KeysOf = (userId: string, at: Date) => Promise<ReadonlySet<EntitlementKey>>;
const MAX_REFUND_ATTEMPTS = 8;

/** Job `economy.refunds` (1 min) : exécute chez le fournisseur les remboursements demandés, puis les règle. */
export class ProcessRefundsUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly journal: EconomyJournal,
    private readonly provider: PaymentProvider | null,
    private readonly webhook: () => HandleStripeWebhookUseCase,
    private readonly logger: Pick<LoggerPort, 'warn'>,
  ) {}

  async run(limit = 25): Promise<{ settled: number; pending: number; failed: number }> {
    const out = { settled: 0, pending: 0, failed: 0 };
    if (!this.provider) return out;
    for (const r of await this.journal.pendingRefunds(limit)) {
      const pi = String(r.refs.providerPaymentId);
      const seatId = String(r.refs.seatId);
      const failures = await this.journal.byRef(null, 'REFUND_FAILED', 'providerPaymentId', pi);
      if (failures.length >= MAX_REFUND_ATTEMPTS) continue; // file admin (finance) : plus de nouvelle tentative
      try {
        const res = await this.provider.refund({ providerPaymentId: pi, seatId, amountCents: r.amount, idempotencyKey: LedgerKeys.providerRefund(seatId) });
        if (res.status !== 'SUCCEEDED') {
          out.pending++;
          continue; // réglé par le webhook `refund.updated` ou au prochain passage (clé idempotente)
        }
        await this.uow.run(async (scope) => {
          await scope.lock.users([r.userId!]);
          await this.webhook().settleRefund(scope, { userId: r.userId!, seatId, providerPaymentId: pi, refundId: res.refundId, amountCents: r.amount });
        });
        out.settled++;
      } catch (err) {
        out.failed++;
        // Jamais de secret ni de corps fournisseur dans les logs : identifiants internes + code seulement.
        this.logger.warn({ seatId, code: (err as AppError).code ?? 'ERROR', attempt: failures.length + 1 }, 'economy_refund_failed');
        await this.uow.run((scope) =>
          this.journal.append(scope, { key: LedgerKeys.refundAttemptFailed(pi, failures.length + 1), kind: 'REFUND_FAILED', account: r.account, userId: r.userId, amount: r.amount, unit: 'EUR_CENTS', refs: { seatId, providerPaymentId: pi, code: (err as AppError).code ?? 'ERROR' } }),
        );
      }
    }
    return out;
  }
}

/**
 * Compensation lieu (V5.3 C.11) : place non honorée après la confirmation (absence ou annulation après
 * la veille 18 h) → prix de la place reversé au lieu si payée, 3 € versés par Blowy si offerte.
 * Écriture comptable interne (compte `venue:<id>`), une seule par place (clé unique).
 */
export class VenueCompensationConsumer implements OutboxConsumer {
  readonly name = 'economy.venue_compensation';
  // V5.7 (E27, D-081) : la table Duo est à 0 € pour le lieu, sans garantie — aucun sujet `duo.*` ici.
  readonly topics = ['outing.attendance_recorded', 'outing.seat_cancelled', 'outing.venue_cancel_compensation_due'] as const;
  constructor(
    private readonly journal: EconomyJournal,
    private readonly seats: SeatDirectory,
    private readonly params: () => PaymentsParams,
  ) {}

  async handle(scope: TxScope, event: OutboxEnvelope): Promise<void> {
    if (event.topic === 'outing.venue_cancel_compensation_due') return this.blowyCancelled(scope, event);
    const seatId = typeof event.payload.seatId === 'string' ? event.payload.seatId : null;
    if (!seatId) return;
    const seat = await this.seats.seat(seatId);
    if (!seat) return;
    const cause = venueCompensationCause({
      attended: event.topic === 'outing.attendance_recorded' ? event.payload.attended === true : undefined,
      cancelKind: event.topic === 'outing.seat_cancelled' ? String(event.payload.cancelKind ?? '') : null,
      outingStatus: seat.outingStatus,
      cancelledAfterLock: seat.cancelledAfterLock === true,
    });
    const payment = (await this.journal.byRef(scope, 'PAYMENT_SUCCEEDED', 'seatId', seatId))[0] ?? null;
    // V5.10 (jury tour 11) : activité prépayée reversée intégralement au lieu pour chaque place confirmée, honorée ou non
    // (présence, absence, annulation tardive, imprévu) — jamais si la place (donc l'activité) est remboursée.
    const honoredOrNot = event.topic === 'outing.attendance_recorded' || (event.topic === 'outing.seat_cancelled' && ['LATE', 'EMERGENCY'].includes(String(event.payload.cancelKind ?? '')));
    if (honoredOrNot) await this.activityPayout(scope, seat, seatId, payment);
    if (!cause) return;
    // La part « activité » d'un paiement carte n'entre jamais dans la compensation de la place.
    const paid = seat.funding === 'PAID' && payment ? payment.amount - activityCentsOf(payment) : null;
    // V5.6 (E22) : sortie pour raison de sécurité = 3 € HT versés par Blowy (la place est remboursée à la personne).
    const { amountCents, basis, taxBasis } = cause === 'SAFETY' ? { amountCents: this.params().venueCompensationFreeSeatCents, basis: 'SAFETY' as const, taxBasis: 'HT' as const } : venueCompensationAmount(seat.funding, paid, this.params());
    await this.journal.append(scope, {
      key: LedgerKeys.venueCompensation(seatId),
      kind: 'VENUE_COMPENSATION',
      account: `venue:${seat.venueId}`,
      userId: null,
      amount: amountCents,
      unit: 'EUR_CENTS',
      refs: { seatId, outingId: seat.outingId, venueId: seat.venueId, cause, basis, taxBasis, funding: seat.funding, currency: EUR },
    });
  }

  private async activityPayout(scope: TxScope, seat: { outingId: string; venueId: string }, seatId: string, payment: JournalEntry | null): Promise<void> {
    const ttc = activityCentsOf(payment);
    if (!payment || ttc <= 0) return;
    if (await this.journal.byKey(scope, LedgerKeys.refundRequested(String(payment.refs.providerPaymentId)))) return;
    const taxBasis = payment.refs.activityTaxBasis === 'HT' ? ('HT' as const) : ('TTC' as const);
    await this.journal.append(scope, {
      key: LedgerKeys.venueActivityPayout(seatId),
      kind: 'VENUE_ACTIVITY_PAYOUT',
      account: `venue:${seat.venueId}`,
      userId: null,
      amount: activityPayoutAmount(ttc, taxBasis),
      unit: 'EUR_CENTS',
      refs: { seatId, outingId: seat.outingId, venueId: seat.venueId, activityCents: ttc, taxBasis, currency: EUR },
    });
  }

  /**
   * V5.4 (C.12) : Blowy annule une sortie confirmée → 3 € par place réservée (même clé par place que la
   * compensation d'absence : jamais deux écritures pour une place).
   */
  async blowyCancelled(scope: TxScope, event: OutboxEnvelope): Promise<void> {
    const p = event.payload as Partial<VenueCancelCompensationPayload>;
    if (typeof p.outingId !== 'string' || typeof p.venueId !== 'string' || !Array.isArray(p.seatIds)) return;
    if (!blowyCancelCompensated({ wasConfirmed: true, reason: String(event.payload.reason ?? '') })) return;
    const amountCents = this.params().venueCompensationBlowyCancelCents;
    for (const seatId of p.seatIds) {
      if (typeof seatId !== 'string') continue;
      await this.journal.append(scope, {
        key: LedgerKeys.venueCompensation(seatId),
        kind: 'VENUE_COMPENSATION',
        account: `venue:${p.venueId}`,
        userId: null,
        amount: amountCents,
        unit: 'EUR_CENTS',
        refs: { seatId, outingId: p.outingId, venueId: p.venueId, cause: 'BLOWY_CANCELLED', basis: 'BLOWY_CANCELLED', taxBasis: 'HT', currency: EUR },
      });
    }
  }
}

export interface VenueCancelCompensationPayload {
  outingId: string;
  venueId: string;
  /** Places encore réservées (confirmées) au moment où Blowy annule — une écriture par place. */
  seatIds: string[];
}

/** Contre-écriture de la compensation (présence corrigée par le staff, T6) : une seule fois. */
export async function reverseVenueCompensation(journal: EconomyJournal, scope: TxScope, seatId: string): Promise<boolean> {
  const original = await journal.byKey(scope, LedgerKeys.venueCompensation(seatId));
  if (!original) return false;
  const { inserted } = await journal.append(scope, {
    key: LedgerKeys.venueCompensationReversal(seatId),
    kind: 'VENUE_COMPENSATION_REVERSAL',
    account: original.account,
    userId: null,
    amount: -original.amount,
    unit: 'EUR_CENTS',
    refs: { ...original.refs, cause: 'REVERSAL', reversesKey: original.key },
  });
  return inserted;
}

export const venueCompensationView = (e: JournalEntry) => ({
  seatId: String(e.refs.seatId),
  outingId: String(e.refs.outingId),
  venueId: String(e.refs.venueId),
  amountCents: e.amount,
  currency: EUR,
  cause: String(e.refs.cause) as VenueCompensationCause,
  basis: String(e.refs.basis) as VenueCompensationBasis,
  at: e.at.toISOString(),
});

/**
 * `POST /v1/subscriptions/plus/checkout` : V5.3 C.10 — Blowy+ s'achète EN APP (RevenueCat, déjà en
 * place : `POST /v1/purchases/sync` après l'achat store). Ici : démo locale seulement (même chemin de
 * réconciliation) ; sinon 501 `PLUS_VIA_IN_APP_PURCHASE` (le client ouvre l'achat intégré).
 */
export class PlusCheckoutUseCase {
  constructor(
    private readonly billingMode: string,
    private readonly keysOf: KeysOf,
    private readonly localDemoPlus: ((userId: string, commandId: string) => Promise<void>) | null,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, commandId: string): Promise<{ provider: 'LOCAL_DEMO'; clientSecret: string }> {
    if (plusActive(await this.keysOf(userId, this.clock.now()))) throw new AppError('CONFLICT', 'Blowy+ déjà actif', { detailsSafe: { reason: 'PLUS_ALREADY_ACTIVE' } });
    if (this.billingMode !== 'LOCAL_DEMO' || !this.localDemoPlus) throw new AppError('NOT_CONFIGURED', 'Blowy+ s’achète dans l’app', { detailsSafe: { reason: 'PLUS_VIA_IN_APP_PURCHASE' } });
    await this.localDemoPlus(userId, commandId);
    return { provider: 'LOCAL_DEMO', clientSecret: `local_demo_plus_${userId}` };
  }
}

/** Lectures V5 : crédits, droits (sorties, duos), produits. */
export class PaymentsQueries implements DuoAllowanceReader {
  constructor(
    private readonly funding: EconomySeatFunding,
    private readonly seats: SeatDirectory,
    private readonly provider: PaymentProvider | null,
    private readonly keysOf: KeysOf,
    private readonly params: () => PaymentsParams,
    private readonly clock: Clock,
    private readonly referralFree: ReferralFreeStore | null = null,
  ) {}

  /** V5.5 (D-064) : `GET /v1/referrals/me` — prochaine sortie offerte par parrainage, et ce mois-ci. */
  async referralStatus(userId: string) {
    const now = this.clock.now();
    if (!this.referralFree) return { nextOutingFree: false, thisMonthUsed: false };
    const [avail, used] = await Promise.all([this.referralFree.available(null, userId), this.referralFree.usedThisPeriod(userId, await this.referralFree.periodOf(null, userId, now))]);
    return { nextOutingFree: !!avail, thisMonthUsed: used };
  }

  async credits(userId: string) {
    const now = this.clock.now();
    const p = this.params();
    const [lots, usedFree] = await Promise.all([this.funding.lots(null, userId, now), this.seats.usedFreeFirst(userId)]);
    const free = p.firstOutingFree && !usedFree ? [{ kind: 'FREE_FIRST' as const, count: 1 }] : [];
    return { available: [...free, ...summarizeLots(lots).map((l) => ({ kind: l.kind, count: l.count, ...(l.expiresAt ? { expiresAt: l.expiresAt.toISOString() } : {}) }))] };
  }

  async maxActiveDuos(userId: string, at: Date): Promise<number | null> {
    const p = this.params();
    // V5.4 (C.11) : Duo gratuit pour TOUS, plafond anti-spam commun ; Blowy+ sans effet sur les duos.
    void at;
    return p.freeActiveDuos;
  }

  async allowances(userId: string) {
    const now = this.clock.now();
    const p = this.params();
    const [keys, lots, usedFree] = await Promise.all([this.keysOf(userId, now), this.funding.lots(null, userId, now), this.seats.usedFreeFirst(userId)]);
    const active = plusActive(keys);
    return {
      firstOutingFree: p.firstOutingFree && !usedFree,
      plus: { active, includesAllOutings: p.plusIncludesAllOutings, duoUnlimited: false },
      duos: { maxActive: p.freeActiveDuos },
      credits: lots.length,
      provider: this.provider?.kind ?? null,
    };
  }

  productsV5() {
    const p = this.params();
    return {
      seat: { amountCents: p.seatPriceCents, currency: EUR, consumptionIncluded: false as const, firstOutingFree: p.firstOutingFree, taxBasis: 'TTC' as const },
      // V5.4 (C.10–C.11) : abonnement aux sorties via Stripe Billing ; Duo gratuit pour tous (jamais « illimité »).
      plus: { priceLabel: null, includesAllOutings: p.plusIncludesAllOutings, includedOutingsPerMonth: 0, duoUnlimited: false, billing: p.plusBilling, monthlyPriceCents: p.plusMonthlyPriceCents, currency: EUR },
      provider: this.provider?.kind ?? ('LOCAL_DEMO' as const),
      duo: { freeMaxActive: p.freeActiveDuos },
    };
  }
}
