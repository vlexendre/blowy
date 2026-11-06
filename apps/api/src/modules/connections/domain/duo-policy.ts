/**
 * Règles pures du duo (spec-v5 §2.12 amendée par V5.1 F.17–F.18 et V5.2 H.25) :
 *  - voie Duo = texte d'abord ; les VISAGES se débloquent à `exchangeEndsAt` (48 h) si les deux ont
 *    écrit (≥ `duo.minMessagesEachToUnlock` messages humains publiés chacun) ; le vocal n'est jamais une condition ;
 *  - rendez-vous à deux jamais avant le déblocage ; lieu public partenaire ; fenêtre de check-in fixe ;
 *  - après le rendez-vous : bulletin ami / plus / non, résolution `min`, « plus » sans compatibilité
 *    romance réciproque ramené à « ami » en silence ; tout le non mutuel = même fin neutre ;
 *  - gratuit : 1 duo actif ; Blowy+ : illimité (port économie) ;
 *  - duo né d'une sortie (accord « plus » mutuel) : sans horloge 48 h / J+7 (D-017) ;
 *  - œuf (T9) : drapeau seulement, désactivé par défaut, actif seulement si les deux l'activent.
 */
import { DUO_TRANSITIONS, isDuoTerminal, type ConnectionKind, type DuoStatus, type VoteChoice } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** V5.2 H.25 : un duo actif gratuit (toutes origines). Blowy+ : illimité. Demande à B : `duo.freeActiveDuos`. */
export const FREE_ACTIVE_DUOS = 1;
/** Un rendez-vous dure ~2 h (fin indicative, page du proche). */
export const DATE_DURATION_MS = 2 * HOUR;
/** Pas de rendez-vous proposé moins de 2 h à l'avance (le proche et l'autre doivent pouvoir s'organiser). */
export const DATE_MIN_LEAD_MS = 2 * HOUR;
/** Duo sans échéance (né d'une sortie, ou TOGETHER) : rendez-vous au plus tard à 30 j. */
export const DATE_MAX_AHEAD_MS = 30 * DAY;
/** Horaires d'un lieu partenaire (heure locale du lieu) : [10 h, 22 h]. */
export const VENUE_OPEN_MINUTE = 10 * 60;
export const VENUE_LAST_START_MINUTE = 22 * 60;
/** Annulation d'un RDV confirmé à moins de 24 h : comptée (`lateCancel`). */
export const LATE_CANCEL_MS = 24 * HOUR;
/** Conversation d'un duo expiré : lisible 7 j, puis accès retiré. */
export const EXPIRED_READ_ONLY_MS = 7 * DAY;

/**
 * Machine d'états locale = celle du domaine (A) + retours vers TOGETHER : un duo déjà TOGETHER qui
 * propose un nouveau RDV y revient si ce RDV est refusé, annulé ou non tenu (demande à A : ajouter
 * `DATE_PROPOSED → TOGETHER`, `DATE_CONFIRMED → TOGETHER` dans `DUO_TRANSITIONS`).
 */
const EXTRA: Partial<Record<DuoStatus, readonly DuoStatus[]>> = { DATE_PROPOSED: ['TOGETHER'], DATE_CONFIRMED: ['TOGETHER'], AFTER_VOTE: ['UNLOCKED'] };
export function canMoveDuo(from: DuoStatus, to: DuoStatus): boolean {
  return DUO_TRANSITIONS[from].includes(to) || (EXTRA[from] ?? []).includes(to);
}

/** État « au repos » d'un duo débloqué (hors RDV en cours). */
export const restingStatus = (together: boolean): DuoStatus => (together ? 'TOGETHER' : 'UNLOCKED');

/** Visages, vocal et RDV possibles (jamais pendant EXCHANGE). */
export const isUnlocked = (s: DuoStatus): boolean => !isDuoTerminal(s) && s !== 'EXCHANGE';

export interface ExchangeFacts {
  status: DuoStatus;
  exchangeEndsAt: Date | null;
  messagesLow: number;
  messagesHigh: number;
}

/** Issue de l'échange à l'échéance (V5.1 F.18) : null si pas encore dû. */
export function exchangeOutcome(d: ExchangeFacts, now: Date, t: Tuning): 'UNLOCKED' | 'EXPIRED' | null {
  if (d.status !== 'EXCHANGE' || !d.exchangeEndsAt || now < d.exchangeEndsAt) return null;
  const min = t.duo.minMessagesEachToUnlock;
  return d.messagesLow >= min && d.messagesHigh >= min ? 'UNLOCKED' : 'EXPIRED';
}

/** Progression de déblocage — la mienne seulement (jamais celle de l'autre). */
export const unlockProgress = (mine: number, t: Tuning): number => Math.min(1, mine / t.duo.minMessagesEachToUnlock);

export interface DateWindowInput {
  origin: 'LANE' | 'OUTING_VOTE';
  dateDeadline: Date | null;
  startsAt: Date;
  /** Minute locale (0–1439) de `startsAt` dans le fuseau du lieu. */
  localMinute: number;
  now: Date;
}

/** Créneau acceptable (§2.12 : `startsAt ≤ dateDeadline + dateMaxAfterDeadlineDays` pour la voie Duo). */
export function dateInRange(i: DateWindowInput, t: Tuning): boolean {
  if (i.startsAt.getTime() < i.now.getTime() + DATE_MIN_LEAD_MS) return false;
  if (i.localMinute < VENUE_OPEN_MINUTE || i.localMinute > VENUE_LAST_START_MINUTE) return false;
  const max = i.origin === 'LANE' && i.dateDeadline ? i.dateDeadline.getTime() + t.duo.dateMaxAfterDeadlineDays * DAY : i.now.getTime() + DATE_MAX_AHEAD_MS;
  return i.startsAt.getTime() <= max;
}

/** Fenêtre de check-in d'un RDV (identique aux sorties). */
export function checkinWindow(startsAt: Date, t: Tuning): { opensAt: Date; closesAt: Date } {
  return { opensAt: new Date(startsAt.getTime() - t.outings.cycle.checkinOpensBeforeMinutes * MIN), closesAt: new Date(startsAt.getTime() + t.outings.cycle.checkinClosesAfterMinutes * MIN) };
}

export const isLateCancel = (startsAt: Date, now: Date): boolean => startsAt.getTime() - now.getTime() < LATE_CANCEL_MS;

/** Choix proposés au votant : dépend de lui seul (aucune fuite sur l'autre). */
export const voteOptionsFor = (voterSeeksRomance: boolean): VoteChoice[] => (voterSeeksRomance ? ['FRIEND', 'PLUS', 'NO'] : ['FRIEND', 'NO']);

const RANK: Record<VoteChoice, number> = { NO: 0, FRIEND: 1, PLUS: 2 };

/** Résolution d'après-RDV : `min` des deux bulletins (absent = NO) ; PLUS exige la compatibilité romance réciproque. */
export function resolveDuoVote(a: VoteChoice | undefined, b: VoteChoice | undefined, romanceOk: boolean): ConnectionKind | null {
  const r = Math.min(RANK[a ?? 'NO'], RANK[b ?? 'NO']);
  if (r === RANK.PLUS) return romanceOk ? 'PLUS' : 'FRIEND';
  return r === RANK.FRIEND ? 'FRIEND' : null;
}

/** Œuf (T9) : proposable seulement TOGETHER avec ≥ `egg.minDuoDates` RDV vécus ; actif si les deux. */
export const eggEligible = (d: { status: DuoStatus; datesAttended: number }, t: Tuning): boolean => d.status === 'TOGETHER' && d.datesAttended >= t.egg.minDuoDates;
export const eggActive = (d: { eggOptInLow: boolean; eggOptInHigh: boolean }): boolean => d.eggOptInLow && d.eggOptInHigh;

/** Capacité de duos actifs : 1 gratuit, illimité avec Blowy+. */
export const duoCapacity = (plus: boolean, free: number = FREE_ACTIVE_DUOS): number => (plus ? Number.POSITIVE_INFINITY : free);

/** Minute locale d'un instant dans un fuseau IANA. */
export function localMinuteOf(at: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(at);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

/** Date locale `YYYY-MM-DD` et heure locale d'un instant (lot quotidien de la voie Duo). */
export function localDateHour(at: Date, timezone: string): { date: string; hour: number } {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(at);
  const g = (t: string) => f.find((p) => p.type === t)?.value ?? '00';
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hour: Number(g('hour')) };
}
