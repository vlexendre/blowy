/** Dates lisibles pour les chats (fuseau de l'app : Europe/Paris, comme le domaine). */
import type { Link } from '@blowy/contract';
import { APP_TIMEZONE, dayOf, daysBetween } from '@blowy/domain';
import type { WeekDayState } from '@blowy/ui';

import { dates, today as todayText } from '@/locales/chats';
import { formatDate, upperFirst } from '@/locales/runtime';

const weekdayOf = (day: string): number => new Date(`${day}T12:00:00Z`).getUTCDay();

/** « 12 oct. » à partir de AAAA-MM-JJ. */
export const shortDay = (day: string): string => `${Number(day.slice(8, 10))} ${dates.months[Number(day.slice(5, 7)) - 1] ?? ''}`;

/** Séparateur du chat : « aujourd'hui · mardi », « hier », « lundi 3 nov. ». */
export function chatDayLabel(day: string, now: Date = new Date()): string {
  const diff = daysBetween(day, dayOf(now));
  const weekday = dates.weekdays[weekdayOf(day)] ?? '';
  if (diff === 0) return upperFirst(`${dates.today} · ${weekday}`);
  if (diff === 1) return upperFirst(dates.yesterday);
  return upperFirst(`${weekday} ${shortDay(day)}`);
}

/** Heure ou jour d'un dernier message, pour la liste des chats : « 21:04 », « hier », « lun. », « 3 nov. ». */
export function timeLabel(at: string, now: Date = new Date()): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return '';
  const day = dayOf(date);
  const diff = daysBetween(day, dayOf(now));
  if (diff <= 0) {
    return formatDate(date, { timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit' });
  }
  if (diff === 1) return upperFirst(dates.yesterday);
  if (diff < 7) return dates.weekdaysShort[weekdayOf(day)] ?? '';
  return shortDay(day);
}

/**
 * La semaine en cours du lien (lundi → dimanche, maquette « cette semaine ») : coche quand vous vous êtes écrit tous les
 * deux, « 1/2 » quand un seul a écrit. Les jours à venir et ceux d'avant le lien restent vides.
 */
export function weekStrip(today: Link['today']): { day: string; state: WeekDayState; mark?: string }[] {
  return today.week.map((d) => {
    const count = d.when === 'future' || d.beforeLink ? 0 : Number(d.mine) + Number(d.theirs);
    const state: WeekDayState = count === 2 ? 'done' : count === 1 ? 'half' : 'none';
    return { day: todayText.weekDays[weekdayOf(d.day)] ?? '', state, mark: state === 'half' ? todayText.halfMark : undefined };
  });
}

/** État de la journée d'un lien, vu par toi (onglet « Le lien »). */
export type LinkDayState = 'both' | 'yourTurn' | 'theirTurn' | 'atStake' | 'fresh';
export function linkDayState(l: Pick<Link, 'today' | 'streak'>): LinkDayState {
  const { mine, theirs, atStake } = l.today;
  if (mine && theirs) return 'both';
  if (theirs) return 'yourTurn';
  if (mine) return 'theirTurn';
  return atStake ? 'atStake' : 'fresh';
}

/** Liens visibles dans la liste, du plus récent au plus ancien. */
export function sortLinks(links: readonly Link[]): Link[] {
  const at = (l: Link): string => l.lastMessage?.at ?? l.createdAt;
  return links.filter((l) => l.status !== 'archived').sort((a, b) => at(b).localeCompare(at(a)));
}

/** Lien créé il y a moins de 2 jours et encore sans conversation. */
export const isNewLink = (l: Link, now: Date = new Date()): boolean =>
  !l.lastMessage && now.getTime() - new Date(l.createdAt).getTime() < 2 * 86_400_000;

/** Liens actifs dont la série est en jeu et où l'autre a déjà écrit aujourd'hui : c'est à toi (bandeau des chats). */
export const streaksWaitingOnMe = (links: readonly Link[]): Link[] =>
  links.filter((l) => l.status === 'active' && l.today.atStake && l.today.theirs && !l.today.mine).sort((a, b) => b.streak - a.streak);

/** « À toi » sur la ligne d'un lien : l'autre a écrit aujourd'hui, pas toi. */
export const isMyTurn = (l: Link): boolean => l.status === 'active' && l.today.theirs && !l.today.mine;
