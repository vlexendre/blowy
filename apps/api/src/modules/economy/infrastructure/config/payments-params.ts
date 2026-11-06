import { DEFAULT_TUNING, type Tuning } from '@blowy/tuning';
import type { PaymentsParams } from '../../domain/index.js';

export function paymentsParamsFromTuning(t: Tuning): PaymentsParams {
  return {
    tuningVersion: t.version,
    seatPriceCents: t.pricing.seat.amountCents,
    firstOutingFree: t.pricing.firstOutingFree,
    paymentHoldMinutes: t.outings.paymentHoldMinutes,
    refundCreditValidityDays: t.credits.refundCreditValidityDays,
    plusMonthlyPriceCents: t.plus.monthlyPriceCents,
    plusIncludesAllOutings: t.plus.includesAllOutings,
    plusDuoUnlimited: t.plus.duoUnlimited,
    // tuning-2026.12.3 (B, publié par l'alignement V5) : plus de valeurs en attente côté API.
    freeActiveDuos: t.duo.maxActiveFree,
    venueCompensationFreeSeatCents: t.venues.compensationUnpaidSeatCents,
  };
}

export const defaultPaymentsParams = (): PaymentsParams => paymentsParamsFromTuning(DEFAULT_TUNING);
