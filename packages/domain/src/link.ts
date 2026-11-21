/**
 * Un lien = la relation entre deux personnes (et leurs deux minimoas).
 * 7 vies : un jour entier sans échange en coûte une. À 0, le lien devient fantôme ;
 * on peut le ranimer une seule fois. 7 niveaux débloqués par l'expérience.
 * La série du lien vit avec la conversation (spéc V7 §24) : elle compte les jours d'affilée où les deux se sont écrit.
 * Moteur pur : le rattrapage des jours passés se fait à la lecture (`tickLink`) ; le jour (heure de Paris) est un paramètre.
 */
import { type Day, addDays, daysBetween } from './days';
import { weekDaysOf } from './rituels/week';

export const MAX_LIVES = 7;
export const REVIVE_LIVES = 3;
export const MAX_LEVEL = 7;

export const LINK_STATUSES = ['active', 'ghost', 'archived'] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

/** Les deux côtés d'un lien : `a` = user_a, `b` = user_b (user_a < user_b). */
export type LinkSide = 'a' | 'b';

export interface LinkState {
  status: LinkStatus;
  lives: number;
  xp: number;
  level: number;
  /** Jours d'affilée où les deux se sont écrit (au moins un message de chacun, jour de Paris). */
  streak: number;
  /** Plus longue série du lien (record, gardé quand la série retombe). */
  bestStreak: number;
  /** Dernier jour où quelqu'un a écrit. */
  lastActiveOn: Day;
  /** Dernier jour déjà pris en compte pour les vies. */
  lastTickOn: Day;
  /** Nombre de jours où les deux se sont écrit, depuis la création du lien. */
  duoDays: number;
  /** Dernier jour où les deux se sont écrit. */
  lastDuoDayOn: Day | null;
  /** Qui a écrit, jour par jour, sur les `RECENT_DAYS_KEPT` derniers jours (la semaine en cours, la journée). */
  recentDays: LinkDay[];
  /** Étapes du lien : niveaux passés et paliers de série, avec leur jour (null : passé avant qu'on le note). */
  milestones: LinkMilestone[];
  /** Vrai si le lien a déjà été ranimé. */
  revived: boolean;
}

/** Un jour où au moins l'un des deux a écrit. `a` = user_a, `b` = user_b. */
export interface LinkDay {
  day: Day;
  a: boolean;
  b: boolean;
}

/** Jours gardés dans `recentDays` : deux semaines, de quoi toujours couvrir la semaine civile en cours. */
export const RECENT_DAYS_KEPT = 14;

export const LINK_MILESTONE_KINDS = ['level', 'streak'] as const;
export type LinkMilestoneKind = (typeof LINK_MILESTONE_KINDS)[number];
export interface LinkMilestone {
  kind: LinkMilestoneKind;
  /** Niveau atteint, ou palier de série (`LINK_STREAK_MILESTONES`). */
  value: number;
  on: Day | null;
}

/** Paliers de série notés dans les étapes du lien (souvenirs). */
export const LINK_STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

/** Niveau n atteint à partir de LEVEL_XP[n-1] points. */
export const LEVEL_XP = [0, 40, 120, 260, 480, 800, 1200] as const;
export const LEVEL_KEYS = ['rendezvous', 'jouent', 'emmenagent', 'visage_flou', 'revelation', 'irl', 'oeuf'] as const;
export type LevelKey = (typeof LEVEL_KEYS)[number];

/**
 * Visage d'une personne. Lien noué (bonjour accepté des deux côtés) : net, dès le premier jour. Sur la carte, avant le
 * lien : flou. Ailleurs, sans lien : caché. (Avant le 21 nov. 2026, le visage d'un lien ne se révélait qu'au niveau 5.)
 */
export type FaceVisibility = 'hidden' | 'blurred' | 'clear';
export const faceVisibility = (_level: number): FaceVisibility => 'clear';

export const levelForXp = (xp: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= (LEVEL_XP[i] ?? Infinity)) level = i + 1;
  return level;
};

export function levelProgress(xp: number): { level: number; into: number; span: number; ratio: number } {
  const level = levelForXp(xp);
  const base = LEVEL_XP[level - 1] ?? 0;
  const next = LEVEL_XP[level];
  if (next === undefined) return { level, into: xp - base, span: 0, ratio: 1 };
  return { level, into: xp - base, span: next - base, ratio: (xp - base) / (next - base) };
}

/** Prochain niveau et ce qu'il manque pour l'atteindre ; null au dernier niveau. */
export function nextLevel(xp: number): { level: number; key: LevelKey; xpLeft: number } | null {
  const { level, into, span } = levelProgress(xp);
  const key = LEVEL_KEYS[level];
  if (level >= MAX_LEVEL || key === undefined) return null;
  return { level: level + 1, key, xpLeft: Math.max(0, span - into) };
}

export function newLink(today: Day): LinkState {
  return {
    status: 'active',
    lives: MAX_LIVES,
    xp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    duoDays: 0,
    lastActiveOn: today,
    lastTickOn: today,
    lastDuoDayOn: null,
    recentDays: [],
    milestones: [],
    revived: false,
  };
}

/** Série encore vivante `today` : les deux se sont écrit aujourd'hui ou hier. Sinon elle vaut 0. */
const streakAlive = (s: Pick<LinkState, 'lastDuoDayOn'>, today: Day): boolean => s.lastDuoDayOn !== null && daysBetween(s.lastDuoDayOn, today) <= 1;

/**
 * Applique les jours écoulés : chaque jour entier sans aucun message coûte une vie ; la série retombe à 0 au premier
 * jour (passé minuit) qui n'a pas été écrit par les deux. Un lien fantôme ou rangé ne bouge plus.
 */
export function tickLink(s: LinkState, today: Day): LinkState {
  if (s.status !== 'active') return s;
  const elapsed = daysBetween(s.lastTickOn, today);
  if (elapsed <= 0) return s;
  // Jours entiers de silence comptés jusqu'à un jour donné, moins ceux déjà facturés.
  const silentUntil = (d: Day): number => Math.max(0, daysBetween(s.lastActiveOn, d) - 1);
  const lost = Math.min(s.lives, silentUntil(today) - silentUntil(s.lastTickOn));
  const lives = s.lives - lost;
  const streak = streakAlive(s, today) ? s.streak : 0;
  return { ...s, lives, streak, lastTickOn: today, status: lives === 0 ? 'ghost' : 'active' };
}

/**
 * Expérience d'un lien.
 *
 * Avant (photo du jour) : 1 xp par message (plafond de 20 xp par jour et par lien), 8 xp par photo du jour envoyée
 * (une par personne et par jour) et 12 xp de plus quand la deuxième photo arrivait. Un duo régulier — les deux postent
 * et se parlent — gagnait donc chaque jour 8 + 8 + 12 = 28 xp de photos, plus jusqu'à 20 xp de messages : 34 à 48 xp
 * par jour (6 à 20 messages), soit le niveau 7 (1 200 xp) en 25 à 35 jours.
 *
 * Maintenant (spéc §24) : les points de la photo passent à la conversation, à l'identique. Le premier message du jour de
 * chacun rapporte ce que rapportait sa photo (`firstOfDay` : 8), le premier message qui fait de la journée un jour
 * « à deux » rapporte ce que rapportait la photo à deux (`duoDay` : 12), et les messages gardent leur xp plafonnée.
 * Le même duo, qui s'écrit tous les jours, gagne exactement la même chose : 28 + 6 à 20 = 34 à 48 xp par jour, même
 * rythme vers les 7 niveaux. Un jour où un seul écrit rapporte 8 + ses messages, comme une photo seule.
 */
export const LINK_XP = { message: 1, firstOfDay: 8, duoDay: 12 } as const;
/** Plafond d'expérience gagnée par jour avec les seuls messages (`LINK_XP.message`), par lien. */
export const MESSAGE_XP_PER_DAY = 20;

export interface LinkMessageEffect {
  state: LinkState;
  leveledUp: boolean;
  /** Le jour « à deux » a rendu une vie. */
  lifeGained: boolean;
  /** Premier message du jour de ce côté. */
  firstToday: boolean;
  /** Ce message fait de la journée un jour où les deux se sont écrit (une fois par jour) : la série avance. */
  duoDay: boolean;
  /** Part de l'expérience gagnée qui compte dans le plafond des messages (0 ou `LINK_XP.message`). */
  messageXp: number;
}

const other = (side: LinkSide): LinkSide => (side === 'a' ? 'b' : 'a');
/** Ce côté a écrit ce jour-là. */
const wrote = (s: Pick<LinkState, 'recentDays'>, side: LinkSide, day: Day): boolean => s.recentDays.some((d) => d.day === day && d[side]);

/** Note que `side` a écrit `today`, et oublie les jours trop anciens. Ordre : du plus ancien au plus récent. */
function markWritten(days: readonly LinkDay[], side: LinkSide, today: Day): LinkDay[] {
  const oldest = addDays(today, -(RECENT_DAYS_KEPT - 1));
  const kept = days.filter((d) => d.day >= oldest && d.day !== today);
  const current = days.find((d) => d.day === today) ?? { day: today, a: false, b: false };
  return [...kept, { ...current, [side]: true }].sort((x, y) => x.day.localeCompare(y.day));
}

/** Ajoute les étapes nouvellement atteintes (niveaux passés, paliers de série), datées d'aujourd'hui. */
function withMilestones(list: readonly LinkMilestone[], fromLevel: number, toLevel: number, streak: number, today: Day): LinkMilestone[] {
  const out = [...list];
  const has = (kind: LinkMilestoneKind, value: number): boolean => out.some((m) => m.kind === kind && m.value === value);
  for (let lv = fromLevel + 1; lv <= toLevel; lv++) if (!has('level', lv)) out.push({ kind: 'level', value: lv, on: today });
  for (const m of LINK_STREAK_MILESTONES) if (streak >= m && !has('streak', m)) out.push({ kind: 'streak', value: m, on: today });
  return out;
}

/**
 * Un message d'une personne (texte écrit par elle ; jamais une réplique de minimoa ni un bandeau du système).
 * `messageXpToday` = expérience déjà gagnée aujourd'hui dans ce lien par `LINK_XP.message`.
 *
 * Règles de la série (spéc §24) :
 * - un jour compte quand chacun a envoyé au moins un message ce jour-là (heure de Paris) ;
 * - quand le deuxième écrit, la série avance d'un cran (hier aussi à deux → +1, sinon elle repart à 1), le record suit,
 *   et le lien regagne une vie s'il en a perdu (comme la photo à deux le faisait) ;
 * - un jour où un seul écrit garde le lien en vie mais n'allonge pas la série : affichée telle quelle jusqu'à minuit
 *   (« en jeu »), elle retombe à 0 au rattrapage du lendemain (`tickLink`) ;
 * - un lien créé aujourd'hui part de 0 : si les deux s'écrivent dès le premier jour, la série vaut 1.
 */
export function applyLinkMessage(prev: LinkState, side: LinkSide, today: Day, messageXpToday = 0): LinkMessageEffect {
  const s = tickLink(prev, today);
  if (s.status !== 'active') return { state: s, leveledUp: false, lifeGained: false, firstToday: false, duoDay: false, messageXp: 0 };
  const firstToday = !wrote(s, side, today);
  const duoDay = firstToday && wrote(s, other(side), today) && s.lastDuoDayOn !== today;
  const messageXp = messageXpToday >= MESSAGE_XP_PER_DAY ? 0 : LINK_XP.message;
  const xp = s.xp + messageXp + (firstToday ? LINK_XP.firstOfDay : 0) + (duoDay ? LINK_XP.duoDay : 0);
  const level = Math.max(s.level, levelForXp(xp));
  let { lives, streak, bestStreak, duoDays, lastDuoDayOn } = s;
  let lifeGained = false;
  if (duoDay) {
    streak = streakAlive(s, today) ? streak + 1 : 1;
    bestStreak = Math.max(bestStreak, streak);
    duoDays += 1;
    lastDuoDayOn = today;
    if (lives < MAX_LIVES) {
      lives += 1;
      lifeGained = true;
    }
  }
  const state: LinkState = {
    ...s,
    xp,
    level,
    lives,
    streak,
    bestStreak,
    duoDays,
    lastDuoDayOn,
    lastActiveOn: today,
    lastTickOn: today,
    recentDays: markWritten(s.recentDays, side, today),
    milestones: withMilestones(s.milestones, s.level, level, streak, today),
  };
  return { state, leveledUp: level > s.level, lifeGained, firstToday, duoDay, messageXp };
}

/** Ranimer un lien fantôme : possible une seule fois. La série repart de zéro (le record reste). */
export function reviveLink(prev: LinkState, today: Day): LinkState | null {
  const s = tickLink(prev, today);
  if (s.status !== 'ghost' || s.revived) return null;
  return { ...s, status: 'active', lives: REVIVE_LIVES, revived: true, streak: 0, lastActiveOn: today, lastTickOn: today };
}
export const canRevive = (s: LinkState): boolean => s.status === 'ghost' && !s.revived;

// ── La journée d'un lien, vue par l'un des deux ───────────────────────────

export interface LinkTodayView {
  /** J'ai écrit aujourd'hui. */
  mine: boolean;
  /** L'autre a écrit aujourd'hui. */
  theirs: boolean;
  /** Série à montrer aujourd'hui (0 si elle est déjà tombée). */
  streak: number;
  /**
   * La série est en jeu : elle existe, et vous ne vous êtes pas encore écrit tous les deux aujourd'hui. Sans ça avant
   * minuit, elle retombe à 0.
   */
  atStake: boolean;
}

/** Vu depuis `side` : qui a écrit aujourd'hui, la série du jour et si elle est en jeu. */
export function linkToday(s: LinkState, side: LinkSide, today: Day): LinkTodayView {
  const mine = wrote(s, side, today);
  const theirs = wrote(s, other(side), today);
  const streak = s.status === 'active' && streakAlive(s, today) ? s.streak : 0;
  return { mine, theirs, streak, atStake: streak > 0 && s.lastDuoDayOn !== today };
}

/**
 * Le côté qui doit encore écrire aujourd'hui alors que l'autre l'a déjà fait (rappel « à toi d'écrire »), ou null :
 * personne n'a écrit, les deux l'ont fait, ou le lien n'est pas actif.
 */
export function lateSide(s: LinkState, today: Day): LinkSide | null {
  if (s.status !== 'active') return null;
  const a = wrote(s, 'a', today);
  const b = wrote(s, 'b', today);
  if (a === b) return null;
  return a ? 'b' : 'a';
}

/** Rappel « à toi d'écrire avant minuit » : le soir, de 19 h à 22 h (heure de Paris), avant les heures calmes. */
export const WRITE_REMINDER_HOURS = [19, 22] as const;
export const isWriteReminderHour = (parisHour: number): boolean => parisHour >= WRITE_REMINDER_HOURS[0] && parisHour < WRITE_REMINDER_HOURS[1];

// ── Les jours d'un lien (semaine) ─────────────────────────────────────────

export type LinkWeekWhen = 'past' | 'today' | 'future';

export interface LinkWeekDay {
  day: Day;
  a: boolean;
  b: boolean;
  when: LinkWeekWhen;
  /** Jour d'avant la création du lien. */
  beforeLink: boolean;
}

/** La semaine en cours (lundi → dimanche) d'un lien, d'après ses jours écrits (`recentDays`). */
export function linkWeek(days: readonly LinkDay[], today: Day, createdOn: Day): LinkWeekDay[] {
  const byDay = new Map(days.map((d) => [d.day, d]));
  return weekDaysOf(today).map((day) => {
    const d = byDay.get(day);
    const diff = daysBetween(today, day);
    return { day, a: d?.a ?? false, b: d?.b ?? false, when: diff < 0 ? 'past' : diff === 0 ? 'today' : 'future', beforeLink: day < createdOn };
  });
}
