/**
 * Phase de la semaine vue par la personne (`GET /v1/outings/week`, spec-v5 §7.2). Jamais une
 * position dans une file : « prioritaire la semaine prochaine » seulement.
 */
import type { OutingRequestStatus, OutingWeekPhase, SeatStatus } from '@blowy/domain';

export function weekPhase(i: {
  neighborhoodLive: boolean;
  paused: boolean;
  now: Date;
  window: { opensAt: Date; closesAt: Date };
  request: { status: OutingRequestStatus } | null;
  seat: { status: SeatStatus } | null;
}): OutingWeekPhase {
  if (i.seat) {
    if (i.seat.status === 'INVITED' || i.seat.status === 'HELD') return 'INVITED';
    if (['CONFIRMED', 'CHECKED_IN'].includes(i.seat.status)) return 'IN_OUTING';
    if (['ATTENDED', 'NO_SHOW'].includes(i.seat.status)) return 'QUOTA_USED';
  }
  if (!i.neighborhoodLive) return 'NOT_LAUNCHED';
  if (i.paused) return 'PAUSED';
  if (i.request?.status === 'UNPLACED') return 'UNPLACED';
  if (i.request?.status === 'PLACED') return 'QUOTA_USED';
  if (i.request?.status === 'OPEN') return i.now >= i.window.closesAt ? 'COMPOSING' : 'REQUEST_OPEN';
  return i.now >= i.window.opensAt && i.now < i.window.closesAt ? 'REQUEST_OPEN' : i.now >= i.window.closesAt ? 'UNPLACED' : 'REQUEST_OPEN';
}
