/**
 * Règles des notifications (spéc §12) : types, heures calmes, plafond, report au matin, heure locale.
 * Pur : l'instant et le fuseau sont passés en paramètre (Intl sert seulement à convertir).
 */
import type { Day } from '../days';

export const NOTIFICATION_KINDS = [
  'daily_challenge',
  'needs_out',
  'new_encounter',
  'waved',
  'message',
  'daily_photo',
  'link_in_danger',
  'streak_in_danger',
  'habit_proof',
  'weekly_review',
  'item_unlocked',
  'words_received',
  'trial_reminder',
] as const;
export type NotificationKindKey = (typeof NOTIFICATION_KINDS)[number];

/** Heures calmes : de 22 h à 8 h, heure locale de la personne. */
export const QUIET_START_HOUR = 22;
export const QUIET_END_HOUR = 8;
export const isQuietHour = (hour: number): boolean => hour >= QUIET_START_HOUR || hour < QUIET_END_HOUR;

/** Hors messages : 3 notifications par jour (local) au plus. */
export const NOTIFICATION_DAILY_CAP = 3;
/** Les messages d'une personne ne comptent pas dans le plafond (mais un seul envoi par lien toutes les 5 minutes). */
export const capExempt = (kind: NotificationKindKey): boolean => kind === 'message';
export const MESSAGE_PUSH_COOLDOWN_MINUTES = 5;

/**
 * Pendant les heures calmes : ces types sont reportés au matin (8 h) ; les autres sont abandonnés
 * (un message ou une photo se voient à l'ouverture ; un rappel programmé hors de propos n'a plus de sens le lendemain).
 */
export const DEFERRABLE_KINDS: readonly NotificationKindKey[] = ['new_encounter', 'waved', 'words_received', 'item_unlocked', 'link_in_danger', 'trial_reminder'];
export const isDeferrable = (kind: NotificationKindKey): boolean => DEFERRABLE_KINDS.includes(kind);

/** Une fois par jour local au plus (par lien pour `link_in_danger`). */
export const ONCE_A_DAY_KINDS: readonly NotificationKindKey[] = ['daily_challenge', 'needs_out', 'streak_in_danger', 'link_in_danger', 'weekly_review', 'trial_reminder'];
export const isOnceADay = (kind: NotificationKindKey): boolean => ONCE_A_DAY_KINDS.includes(kind);

/** Un report attend au plus 24 h ; au-delà il est abandonné. */
export const DEFERRED_MAX_HOURS = 24;

/** Heure du défi du jour par défaut (modifiable par la personne, entre 8 h et 21 h). */
export const DEFAULT_MORNING_HOUR = 9;
export const MORNING_HOUR_MIN = QUIET_END_HOUR;
export const MORNING_HOUR_MAX = QUIET_START_HOUR - 1;
export const DEFAULT_NOTIFICATION_TIMEZONE = 'Europe/Paris';

/** Réglages par défaut : tout activé (la personne coupe ce qu'elle veut). */
export const defaultNotificationKinds = (): Record<NotificationKindKey, boolean> =>
  Object.fromEntries(NOTIFICATION_KINDS.map((k) => [k, true])) as Record<NotificationKindKey, boolean>;

/** Vrai si le fuseau IANA est connu de l'environnement. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export interface LocalTime {
  day: Day;
  hour: number;
  minute: number;
}

/** Jour et heure locaux d'un instant dans un fuseau (repli sur Europe/Paris si le fuseau est inconnu). */
export function localTimeOf(now: Date, timeZone: string): LocalTime {
  const tz = isValidTimeZone(timeZone) ? timeZone : DEFAULT_NOTIFICATION_TIMEZONE;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '00';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) % 24, minute: Number(get('minute')) };
}

/** Décalage (ms) du fuseau à un instant : heure murale locale lue comme UTC, moins l'instant. */
function offsetMs(at: Date, tz: string): number {
  const l = localTimeOf(at, tz);
  const wall = Date.UTC(Number(l.day.slice(0, 4)), Number(l.day.slice(5, 7)) - 1, Number(l.day.slice(8, 10)), l.hour, l.minute);
  return wall - Math.floor(at.getTime() / 60_000) * 60_000;
}

/** Prochain instant (strictement après `now`) où il est `hour` h 00 à l'heure locale. */
export function nextLocalHour(now: Date, timeZone: string, hour: number): Date {
  const tz = isValidTimeZone(timeZone) ? timeZone : DEFAULT_NOTIFICATION_TIMEZONE;
  const l = localTimeOf(now, tz);
  for (let addDay = 0; addDay <= 2; addDay++) {
    const wall = Date.UTC(Number(l.day.slice(0, 4)), Number(l.day.slice(5, 7)) - 1, Number(l.day.slice(8, 10)) + addDay, hour, 0);
    // Deux passes pour tomber juste autour d'un changement d'heure.
    let guess = wall - offsetMs(now, tz);
    guess = wall - offsetMs(new Date(guess), tz);
    if (guess > now.getTime()) return new Date(guess);
  }
  return new Date(now.getTime() + 86_400_000);
}

export type NotificationDecision =
  | { action: 'send' }
  | { action: 'defer'; until: Date }
  | { action: 'skip'; reason: 'disabled' | 'quiet' | 'cap' | 'once_a_day' | 'cooldown' };

export interface NotificationInput {
  kind: NotificationKindKey;
  enabled: boolean;
  now: Date;
  timeZone: string;
  /** Notifications envoyées aujourd'hui (jour local), hors messages. */
  sentTodayCounted: number;
  /** Déjà envoyé aujourd'hui pour ce type (et ce lien, s'il y en a un). */
  alreadyToday: boolean;
  /** Dernier envoi de ce type pour ce lien (messages), ISO. */
  lastSameAt: string | null;
  /** Vrai quand on vide la file des reports : les heures calmes sont déjà passées. */
  fromQueue?: boolean;
}

/** Décide d'un envoi : réglage → une fois par jour → heures calmes → plafond → délai entre messages. */
export function decideNotification(i: NotificationInput): NotificationDecision {
  if (!i.enabled) return { action: 'skip', reason: 'disabled' };
  if (isOnceADay(i.kind) && i.alreadyToday) return { action: 'skip', reason: 'once_a_day' };
  const local = localTimeOf(i.now, i.timeZone);
  if (isQuietHour(local.hour)) {
    if (!i.fromQueue && isDeferrable(i.kind)) return { action: 'defer', until: nextLocalHour(i.now, i.timeZone, QUIET_END_HOUR) };
    return { action: 'skip', reason: 'quiet' };
  }
  if (!capExempt(i.kind) && i.sentTodayCounted >= NOTIFICATION_DAILY_CAP) return { action: 'skip', reason: 'cap' };
  if (i.kind === 'message' && i.lastSameAt && i.now.getTime() - new Date(i.lastSameAt).getTime() < MESSAGE_PUSH_COOLDOWN_MINUTES * 60_000) {
    return { action: 'skip', reason: 'cooldown' };
  }
  return { action: 'send' };
}
