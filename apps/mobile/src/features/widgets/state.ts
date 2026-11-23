/**
 * Ce que montrent les widgets et les activités en direct, calculé à partir des données déjà lues par l'app.
 * Pur (l'heure est passée en paramètre) : testé dans state.test.ts.
 *
 * Les widgets n'appellent jamais l'API. L'app leur publie une suite de moments calculés d'avance avec les règles
 * du domaine (la sociabilité qui baisse, la forme qui suit, le défi qui repart à minuit) ; l'extension les
 * déroule sans rien recalculer.
 */
import type { Link, LiveActivityAttributes, LiveActivityKind, LiveActivityState, Pet, RitualsToday, Streak } from '@blowy/contract';
import { APP_TIMEZONE, dayOf, decayNeeds, isWriteReminderHour, nextLocalHour, parisHourOf, shapeOf } from '@blowy/domain';

import type { WidgetFrame, WidgetSnapshot } from '@/core/widgets';

/** Un moment toutes les 2 h sur 24 h, plus minuit (le défi repart) : 13 entrées au plus, bien au-dessus des 5 min d'Apple. */
const STEP_S = 2 * 3600;
const HORIZON_S = 24 * 3600;

export const HOME_URL = 'blowy://pet';
export const linkUrl = (linkId: string): string => `blowy://link/${linkId}`;

export interface WidgetInputs {
  pet: Pick<Pet, 'name' | 'species' | 'needs'>;
  /** Instant de la lecture du pet : ses besoins valent pour cet instant. */
  readAt: Date;
  streak: Streak | null;
  /** Accueil des rituels (texte et état du défi) ; null s'il n'est pas (encore) lu. */
  today: RitualsToday | null;
}

/** Fin de la journée en cours (minuit, jour de Paris comme celui du défi), en secondes Unix. */
export const endOfDay = (now: Date): number => Math.floor(nextLocalHour(now, APP_TIMEZONE, 0).getTime() / 1000);

/** Série affichée après minuit si le défi d'aujourd'hui n'est pas fait : un joker la protège, sinon elle repart de zéro. */
export function streakAfterMidnight(streak: Streak | null): number {
  if (!streak) return 0;
  if (streak.doneToday || streak.jokersLeft > 0) return streak.current;
  return 0;
}

function challengeToday(i: WidgetInputs, now: Date): Pick<WidgetFrame, 'challenge' | 'challengeText'> {
  const today = i.today && i.today.day === dayOf(now) ? i.today : null;
  const done = i.streak?.doneToday ?? today?.streak.doneToday ?? false;
  if (done) return { challenge: 'done', challengeText: null };
  return {
    challenge: today?.challenge.status === 'accepted' ? 'accepted' : 'todo',
    challengeText: today?.challenge.text ?? null,
  };
}

/** L'état publié pour les widgets. */
export function widgetSnapshot(i: WidgetInputs): WidgetSnapshot {
  const readS = Math.floor(i.readAt.getTime() / 1000);
  const midnight = endOfDay(i.readAt);
  // Grille fixe (toutes les 2 h) : l'état ne change pas d'une lecture à l'autre si rien n'a bougé.
  const first = Math.floor(readS / STEP_S) * STEP_S;
  const times = new Set<number>([first, midnight]);
  for (let t = first + STEP_S; t <= readS + HORIZON_S; t += STEP_S) times.add(t);

  const today = challengeToday(i, i.readAt);
  const streakNow = i.streak?.current ?? i.today?.streak.current ?? 0;
  const frames = [...times]
    .sort((a, b) => a - b)
    .map((at): WidgetFrame => {
      const needs = decayNeeds(i.pet.needs, Math.max(0, at - readS) / 3600);
      const afterMidnight = at >= midnight;
      return {
        at,
        sociability: needs.sociability,
        shape: shapeOf(needs),
        streak: afterMidnight ? streakAfterMidnight(i.streak ?? i.today?.streak ?? null) : streakNow,
        ...(afterMidnight ? { challenge: 'todo' as const, challengeText: null } : today),
      };
    });
  return { v: 1, pet: { name: i.pet.name, species: i.pet.species }, url: HOME_URL, frames };
}

// ── Activités en direct ────────────────────────────────────────────────────

export interface DesiredActivity {
  /** Une activité par clé, démarrée une seule fois (ex. `challenge:2026-11-15`). */
  key: string;
  kind: LiveActivityKind;
  attributes: LiveActivityAttributes;
  state: LiveActivityState;
}

export interface ActivityInputs {
  pet: Pick<Pet, 'name' | 'species'>;
  today: RitualsToday | null;
  streak: Streak | null;
  links: readonly Link[];
  now: Date;
}

const nowS = (now: Date): number => Math.floor(now.getTime() / 1000);

/**
 * Le défi du jour accepté et pas encore fait. N'est plus démarrée par l'app (`index.ts`) : le défi n'existe plus à
 * l'écran ; gardée seulement pour terminer proprement une activité déjà lancée par une ancienne version.
 * Le redessin complet des widgets (séance) viendra plus tard.
 */
export function challengeActivity(i: ActivityInputs): DesiredActivity | null {
  const day = dayOf(i.now);
  const c = i.today?.day === day ? i.today.challenge : null;
  if (!c || c.status !== 'accepted') return null;
  const streak = i.streak?.current ?? i.today?.streak.current ?? 0;
  return {
    key: `challenge:${day}`,
    kind: 'challenge',
    attributes: { kind: 'challenge', pet: { name: i.pet.name, species: i.pet.species }, startedAt: nowS(i.now), url: HOME_URL },
    state: { endsAt: endOfDay(i.now), streak, title: c.text, done: false },
  };
}

/**
 * Série d'un lien : « À toi d'écrire » avant minuit, sans prénom (écran verrouillé visible de tous). Le soir seulement
 * (mêmes heures que le rappel du serveur, `WRITE_REMINDER_HOURS`), quand l'autre a écrit aujourd'hui et pas toi. Une
 * seule à la fois : la plus longue série en jeu d'abord.
 */
export function linkActivity(i: ActivityInputs): DesiredActivity | null {
  const day = dayOf(i.now);
  if (!isWriteReminderHour(parisHourOf(i.now))) return null;
  const waiting = i.links
    .filter((l) => l.status === 'active' && l.today.day === day && l.today.theirs && !l.today.mine)
    .sort((a, b) => b.streak - a.streak);
  const link = waiting[0];
  if (!link) return null;
  return {
    key: `link:${link.id}:${day}`,
    kind: 'link',
    attributes: {
      kind: 'link',
      pet: { name: i.pet.name, species: i.pet.species },
      startedAt: nowS(i.now),
      url: linkUrl(link.id),
    },
    state: { endsAt: endOfDay(i.now), streak: link.streak, title: null, done: false },
  };
}

/** Une sortie déclarée (« Nino est de sortie »), pour `hours` heures au plus (huit au plus selon Apple). */
export function outingActivity(pet: Pick<Pet, 'name' | 'species'>, now: Date, hours = 3): DesiredActivity {
  const start = nowS(now);
  return {
    key: `outing:${start}`,
    kind: 'outing',
    attributes: { kind: 'outing', pet: { name: pet.name, species: pet.species }, startedAt: start, url: HOME_URL },
    state: { endsAt: start + Math.min(8, Math.max(1, hours)) * 3600, streak: 0, title: null, done: false },
  };
}

/** Ce qu'il faut faire d'une activité en cours, au vu des données du moment. */
export type ActivityDecision =
  | { action: 'keep' }
  | { action: 'update'; state: LiveActivityState }
  | { action: 'end'; state: LiveActivityState; dismissAfterSeconds: number };

/**
 * Durée de vie d'une activité en direct : 8 h au plus après son début (HIG d'Apple, « don't exceed eight hours »).
 * Le défi affiche minuit (sa vraie échéance) mais son activité, démarrée par l'app, est périmée puis retirée 8 h après
 * son début (`staleDate` côté natif, `decideRunning` ici), même si minuit est plus loin.
 */
export const ACTIVITY_MAX_SECONDS = 8 * 3600;

/**
 * challenge : fait → état final « Défi relevé » laissé 15 min ; jour passé ou 8 h écoulées depuis le début → retirée ;
 * sinon mise à jour (série, texte).
 * link : tu as écrit → « C'est fait » (série à jour) 10 min ; jour passé ou plus personne n'attend → retirée.
 * outing : terminée à son heure de fin.
 */
export function decideRunning(
  running: { attributes: LiveActivityAttributes; state: LiveActivityState },
  i: ActivityInputs,
): ActivityDecision {
  const { attributes, state } = running;
  const now = nowS(i.now);
  const dayOver = state.endsAt <= now;
  switch (attributes.kind) {
    case 'challenge': {
      const done = i.streak?.doneToday ?? (i.today?.day === dayOf(i.now) ? i.today.challenge.status === 'done' : false);
      const expired = now >= attributes.startedAt + ACTIVITY_MAX_SECONDS;
      if (done && !dayOver && !expired) return { action: 'end', state: { ...state, done: true, streak: i.streak?.current ?? state.streak }, dismissAfterSeconds: 15 * 60 };
      if (dayOver || expired) return { action: 'end', state, dismissAfterSeconds: 0 };
      const desired = challengeActivity(i);
      if (!desired) return { action: 'keep' };
      const next = { ...state, streak: desired.state.streak, title: desired.state.title };
      return next.streak !== state.streak || next.title !== state.title ? { action: 'update', state: next } : { action: 'keep' };
    }
    case 'link': {
      if (dayOver) return { action: 'end', state, dismissAfterSeconds: 0 };
      const linkId = attributes.url.split('/').pop();
      const link = i.links.find((l) => l.id === linkId);
      if (!link) return { action: 'keep' };
      if (link.today.mine) return { action: 'end', state: { ...state, done: true, streak: link.streak }, dismissAfterSeconds: 10 * 60 };
      if (!link.today.theirs || link.status !== 'active') return { action: 'end', state, dismissAfterSeconds: 0 };
      return { action: 'keep' };
    }
    case 'outing':
      return dayOver ? { action: 'end', state: { ...state, done: true }, dismissAfterSeconds: 30 * 60 } : { action: 'keep' };
  }
}
