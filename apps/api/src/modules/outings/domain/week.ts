/**
 * Phase de la semaine vue par la personne (`GET /v1/outings/week`, spec-v5 §7.2). Jamais une
 * position dans une file : « prioritaire la semaine prochaine » seulement.
 */
import type { OutingRequestStatus, OutingWeekPhase, SeatStatus } from '@blowy/domain';
import { mondayOfWeek } from '@blowy/pet-engine';

/**
 * V5.4 (B.9) : semaine off — cochée à la main, ou « une semaine sur deux » (garde alternée) à partir de
 * `everyOtherFrom` (cette semaine-là est off, puis une sur deux). Avant `everyOtherFrom` : rien.
 */
export function isWeekOff(weekKey: string, weeksOff: readonly string[], everyOtherFrom: string | null): boolean {
  if (weeksOff.includes(weekKey)) return true;
  if (!everyOtherFrom) return false;
  const delta = mondayOfWeek(weekKey) - mondayOfWeek(everyOtherFrom);
  return delta >= 0 && (delta / 7) % 2 === 0;
}

/**
 * V5.6 (B.13) : « un week-end sur deux » à partir de `everyOtherFrom` (le week-end de cette semaine-là est off,
 * puis un sur deux) — seuls les créneaux des jours `weekendIsoWeekdays` (ven., sam., dim.) sont retirés.
 */
export function isWeekendOff(weekKey: string, everyOtherFrom: string | null | undefined): boolean {
  if (!everyOtherFrom) return false;
  const delta = mondayOfWeek(weekKey) - mondayOfWeek(everyOtherFrom);
  return delta >= 0 && (delta / 7) % 2 === 0;
}

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
