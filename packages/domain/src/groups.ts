/**
 * Habitudes partagées, rigueur et groupes (spéc V7 §25 et §26). Pur : pas d'horloge, pas d'aléa ; le jour (Paris) et
 * l'heure sont des paramètres.
 *
 * - Rigueur d'une habitude : sur les 28 derniers jours, part des jours dus où elle a été tenue ; un jour couvert par un
 *   joker ne compte ni pour ni contre ; moins de 7 jours dus : « trop tôt pour le dire ». Rigueur d'une personne : ses
 *   habitudes actives, pondérées par leurs jours dus.
 * - Jour dû : « tous les jours », chaque jour ; « 3 fois par semaine », un jour où le manquer rendrait l'objectif de la
 *   semaine impossible (avant, il reste de la marge : le jour n'est pas dû).
 * - Groupe d'habitude : chaque jour, un membre est à jour s'il a tenu l'habitude ou posé un joker ; série +1 quand tous
 *   les membres dus sont à jour ; une vie de moins un jour où l'un ne l'est pas ; 7 jours d'affilée sans faute en
 *   rendent une (5 au plus) ; à zéro, le groupe s'endort, n'importe quel membre peut le réveiller.
 * - Un jour se juge le lendemain à midi (Paris) : jusque-là, un membre peut encore poser un joker pour la veille.
 */
import { type Day, addDays, daysBetween } from './days';
import { HABIT_TARGET_PER_WEEK, type HabitRhythm } from './rituels/habits';
import { sameWeek, weekStartOf } from './rituels/week';
import { MATCH_THRESHOLD } from './vision';

// ── Rigueur ──────────────────────────────────────────────────────────────────

export const RIGOUR_WINDOW_DAYS = 28;
/** En dessous, « trop tôt pour le dire » : pas de chiffre. */
export const RIGOUR_MIN_DUE_DAYS = 7;

export interface HabitHistory {
  rhythm: HabitRhythm;
  /** Jours où l'habitude a été tenue (preuve qui compte). */
  keptDays: readonly Day[];
  /** Jours couverts par un joker posé pour une habitude (neutres). */
  jokerDays: readonly Day[];
  /** Premier jour de l'habitude (création, jour de Paris). */
  since: Day;
}

export interface Rigour {
  /** De 0 à 100 ; null : trop tôt pour le dire. */
  value: number | null;
  kept: number;
  due: number;
}

/** Objectif de la semaine de `day` : la semaine où l'habitude commence, au prorata des jours restants (au moins 1). */
function weekTarget(rhythm: HabitRhythm, day: Day, since: Day): number {
  const target = HABIT_TARGET_PER_WEEK[rhythm];
  if (!sameWeek(day, since)) return target;
  const daysLeft = 7 - daysBetween(weekStartOf(since), since);
  return Math.max(1, Math.ceil((target * daysLeft) / 7));
}

/**
 * L'habitude est-elle due ce jour-là ? Tous les jours : oui (dès son premier jour). Trois fois par semaine : seulement
 * quand les jours qui restent dans la semaine (celui-ci compris) ne laissent plus de marge pour atteindre l'objectif.
 */
export function habitDueOn(rhythm: HabitRhythm, keptDays: readonly Day[], day: Day, since: Day): boolean {
  if (day < since) return false;
  if (rhythm === 'daily') return true;
  const monday = weekStartOf(day);
  const from = since > monday ? since : monday;
  const keptBefore = new Set(keptDays.filter((d) => d >= from && d < day)).size;
  const needed = weekTarget(rhythm, day, since) - keptBefore;
  const remaining = 7 - daysBetween(monday, day);
  return needed > 0 && remaining <= needed;
}

/** Rigueur d'une habitude sur les 28 jours qui finissent aujourd'hui (aujourd'hui ne compte que s'il est déjà tenu). */
export function habitRigour(h: HabitHistory, today: Day): Rigour {
  const kept = new Set(h.keptDays);
  const jokers = new Set(h.jokerDays);
  const windowStart = addDays(today, -(RIGOUR_WINDOW_DAYS - 1));
  const from = h.since > windowStart ? h.since : windowStart;
  let k = 0;
  let due = 0;
  for (let d = from; d <= today; d = addDays(d, 1)) {
    if (kept.has(d)) {
      k += 1;
      due += 1;
    } else if (d === today || jokers.has(d)) {
      continue;
    } else if (habitDueOn(h.rhythm, h.keptDays, d, h.since)) {
      due += 1;
    }
  }
  return { value: due < RIGOUR_MIN_DUE_DAYS ? null : Math.round((100 * k) / due), kept: k, due };
}

/** Rigueur d'une personne : ses habitudes actives, pondérées par leurs jours dus. */
export function personRigour(habits: readonly Rigour[]): Rigour {
  const kept = habits.reduce((s, r) => s + r.kept, 0);
  const due = habits.reduce((s, r) => s + r.due, 0);
  return { value: due < RIGOUR_MIN_DUE_DAYS ? null : Math.round((100 * kept) / due), kept, due };
}

/** Habitudes du catalogue tenues par les deux (ordre de `mine`). */
export const sharedHabitIds = (mine: readonly string[], theirs: readonly string[]): string[] =>
  mine.filter((id, i) => theirs.includes(id) && mine.indexOf(id) === i);

// ── Groupes : règles de taille et limites ────────────────────────────────────

export const GROUP_KINDS = ['habit', 'free'] as const;
export type GroupKind = (typeof GROUP_KINDS)[number];
/** forming : moins de 3 membres ont accepté · active · asleep : à zéro vie (groupe d'habitude) · closed : fermé par la modération. */
export const GROUP_STATUSES = ['forming', 'active', 'asleep', 'closed'] as const;
export type GroupStatus = (typeof GROUP_STATUSES)[number];
export const GROUP_MEMBER_STATUSES = ['invited', 'active', 'declined', 'left'] as const;
export type GroupMemberStatus = (typeof GROUP_MEMBER_STATUSES)[number];

/** Le groupe démarre à 3 membres, 8 au plus. */
export const GROUP_MIN_MEMBERS = 3;
export const GROUP_MAX_MEMBERS = 8;
/** À la création : 2 à 7 personnes invitées parmi ses liens vivants. */
export const GROUP_MIN_INVITES = GROUP_MIN_MEMBERS - 1;
export const GROUP_MAX_INVITES = GROUP_MAX_MEMBERS - 1;
export const GROUP_NAME_MAX = 30;
/** Groupes à la fois (membre ou en formation) : limite `entitlements(plus).groups` (2 sans Minimoa+, 10 avec). */
export const canJoinAnotherGroup = (current: number, limit: number): boolean => current < limit;

/** Places encore libres (membres actifs et invitations en attente comptent). */
export const groupSeatsLeft = (active: number, invited: number): number =>
  Math.max(0, GROUP_MAX_MEMBERS - active - invited);

/** Statut du groupe après un changement de membres : il démarre (ou reste vivant) à 3 membres actifs. */
export function groupStatusAfter(status: GroupStatus, activeMembers: number): GroupStatus {
  if (status !== 'forming') return status;
  return activeMembers >= GROUP_MIN_MEMBERS ? 'active' : 'forming';
}

// ── Jour d'un groupe d'habitude ──────────────────────────────────────────────

/**
 * kept : habitude tenue · joker : joker posé · missed : jour jugé sans l'un ni l'autre · pending : le jour n'est pas
 * encore jugé (aujourd'hui, ou hier avant midi) · not_due : rien à faire ce jour-là (marge du rythme, pas encore membre).
 */
export const MEMBER_DAY_STATUSES = ['kept', 'joker', 'missed', 'pending', 'not_due'] as const;
export type MemberDayStatus = (typeof MEMBER_DAY_STATUSES)[number];

export interface MemberHabitState {
  /** Rythme de l'habitude chez ce membre ; null s'il ne la tient plus (elle est alors due chaque jour). */
  rhythm: HabitRhythm | null;
  keptDays: readonly Day[];
  jokerDays: readonly Day[];
  /** Jour où le membre a rejoint le groupe : il compte à partir du lendemain. */
  joinedOn: Day;
  /** Premier jour de son habitude. */
  since: Day;
}

/** État d'un membre pour un jour. `closed` : le jour est jugé (passé le lendemain midi). */
export function memberDayStatus(m: MemberHabitState, day: Day, closed: boolean): MemberDayStatus {
  if (day <= m.joinedOn) return 'not_due';
  if (m.keptDays.includes(day)) return 'kept';
  if (m.jokerDays.includes(day)) return 'joker';
  const due = m.rhythm === null ? true : habitDueOn(m.rhythm, m.keptDays, day, m.since);
  if (!due) return 'not_due';
  return closed ? 'missed' : 'pending';
}

export const GROUP_DAY_OUTCOMES = ['kept', 'missed', 'skipped'] as const;
export type GroupDayOutcome = (typeof GROUP_DAY_OUTCOMES)[number];

/** Jour jugé : skipped si personne n'avait rien à faire, missed si un membre dû n'est pas à jour, sinon kept. */
export function groupDayOutcome(statuses: readonly MemberDayStatus[]): GroupDayOutcome {
  const due = statuses.filter((s) => s !== 'not_due');
  if (due.length === 0) return 'skipped';
  return due.some((s) => s === 'missed' || s === 'pending') ? 'missed' : 'kept';
}

export const GROUP_MAX_LIVES = 5;
/** Jours d'affilée sans faute qui rendent une vie. */
export const GROUP_CLEAN_DAYS_FOR_LIFE = 7;
export const GROUP_STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

export interface GroupHabitState {
  lives: number;
  streak: number;
  bestStreak: number;
  /** Jours jugés d'affilée sans faute (kept ou skipped), remis à 0 à chaque vie rendue. */
  cleanDays: number;
  asleep: boolean;
}

export const NEW_GROUP_HABIT_STATE: GroupHabitState = Object.freeze({
  lives: GROUP_MAX_LIVES,
  streak: 0,
  bestStreak: 0,
  cleanDays: 0,
  asleep: false,
});

export interface GroupDayEffect {
  state: GroupHabitState;
  lifeLost: boolean;
  lifeGained: boolean;
  fellAsleep: boolean;
  /** Palier de série atteint ce jour-là (3, 7, 14, 30, 60, 100), sinon null. */
  milestone: number | null;
}

/** Applique un jour jugé. Un groupe endormi ne bouge plus jusqu'à son réveil. */
export function applyGroupDay(state: GroupHabitState, outcome: GroupDayOutcome): GroupDayEffect {
  const none = { lifeLost: false, lifeGained: false, fellAsleep: false, milestone: null };
  if (state.asleep) return { state, ...none };
  if (outcome === 'missed') {
    const lives = Math.max(0, state.lives - 1);
    return {
      state: { ...state, lives, streak: 0, cleanDays: 0, asleep: lives === 0 },
      ...none,
      lifeLost: true,
      fellAsleep: lives === 0,
    };
  }
  const streak = outcome === 'kept' ? state.streak + 1 : state.streak;
  let cleanDays = state.cleanDays + 1;
  let lives = state.lives;
  let lifeGained = false;
  if (cleanDays >= GROUP_CLEAN_DAYS_FOR_LIFE) {
    cleanDays = 0;
    if (lives < GROUP_MAX_LIVES) {
      lives += 1;
      lifeGained = true;
    }
  }
  const milestone =
    outcome === 'kept' && (GROUP_STREAK_MILESTONES as readonly number[]).includes(streak) ? streak : null;
  return {
    state: { lives, streak, bestStreak: Math.max(state.bestStreak, streak), cleanDays, asleep: false },
    ...none,
    lifeGained,
    milestone,
  };
}

/** Réveil d'un groupe endormi : 5 vies, série à zéro (le record reste). */
export const wakeGroup = (state: GroupHabitState): GroupHabitState => ({
  ...state,
  lives: GROUP_MAX_LIVES,
  streak: 0,
  cleanDays: 0,
  asleep: false,
});

// ── Jokers dans un groupe ────────────────────────────────────────────────────

/** Heure (Paris) jusqu'à laquelle on peut poser un joker pour la veille ; c'est aussi l'heure où la veille est jugée. */
export const GROUP_JOKER_DEADLINE_HOUR = 12;

/** Dernier jour qu'on peut juger maintenant : la veille dès midi, l'avant-veille avant. */
export const lastClosedDay = (today: Day, parisHour: number): Day =>
  addDays(today, parisHour >= GROUP_JOKER_DEADLINE_HOUR ? -1 : -2);

/** Un jour est-il déjà jugé ? */
export const isDayClosed = (day: Day, today: Day, parisHour: number): boolean =>
  day <= lastClosedDay(today, parisHour);

/** On peut poser un joker pour aujourd'hui, ou pour hier jusqu'à midi. */
export const canPlaceJokerFor = (day: Day, today: Day, parisHour: number): boolean =>
  day === today || (day === addDays(today, -1) && parisHour < GROUP_JOKER_DEADLINE_HOUR);

/**
 * Jokers : les mêmes que ceux de la série du défi (une réserve par semaine, `jokersPerWeek`). `usedDays` : jours déjà
 * couverts par un joker (série du défi et habitudes). Un jour déjà couvert ne coûte rien de plus.
 */
export function jokerCost(usedDays: readonly Day[], day: Day, perWeek: number): 'free' | 'one' | 'none_left' {
  if (usedDays.includes(day)) return 'free';
  const used = new Set(usedDays.filter((d) => sameWeek(d, day))).size;
  return used < perWeek ? 'one' : 'none_left';
}

/** Jours à juger : du lendemain du dernier jugé (ou du démarrage) au dernier jour fermé, `cap` au plus (rattrapage). */
export function groupDaysToSettle(
  startedOn: Day,
  evaluatedThrough: Day | null,
  lastClosed: Day,
  cap = 14,
): Day[] {
  const first =
    evaluatedThrough !== null && evaluatedThrough >= startedOn
      ? addDays(evaluatedThrough, 1)
      : addDays(startedOn, 1);
  const out: Day[] = [];
  for (let d = first; d <= lastClosed && out.length < cap; d = addDays(d, 1)) out.push(d);
  return out;
}

// ── Suggestion « la tenir ensemble » ─────────────────────────────────────────

/** Il faut au moins 2 autres personnes pour proposer (le groupe démarre à 3). */
export const TOGETHER_MIN_OTHERS = GROUP_MIN_MEMBERS - 1;
/** Une proposition « ensemble » restée sans groupe expire. */
export const TOGETHER_PROPOSAL_DAYS = 14;

export interface TogetherCandidate {
  /** Tient la même habitude (active). */
  holdsHabit: boolean;
  /** Montre ses habitudes (réglage « Montrer mes habitudes »). */
  sharesHabits: boolean;
  discreet: boolean;
  /** Bloqué dans un sens ou dans l'autre, suspendu ou supprimé. */
  hidden: boolean;
  /** Dans la zone de la carte (sans Minimoa+). */
  inZone: boolean;
  /** Compatibilité de vision ; null si elle ne peut pas être calculée. */
  compatibility: number | null;
}

export const isTogetherEligible = (c: TogetherCandidate): boolean =>
  c.holdsHabit &&
  c.sharesHabits &&
  !c.discreet &&
  !c.hidden &&
  c.inZone &&
  c.compatibility !== null &&
  c.compatibility >= MATCH_THRESHOLD;

/**
 * Nombre à montrer (« 3 personnes près de toi tiennent aussi Sport »), ou null : rien à proposer. La personne qui
 * regarde doit elle-même montrer ses habitudes et ne pas être en mode discret.
 */
export function togetherCount(
  viewer: { sharesHabits: boolean; discreet: boolean },
  candidates: readonly TogetherCandidate[],
): number | null {
  if (!viewer.sharesHabits || viewer.discreet) return null;
  const n = candidates.filter(isTogetherEligible).length;
  return n >= TOGETHER_MIN_OTHERS ? n : null;
}
