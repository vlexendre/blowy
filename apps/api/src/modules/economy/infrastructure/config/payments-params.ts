import { DEFAULT_TUNING, type Tuning } from '@blowy/tuning';
import type { PaymentsParams } from '../../domain/index.js';

/**
 * Valeurs V5.2/V5.3 encore ABSENTES de `@blowy/tuning` (demandées à B dans docs/agents/handoffs/V5-T3.md),
 * lues depuis `tuning.economyV5.<clé>` dès publication. Une seule source ici.
 */
export const PENDING_PAYMENTS_TUNING = {
  /** V5.2 H.25 : « gratuit 1 duo actif ». */
  freeActiveDuos: 1,
  /** V5.3 C.11 : Blowy verse 3 € au lieu pour une place OFFERTE non honorée (place payée : son prix). */
  venueCompensationFreeSeatCents: 300,
} as const;

export function paymentsParamsFromTuning(t: Tuning): PaymentsParams {
  const pending = (t as unknown as { economyV5?: Record<string, unknown> }).economyV5 ?? {};
  const read = (k: keyof typeof PENDING_PAYMENTS_TUNING): number => (typeof pending[k] === 'number' ? (pending[k] as number) : PENDING_PAYMENTS_TUNING[k]);
  return {
    tuningVersion: t.version,
    seatPriceCents: t.pricing.seat.amountCents,
    firstOutingFree: t.pricing.firstOutingFree,
    paymentHoldMinutes: t.outings.paymentHoldMinutes,
    refundCreditValidityDays: t.credits.refundCreditValidityDays,
    plusMonthlyPriceCents: t.plus.monthlyPriceCents,
    plusIncludesAllOutings: t.plus.includesAllOutings,
    plusDuoUnlimited: t.plus.duoUnlimited,
    freeActiveDuos: read('freeActiveDuos'),
    venueCompensationFreeSeatCents: read('venueCompensationFreeSeatCents'),
  };
}

export const defaultPaymentsParams = (): PaymentsParams => paymentsParamsFromTuning(DEFAULT_TUNING);
