/**
 * Formats de dates et d'heures des maquettes V5 (français, fuseau IANA de la personne) — purs,
 * testés. « 19 h 30 », « 18 h », « jeudi 12 novembre », « mer. 11 nov. 18 h ». Les espaces des
 * groupes date/heure sont insécables (aucune date coupée en fin de ligne, V5.3 F.28).
 */
export const NBSP = ' ';
export const DEFAULT_TZ = 'Europe/Paris';

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;
const DAYS_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'] as const;
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const;
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] as const;

export interface CivilParts {
  year: number;
  month: number; // 1–12
  day: number;
  weekday: number; // 0 = dimanche
  hour: number;
  minute: number;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23', weekday: 'short' });
    fmtCache.set(tz, f);
  }
  return f;
}
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Date civile dans le fuseau donné. */
export function civil(input: string | number | Date, tz = DEFAULT_TZ): CivilParts {
  const d = input instanceof Date ? input : new Date(input);
  const parts = Object.fromEntries(formatter(tz).formatToParts(d).map((p) => [p.type, p.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), weekday: WD[parts.weekday ?? 'Sun'] ?? 0, hour: Number(parts.hour) % 24, minute: Number(parts.minute) };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const nb = (s: string) => s.replace(/ /g, NBSP);

/** « 19 h 30 » / « 18 h ». */
export function timeLabel(input: string | number | Date, tz = DEFAULT_TZ): string {
  const c = civil(input, tz);
  return nb(c.minute === 0 ? `${c.hour} h` : `${c.hour} h ${String(c.minute).padStart(2, '0')}`);
}

/** « jeudi 12 novembre » (`capitalized` : « Jeudi 12 novembre »). */
export function dayLong(input: string | number | Date, tz = DEFAULT_TZ, capitalized = false): string {
  const c = civil(input, tz);
  const s = `${DAYS[c.weekday]} ${c.day} ${MONTHS[c.month - 1]}`;
  return nb(capitalized ? cap(s) : s);
}

/** « jeu. 12 nov. ». */
export function dayShort(input: string | number | Date, tz = DEFAULT_TZ): string {
  const c = civil(input, tz);
  return nb(`${DAYS_SHORT[c.weekday]} ${c.day} ${MONTHS_SHORT[c.month - 1]}`);
}

/** « mer. 11 nov. 18 h ». */
export function dayShortTime(input: string | number | Date, tz = DEFAULT_TZ): string {
  return `${dayShort(input, tz)}${NBSP}${timeLabel(input, tz)}`;
}

/** « jeudi 12 novembre, 16 h 30 ». */
export function dayLongTime(input: string | number | Date, tz = DEFAULT_TZ, capitalized = false): string {
  return `${dayLong(input, tz, capitalized)}, ${timeLabel(input, tz)}`;
}

/** « 19 h 30 – 21 h 30 ». */
export function timeRange(start: string, end: string, tz = DEFAULT_TZ): string {
  return `${timeLabel(start, tz)} – ${timeLabel(end, tz)}`;
}

/** Nom du jour seul (« jeudi », « Jeudi »). */
export function weekdayName(input: string | number | Date, tz = DEFAULT_TZ, capitalized = false): string {
  const s = DAYS[civil(input, tz).weekday] ?? '';
  return capitalized ? cap(s) : s;
}

/** Jours civils entre deux instants (dans le fuseau). */
export function civilDayDiff(from: number, to: number, tz = DEFAULT_TZ): number {
  const a = civil(from, tz);
  const b = civil(to, tz);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000);
}

/** Horodatage court d'une liste de conversations : « 2 min », « 1 h », « hier », « jeu. 12 nov. ». */
export function shortAgo(iso: string, now: number, tz = DEFAULT_TZ): string {
  const diff = now - new Date(iso).getTime();
  if (diff < 60_000) return 'à l’instant';
  if (diff < 3_600_000) return nb(`${Math.floor(diff / 60_000)} min`);
  const days = civilDayDiff(new Date(iso).getTime(), now, tz);
  if (days === 0) return nb(`${Math.floor(diff / 3_600_000)} h`);
  if (days === 1) return 'hier';
  return dayShort(iso, tz);
}

/** « mer. 21 h 30 » (jour court sans date + heure). */
export function weekdayShortTime(input: string | number | Date, tz = DEFAULT_TZ): string {
  return `${DAYS_SHORT[civil(input, tz).weekday] ?? ''}${NBSP}${timeLabel(input, tz)}`;
}

/** « Jeu. 12 nov. » (jour court capitalisé). */
export function dayShortCap(input: string | number | Date, tz = DEFAULT_TZ): string {
  return cap(dayShort(input, tz));
}
