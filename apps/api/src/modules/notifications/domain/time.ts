/**
 * Temps local pur (fuseau IANA) : jour local, heures calmes, avance à 22 h 30 / report à 8 h,
 * formats « jeudi », « 19 h 30 ». Aucune lecture d'horloge : `now` est toujours passé.
 */

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    fmtCache.set(tz, f);
  }
  return f;
}

/** Fuseau sûr : un fuseau inconnu retombe sur Europe/Paris (jamais d'exception à l'envoi). */
export function safeTz(tz: string | null | undefined): string {
  if (!tz) return 'Europe/Paris';
  try {
    partsFormatter(tz);
    return tz;
  } catch {
    return 'Europe/Paris';
  }
}

export function localParts(d: Date, tz: string): LocalParts {
  const o: Record<string, number> = {};
  for (const p of partsFormatter(tz).formatToParts(d)) if (p.type !== 'literal') o[p.type] = Number(p.value);
  return { year: o.year!, month: o.month!, day: o.day!, hour: o.hour! % 24, minute: o.minute! };
}

/** `YYYY-MM-DD` local. */
export function localDay(d: Date, tz: string): string {
  const p = localParts(d, tz);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Instant UTC d'une heure murale locale (deux passes : gère les changements d'heure). */
export function zonedToUtc(year: number, month: number, day: number, hour: number, minute: number, tz: string): Date {
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const p = localParts(new Date(guess), tz);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += target - asUtc;
  }
  return new Date(guess);
}

export interface QuietHours {
  quietStartHour: number;
  quietEndHour: number;
  /** Minute locale où un rappel tombant en heures calmes est avancé (22 h 30 = 1350). */
  quietAdvanceToMinuteOfDay: number;
}

const minuteOfDay = (p: LocalParts) => p.hour * 60 + p.minute;

export function inQuietHours(d: Date, tz: string, q: QuietHours): boolean {
  const m = minuteOfDay(localParts(d, tz));
  const s = q.quietStartHour * 60;
  const e = q.quietEndHour * 60;
  return s <= e ? m >= s && m < e : m >= s || m < e;
}

const addDays = (p: LocalParts, n: number): LocalParts => {
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + n));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: 0, minute: 0 };
};

/** Prochaine fin d'heures calmes après `d` (supposé en heures calmes). */
export function quietEndAfter(d: Date, tz: string, q: QuietHours): Date {
  const p = localParts(d, tz);
  const sameDay = minuteOfDay(p) < q.quietEndHour * 60;
  const day = sameDay ? p : addDays(p, 1);
  return zonedToUtc(day.year, day.month, day.day, q.quietEndHour, 0, tz);
}

/** Début de la soirée calme contenant `d` (supposé en heures calmes), à la minute d'avance (22 h 30). */
function advanceTarget(d: Date, tz: string, q: QuietHours): Date {
  const p = localParts(d, tz);
  const afterMidnight = minuteOfDay(p) < q.quietEndHour * 60 && q.quietStartHour > q.quietEndHour;
  const day = afterMidnight ? addDays(p, -1) : p;
  return zonedToUtc(day.year, day.month, day.day, Math.floor(q.quietAdvanceToMinuteOfDay / 60), q.quietAdvanceToMinuteOfDay % 60, tz);
}

/**
 * Place une échéance hors heures calmes (§9.2) : un rappel « avançable » tombant la nuit est avancé
 * à 22 h 30 la veille (si ce n'est pas déjà passé), sinon tout est reporté à la fin des heures calmes.
 */
export function placeOutsideQuiet(at: Date, tz: string, q: QuietHours, o: { advanceable: boolean; notBefore: Date }): Date {
  if (!inQuietHours(at, tz, q)) return at;
  if (o.advanceable) {
    const adv = advanceTarget(at, tz, q);
    if (adv.getTime() >= o.notBefore.getTime() && adv.getTime() <= at.getTime() && !inQuietHours(adv, tz, q)) return adv;
  }
  return quietEndAfter(at, tz, q);
}

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « jeudi » (jour de la semaine local). */
export function formatWeekday(d: Date, tz: string): string {
  const p = localParts(d, tz);
  return WEEKDAYS[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()]!;
}

/** « jeudi 26 novembre ». */
export function formatLongDay(d: Date, tz: string): string {
  const p = localParts(d, tz);
  return `${formatWeekday(d, tz)} ${p.day === 1 ? '1er' : p.day} ${MONTHS[p.month - 1]}`;
}

/** « 19 h 30 », « 19 h ». */
export function formatHour(d: Date, tz: string): string {
  const p = localParts(d, tz);
  return p.minute === 0 ? `${p.hour} h` : `${p.hour} h ${String(p.minute).padStart(2, '0')}`;
}
