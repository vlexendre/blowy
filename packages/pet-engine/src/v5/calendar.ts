/**
 * Calendrier V5 (spec-v5 §1, §2.4–2.5, D-012) : semaine ISO du quartier et instants figés d'une
 * sortie, calculés en heure murale du fuseau IANA du quartier (changements d'heure compris).
 * Pur : aucune lecture d'horloge ; toutes les valeurs viennent de `@blowy/tuning`.
 */
import { HOUR_MS, MINUTE_MS, formatWeekKey, type WeekKey } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import { civilFromDays, daysFromCivil, localParts, wallToUtc } from '../time/index.js';

/** Jour ISO (1 = lundi … 7 = dimanche) d'un numéro de jour (jours depuis 1970-01-01, un jeudi). */
export const isoWeekdayOfDay = (day: number): number => ((((day + 3) % 7) + 7) % 7) + 1;

/** Semaine ISO `YYYY-Www` contenant l'instant `ms` dans le fuseau `tz`. */
export function weekKeyOf(ms: number, tz: string): WeekKey {
  const day = localParts(ms, tz).day;
  const thursday = day - (isoWeekdayOfDay(day) - 1) + 3;
  const isoYear = civilFromDays(thursday).y;
  return formatWeekKey(isoYear, Math.floor((thursday - daysFromCivil(isoYear, 1, 1)) / 7) + 1);
}

/** Numéro de jour du lundi d'une semaine ISO. */
export function mondayOfWeek(weekKey: WeekKey): number {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!m) throw new Error(`weekKey invalide : ${weekKey}`);
  const jan4 = daysFromCivil(Number(m[1]), 1, 4);
  return jan4 - (isoWeekdayOfDay(jan4) - 1) + 7 * (Number(m[2]) - 1);
}

/**
 * V5.5 (D-053) : instant de composition d'un jour de créneau = J − `composeDaysBefore` à `composeHourLocal` h
 * (heure de la ville). `day` = numéro de jour local du créneau.
 */
export const composeAtOfDay = (day: number, tz: string, t: Tuning): number => wallToUtc(day - t.outings.cycle.composeDaysBefore, t.outings.cycle.composeHourLocal * 60, tz);

/** Instant de composition du créneau qui commence à `startsAtMs`. */
export const composeAtOf = (startsAtMs: number, tz: string, t: Tuning): number => composeAtOfDay(localParts(startsAtMs, tz).day, tz, t);

/**
 * Fenêtre de demande d'une semaine (V5.5, D-053) : ouverture le `requestOpensIsoWeekday` à `requestOpensHourLocal` h
 * de la semaine W − `requestOpensWeeksBefore` (vendredi 21 h de W−1) ; fermeture à la composition du DERNIER
 * jour de créneau de la semaine (dimanche → jeudi 21 h). Un créneau n'est demandable que jusqu'à sa propre
 * composition (`composeAtOf`).
 */
export function requestWindow(weekKey: WeekKey, tz: string, t: Tuning): { opensAtMs: number; closesAtMs: number } {
  const c = t.outings.cycle;
  const monday = mondayOfWeek(weekKey);
  const lastDay = Math.max(...c.slotIsoWeekdays);
  return {
    opensAtMs: wallToUtc(monday - 7 * c.requestOpensWeeksBefore + c.requestOpensIsoWeekday - 1, c.requestOpensHourLocal * 60, tz),
    closesAtMs: composeAtOfDay(monday + lastDay - 1, tz, t),
  };
}

export interface OutingInstants {
  startsAtMs: number;
  endsAtMs: number;
  acceptDeadlineMs: number;
  lockAtMs: number;
  photoRevealAtMs: number;
  checkinOpensAtMs: number;
  checkinClosesAtMs: number;
  votesCloseAtMs: number;
}

/**
 * Instants d'une sortie, figés à sa création (§2.5) :
 * lockAt = veille à `lockHourLocal` ; photoRevealAt = lockAt si `photoRevealAtLock` (V5.1 E.16 : visages
 * révélés avec le lieu à la confirmation), sinon min(jour J à `photoRevealHourLocal`, startsAt − 3 h) ;
 * check-in −30/+90 min ; votes `windowHours` après la fermeture du check-in ;
 * acceptDeadline = composition + `inviteTtlHours`, jamais après le verrouillage.
 */
export function outingInstants(i: { startsAtMs: number; composedAtMs: number; tz: string; tuning: Tuning }): OutingInstants {
  const o = i.tuning.outings;
  const c = o.cycle;
  const day = localParts(i.startsAtMs, i.tz).day;
  const lockAtMs = wallToUtc(day - 1, c.lockHourLocal * 60, i.tz);
  const checkinClosesAtMs = i.startsAtMs + c.checkinClosesAfterMinutes * MINUTE_MS;
  return {
    startsAtMs: i.startsAtMs,
    endsAtMs: i.startsAtMs + o.durationMinutes * MINUTE_MS,
    acceptDeadlineMs: Math.min(i.composedAtMs + c.inviteTtlHours * HOUR_MS, lockAtMs),
    lockAtMs,
    photoRevealAtMs: c.photoRevealAtLock ? lockAtMs : Math.min(wallToUtc(day, c.photoRevealHourLocal * 60, i.tz), i.startsAtMs - c.photoRevealMinBeforeStartHours * HOUR_MS),
    checkinOpensAtMs: i.startsAtMs - c.checkinOpensBeforeMinutes * MINUTE_MS,
    checkinClosesAtMs,
    votesCloseAtMs: checkinClosesAtMs + i.tuning.votes.windowHours * HOUR_MS,
  };
}

/** Échéance d'une invitation de backfill : min(now + 12 h, lockAt) (§4.6). */
export const backfillAcceptDeadline = (nowMs: number, lockAtMs: number, t: Tuning): number => Math.min(nowMs + t.outings.backfillInviteTtlHours * HOUR_MS, lockAtMs);

/**
 * Annulation par l'utilisateur (V5.1 E.16) : `EARLY` avant le verrouillage (recrédit) ; `LATE` à
 * partir du verrouillage = comptée comme absence, sans remboursement (hors motif sécurité, traité à part).
 */
export const cancelKindAt = (nowMs: number, lockAtMs: number): 'EARLY' | 'LATE' => (nowMs < lockAtMs ? 'EARLY' : 'LATE');

/** Tranche d'âge souhaitée par défaut : âge ± `preferences.groupAgeDefaultDelta` (≥ 18). */
export const defaultGroupAge = (age: number, t: Tuning): { min: number; max: number } => ({ min: Math.max(18, age - t.preferences.groupAgeDefaultDelta), max: age + t.preferences.groupAgeDefaultDelta });
