/* eslint-disable @typescript-eslint/no-explicit-any -- doublures minimales */
/**
 * V5.10 (jury tour 11) — activités payantes PRÉPAYÉES avec la place, unitaires (journal en mémoire) :
 *  - paiement = place (si due) + activité ; Blowy+ / 1ʳᵉ offerte couvrent la place, jamais l'activité ;
 *  - Stripe : place couverte → HOLD avec son financement, intention du seul montant de l'activité ;
 *  - remboursement de l'activité une seule fois (place payée : déjà incluse dans le remboursement total) ;
 *  - reversement au lieu par place confirmée honorée ou non, TTC par défaut ou HT selon le régime ; jamais si remboursée ;
 *  - la compensation d'une place payée n'inclut jamais la part « activité ».
 */
import { describe, expect, it } from 'vitest';
import { activityPriceCentsOf } from '@blowy/content';
import type { EntitlementKey } from '@blowy/domain';
import type { TxScope, UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { activityPayoutAmount, type PaymentsParams } from '../domain/index.js';
import { defaultPaymentsParams } from '../infrastructure/config/payments-params.js';
import { VenueCompensationConsumer } from '../application/payments/payments.use-cases.js';
import type { EconomyJournal, JournalDraft, JournalEntry, PaymentProvider, SeatFacts } from '../application/payments/ports.js';
import { EconomySeatFunding } from '../application/payments/seat-funding.service.js';

const NOW = new Date('2026-11-17T11:00:00Z');
const scope = (): TxScope => ({ now: NOW, lock: { users: async () => {}, outings: async () => {} } as any, outbox: { emit: async () => {} } as any });

class MemJournal implements EconomyJournal {
  readonly rows: JournalEntry[] = [];
  async append(_s: TxScope, d: JournalDraft) {
    const found = this.rows.find((r) => r.key === d.key);
    if (found) return { entry: found, inserted: false };
    const entry = { ...d, id: String(this.rows.length + 1), at: NOW };
    this.rows.push(entry);
    return { entry, inserted: true };
  }
  async byKey(_s: TxScope | null, key: string) {
    return this.rows.find((r) => r.key === key) ?? null;
  }
  async forUser(_s: TxScope | null, userId: string, kinds: readonly string[]) {
    return this.rows.filter((r) => r.userId === userId && kinds.includes(r.kind));
  }
  async byRef(_s: TxScope | null, kind: string, ref: string, value: string) {
    return this.rows.filter((r) => r.kind === kind && String(r.refs[ref]) === value);
  }
  async pendingRefunds() {
    return [];
  }
  async forAccount(account: string, kinds: readonly string[]) {
    return this.rows.filter((r) => r.account === account && kinds.includes(r.kind));
  }
  of(kind: string) {
    return this.rows.filter((r) => r.kind === kind);
  }
}

const provider = (immediate: boolean): PaymentProvider & { intents: number[] } => {
  const intents: number[] = [];
  return {
    kind: immediate ? 'LOCAL_DEMO' : 'STRIPE',
    environment: 'test',
    confirmsImmediately: immediate,
    intents,
    async createSeatIntent(i: { seatId: string; amountCents: number }) {
      intents.push(i.amountCents);
      return { providerPaymentId: `pi_${i.seatId}`, clientSecret: `pi_${i.seatId}_secret` };
    },
    async refund() {
      return { status: 'SUCCEEDED', refundId: 're_1' };
    },
  } as any;
};

const params = (): PaymentsParams => ({ ...defaultPaymentsParams(), plusIncludesAllOutings: true });
const uow: UnitOfWork = { run: (fn) => fn(scope()) } as UnitOfWork;
const keys = (plus: boolean) => async () => new Set<EntitlementKey>(plus ? (['PLUS_MONTHLY_BENEFITS'] as EntitlementKey[]) : []);
const ACT = { cents: 3500, taxBasis: 'TTC' as const };
const seatIn = (seatId: string, mode: 'AUTO' | 'PAY' = 'AUTO', extra: Record<string, unknown> = {}) => ({ userId: 'u1', seatId, outingId: 'o1', mode, freeFirstAvailable: false, activity: ACT, ...extra });

describe('V5.10 — prix de l’activité (catalogue, lieu)', () => {
  it('prix du lieu sinon du catalogue ; 0 si l’activité précise ne correspond pas à la sortie', () => {
    expect(activityPriceCentsOf({ detailKey: 'ceramics_workshop', outingActivity: 'WORKSHOP' })).toBe(2500);
    expect(activityPriceCentsOf({ detailKey: 'ceramics_workshop', outingActivity: 'WORKSHOP', venuePriceCents: 4200 })).toBe(4200);
    expect(activityPriceCentsOf({ detailKey: 'ceramics_workshop', outingActivity: 'WORKSHOP', venuePriceCents: 0 })).toBe(0);
    expect(activityPriceCentsOf({ detailKey: 'ceramics_workshop', outingActivity: 'GAMES' })).toBe(0);
    expect(activityPriceCentsOf({ detailKey: 'drinks', outingActivity: 'DRINK_COFFEE' })).toBe(0);
  });
  it('reversement : TTC par défaut, HT selon le régime du lieu', () => {
    expect(activityPayoutAmount(3500, 'TTC')).toBe(3500);
    expect(activityPayoutAmount(3500, 'HT')).toBe(2917);
  });
});

describe('V5.10 — paiement place + activité', () => {
  it('démo locale : place payée → total place + activité, part « activité » journalisée', async () => {
    const j = new MemJournal();
    const f = new EconomySeatFunding(uow, j, provider(true), keys(false), params);
    const d: any = await f.fund(scope(), seatIn('s1', 'PAY'));
    expect(d).toMatchObject({ kind: 'FUNDED', funding: 'PAID', payment: { amountCents: 499 + 3500, activityCents: 3500 } });
    expect(j.of('PAYMENT_SUCCEEDED')[0]).toMatchObject({ amount: 3999, refs: { activityCents: 3500, activityTaxBasis: 'TTC' } });
  });

  it('Blowy+ couvre la place, pas l’activité : seule l’activité est payée', async () => {
    const j = new MemJournal();
    const f = new EconomySeatFunding(uow, j, provider(true), keys(true), params);
    const d: any = await f.fund(scope(), seatIn('s2'));
    expect(d).toMatchObject({ kind: 'FUNDED', funding: 'PLUS_INCLUDED', paymentRef: 'local_demo:s2', payment: { amountCents: 3500, activityCents: 3500 } });
    // Sans activité payante : rien à payer (comportement inchangé).
    expect(await f.fund(scope(), seatIn('s3', 'AUTO', { activity: null }))).toMatchObject({ kind: 'FUNDED', funding: 'PLUS_INCLUDED', payment: null });
  });

  it('Stripe : 1ʳᵉ offerte + activité → HOLD avec le financement acquis ; intention = activité seule ; place payée → total', async () => {
    const j = new MemJournal();
    const p = provider(false);
    const f = new EconomySeatFunding(uow, j, p, keys(false), params);
    const d: any = await f.fund(scope(), seatIn('s4', 'AUTO', { freeFirstAvailable: true }));
    expect(d).toMatchObject({ kind: 'HOLD', funding: 'FREE_FIRST' });
    expect(await f.prepareIntent({ userId: 'u1', seatId: 's4', seatDue: false, activity: ACT })).toMatchObject({ provider: 'STRIPE', amountCents: 3500, activityCents: 3500 });
    // Place HELD qui garde son financement : jamais reconsommé, toujours HOLD.
    expect(await f.fund(scope(), seatIn('s4', 'AUTO', { planned: 'FREE_FIRST' }))).toMatchObject({ kind: 'HOLD', funding: 'FREE_FIRST' });
    expect(await f.fund(scope(), seatIn('s5', 'PAY'))).toMatchObject({ kind: 'HOLD' });
    expect(await f.prepareIntent({ userId: 'u1', seatId: 's5', seatDue: true, activity: ACT })).toMatchObject({ amountCents: 3999, activityCents: 3500 });
    expect(p.intents).toEqual([3500, 3999]);
    expect(j.of('PAYMENT_INTENT').map((e) => e.refs.activityCents)).toEqual([3500, 3500]);
  });

  it('remboursement de l’activité une seule fois ; place payée déjà remboursée en totalité → rien de plus', async () => {
    const j = new MemJournal();
    const f = new EconomySeatFunding(uow, j, provider(true), keys(true), params);
    await f.fund(scope(), seatIn('s6'));
    expect(await f.refundActivity(scope(), { userId: 'u1', seatId: 's6', cause: 'SAFETY_EXIT' })).toBe('REFUNDED');
    expect(await f.refundActivity(scope(), { userId: 'u1', seatId: 's6', cause: 'SAFETY_EXIT' })).toBeNull();
    expect(j.of('REFUND_REQUESTED').map((e) => e.amount)).toEqual([3500]);
    await f.fund(scope(), seatIn('s7', 'PAY'));
    expect(await f.refundCard(scope(), { userId: 'u1', seatId: 's7', paymentRef: null, cause: 'USER_EARLY' })).toBe('REFUNDED');
    expect(await f.refundActivity(scope(), { userId: 'u1', seatId: 's7', cause: 'USER_EARLY' })).toBeNull();
    expect(j.of('REFUND_REQUESTED').map((e) => e.amount)).toEqual([3500, 3999]);
  });
});

describe('V5.10 — reversement de l’activité au lieu', () => {
  const facts = (seatId: string, funding: SeatFacts['funding'], extra: Partial<SeatFacts> = {}): SeatFacts => ({ seatId, userId: 'u1', outingId: 'o1', venueId: 'v1', outingStatus: 'DONE', status: 'NO_SHOW', funding, cancelKind: null, ...extra });
  const setup = async (taxBasis: 'TTC' | 'HT' = 'TTC') => {
    const j = new MemJournal();
    const f = new EconomySeatFunding(uow, j, provider(true), keys(false), params);
    const seats = new Map<string, SeatFacts>();
    const consumer = new VenueCompensationConsumer(j, { seat: async (id: string) => seats.get(id) ?? null, usedFreeFirst: async () => false }, params);
    const ev = (topic: string, payload: Record<string, unknown>) => consumer.handle(scope(), { id: 'e', topic, aggregateType: 'OutingSeat', aggregateId: String(payload.seatId), payload, createdAt: NOW });
    return { j, f, seats, ev, act: { cents: 3500, taxBasis } };
  };

  it('honorée ou non : activité reversée intégralement (TTC) ; la compensation d’une place payée exclut l’activité', async () => {
    const { j, f, seats, ev, act } = await setup();
    await f.fund(scope(), seatIn('a1', 'PAY', { activity: act }));
    await f.fund(scope(), seatIn('a2', 'PAY', { activity: act }));
    seats.set('a1', facts('a1', 'PAID', { status: 'ATTENDED' }));
    seats.set('a2', facts('a2', 'PAID'));
    await ev('outing.attendance_recorded', { seatId: 'a1', attended: true });
    await ev('outing.attendance_recorded', { seatId: 'a2', attended: false });
    await ev('outing.attendance_recorded', { seatId: 'a2', attended: false });
    expect(j.of('VENUE_ACTIVITY_PAYOUT').map((e) => [e.refs.seatId, e.amount, e.refs.taxBasis])).toEqual([
      ['a1', 3500, 'TTC'],
      ['a2', 3500, 'TTC'],
    ]);
    // Absence d'une place payée : 4,99 € TTC → 4,16 € HT, jamais l'activité en plus.
    expect(j.of('VENUE_COMPENSATION').map((e) => e.amount)).toEqual([416]);
  });

  it('annulation tardive / imprévu : reversée ; régime HT ; place remboursée (sécurité) : jamais reversée', async () => {
    const { j, f, seats, ev, act } = await setup('HT');
    await f.fund(scope(), seatIn('b1', 'PAY', { activity: act }));
    await f.fund(scope(), seatIn('b2', 'PAY', { activity: act }));
    seats.set('b1', facts('b1', 'PAID', { status: 'CANCELLED', cancelKind: 'LATE', outingStatus: 'CONFIRMED' }));
    seats.set('b2', facts('b2', 'PAID', { status: 'CANCELLED', cancelKind: 'SAFETY_EXIT', outingStatus: 'CONFIRMED', cancelledAfterLock: true }));
    await ev('outing.seat_cancelled', { seatId: 'b1', cancelKind: 'LATE' });
    await f.refundCard(scope(), { userId: 'u1', seatId: 'b2', paymentRef: null, cause: 'SAFETY_EXIT' });
    await ev('outing.seat_cancelled', { seatId: 'b2', cancelKind: 'SAFETY_EXIT' });
    expect(j.of('VENUE_ACTIVITY_PAYOUT').map((e) => [e.refs.seatId, e.amount, e.refs.taxBasis])).toEqual([['b1', 2917, 'HT']]);
  });
});
