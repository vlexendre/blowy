/**
 * Cas d'usage paiements V5 hors webhook : exécution des remboursements (job, hors verrou),
 * compensation lieu (consommateur outbox transactionnel), Blowy+ (checkout), lectures (crédits,
 * produits, droits), port `DuoAllowanceReader`.
 */
import type { EntitlementKey } from '@blowy/domain';
import type { Clock } from '../../../../shared/application/clock.js';
import type { LoggerPort } from '../../../../shared/application/logger.port.js';
import type { DuoAllowanceReader } from '../../../../shared/application/ports/duo-allowance.port.js';
import type { OutboxConsumer, OutboxEnvelope } from '../../../../shared/application/outbox-consumer.js';
import type { TxScope, UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import { AppError } from '../../../../shared/domain/errors.js';
import { EUR, LedgerKeys, summarizeLots, venueCompensationAmount, venueCompensationCause, type PaymentsParams } from '../../domain/index.js';
import type { EconomyJournal, JournalEntry, PaymentProvider, SeatDirectory } from './ports.js';
import { plusActive, type EconomySeatFunding } from './seat-funding.service.js';
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
  readonly topics = ['outing.attendance_recorded', 'outing.seat_cancelled'] as const;
  constructor(
    private readonly journal: EconomyJournal,
    private readonly seats: SeatDirectory,
    private readonly params: () => PaymentsParams,
  ) {}

  async handle(scope: TxScope, event: OutboxEnvelope): Promise<void> {
    const seatId = typeof event.payload.seatId === 'string' ? event.payload.seatId : null;
    if (!seatId) return;
    const seat = await this.seats.seat(seatId);
    if (!seat) return;
    const cause = venueCompensationCause({
      attended: event.topic === 'outing.attendance_recorded' ? event.payload.attended === true : undefined,
      cancelKind: event.topic === 'outing.seat_cancelled' ? String(event.payload.cancelKind ?? '') : null,
      outingStatus: seat.outingStatus,
    });
    if (!cause) return;
    const paid = seat.funding === 'PAID' ? ((await this.journal.byRef(scope, 'PAYMENT_SUCCEEDED', 'seatId', seatId))[0]?.amount ?? null) : null;
    const { amountCents, basis } = venueCompensationAmount(seat.funding, paid, this.params());
    await this.journal.append(scope, {
      key: LedgerKeys.venueCompensation(seatId),
      kind: 'VENUE_COMPENSATION',
      account: `venue:${seat.venueId}`,
      userId: null,
      amount: amountCents,
      unit: 'EUR_CENTS',
      refs: { seatId, outingId: seat.outingId, venueId: seat.venueId, cause, basis, funding: seat.funding, currency: EUR },
    });
  }
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
  cause: String(e.refs.cause) as 'NO_SHOW' | 'LATE_CANCEL' | 'REVERSAL',
  basis: String(e.refs.basis) as 'SEAT_PRICE' | 'FREE_SEAT',
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
  ) {}

  async credits(userId: string) {
    const now = this.clock.now();
    const p = this.params();
    const [lots, usedFree] = await Promise.all([this.funding.lots(null, userId, now), this.seats.usedFreeFirst(userId)]);
    const free = p.firstOutingFree && !usedFree ? [{ kind: 'FREE_FIRST' as const, count: 1 }] : [];
    return { available: [...free, ...summarizeLots(lots).map((l) => ({ kind: l.kind, count: l.count, ...(l.expiresAt ? { expiresAt: l.expiresAt.toISOString() } : {}) }))] };
  }

  async maxActiveDuos(userId: string, at: Date): Promise<number | null> {
    const p = this.params();
    return p.plusDuoUnlimited && plusActive(await this.keysOf(userId, at)) ? null : p.freeActiveDuos;
  }

  async allowances(userId: string) {
    const now = this.clock.now();
    const p = this.params();
    const [keys, lots, usedFree] = await Promise.all([this.keysOf(userId, now), this.funding.lots(null, userId, now), this.seats.usedFreeFirst(userId)]);
    const active = plusActive(keys);
    return {
      firstOutingFree: p.firstOutingFree && !usedFree,
      plus: { active, includesAllOutings: p.plusIncludesAllOutings, duoUnlimited: p.plusDuoUnlimited },
      duos: { maxActive: p.plusDuoUnlimited && active ? null : p.freeActiveDuos },
      credits: lots.length,
      provider: this.provider?.kind ?? null,
    };
  }

  productsV5() {
    const p = this.params();
    return {
      seat: { amountCents: p.seatPriceCents, currency: EUR, consumptionIncluded: false as const, firstOutingFree: p.firstOutingFree },
      plus: { priceLabel: null, includesAllOutings: p.plusIncludesAllOutings, includedOutingsPerMonth: 0, duoUnlimited: p.plusDuoUnlimited, monthlyPriceCents: p.plusMonthlyPriceCents, currency: EUR },
      provider: this.provider?.kind ?? ('LOCAL_DEMO' as const),
      duo: { freeMaxActive: p.freeActiveDuos },
    };
  }
}
