/** Dates lisibles pour les chats (fuseau de l'app : Europe/Paris, comme le domaine). */
import type { Link, Memories } from '@blowy/contract';
import { addDays, APP_TIMEZONE, dayOf, daysBetween } from '@blowy/domain';
import type { WeekDayState } from '@blowy/ui';

import { dates, today as todayText } from '@/locales/chats';

const weekdayOf = (day: string): number => new Date(`${day}T12:00:00Z`).getUTCDay();

/** « 12 oct. » à partir de AAAA-MM-JJ. */
export const shortDay = (day: string): string => `${Number(day.slice(8, 10))} ${dates.months[Number(day.slice(5, 7)) - 1] ?? ''}`;

/** Séparateur du chat : « aujourd'hui · mardi », « hier », « lundi 3 nov. ». */
export function chatDayLabel(day: string, now: Date = new Date()): string {
  const diff = daysBetween(day, dayOf(now));
  const weekday = dates.weekdays[weekdayOf(day)] ?? '';
  if (diff === 0) return `${dates.today} · ${weekday}`;
  if (diff === 1) return dates.yesterday;
  return `${weekday} ${shortDay(day)}`;
}

/** Heure ou jour d'un dernier message, pour la liste des chats : « 21:04 », « hier », « lun. », « 3 nov. ». */
export function timeLabel(at: string, now: Date = new Date()): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return '';
  const day = dayOf(date);
  const diff = daysBetween(day, dayOf(now));
  if (diff <= 0) {
    return new Intl.DateTimeFormat('fr-FR', { timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit' }).format(date);
  }
  if (diff === 1) return dates.yesterday;
  if (diff < 7) return dates.weekdaysShort[weekdayOf(day)] ?? '';
  return shortDay(day);
}

/** Les 7 derniers jours du lien, d'après les photos du jour (deux = fait, une = à moitié). */
export function weekStrip(memories: Memories | undefined, today: string): { day: string; state: WeekDayState; mark?: string }[] {
  const byDay = new Map((memories?.days ?? []).map((d) => [d.day, d]));
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    const m = byDay.get(day);
    const count = (m?.myPhotoUrl ? 1 : 0) + (m?.theirPhotoUrl ? 1 : 0);
    const state: WeekDayState = count === 2 ? 'done' : count === 1 ? 'half' : 'none';
    return { day: todayText.weekDays[weekdayOf(day)] ?? '', state, mark: state === 'half' ? todayText.halfMark : undefined };
  });
}

/** Liens visibles dans la liste, du plus récent au plus ancien. */
export function sortLinks(links: readonly Link[]): Link[] {
  const at = (l: Link): string => l.lastMessage?.at ?? l.createdAt;
  return links.filter((l) => l.status !== 'archived').sort((a, b) => at(b).localeCompare(at(a)));
}

/** Lien créé il y a moins de 2 jours et encore sans conversation. */
export const isNewLink = (l: Link, now: Date = new Date()): boolean =>
  !l.lastMessage && now.getTime() - new Date(l.createdAt).getTime() < 2 * 86_400_000;

/** Liens actifs où l'autre attend ma photo du jour. */
export const waitingForMyPhoto = (links: readonly Link[]): Link[] =>
  links.filter((l) => l.status === 'active' && l.today.theirs && !l.today.mine);
