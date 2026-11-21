/**
 * Ton chemin, côté app (docs/CHEMIN.md) : ce qui se calcule sans écran ni réseau. Le serveur décide de tout (unités,
 * étapes, séance, quota, personne du jour) ; ici, seulement la manière de l'afficher : quelles étapes montrer sur
 * l'accueil, l'état du bandeau, l'ordre des questions quand on en passe une, la réponse à envoyer, la réaction du
 * curseur, et une distance dite à gros grains (« dans ton quartier », jamais au mètre).
 */
import type { CheminMap, CheminQuestion, LatLng, Profil } from '@blowy/contract';

// ── Accueil : la portion du chemin montrée ────────────────────────────────────
export type PathNodeKind = 'done' | 'current' | 'chest' | 'chestOpen' | 'locked' | 'unit';
export interface PathNode {
  key: string;
  kind: PathNodeKind;
  /** Titre de l'étape (ou de l'unité pour un coffre ou un bandeau). */
  title: string;
  unitTitle: string;
  /** Bandeau d'univers : son rang (1-based), étapes faites et total. */
  unitIndex?: number;
  done?: number;
  total?: number;
}

/**
 * Tout le chemin, de la première case à la dernière (façon Duolingo) : un bandeau par univers, ses étapes, son coffre.
 * Le premier univers est fait pendant l'inscription (le test) : son bandeau le dit. L'écran défile jusqu'à l'étape du jour.
 */
export function pathAll(map: Pick<CheminMap, 'units' | 'currentStepId'>): PathNode[] {
  const all: PathNode[] = [];
  map.units.forEach((u, i) => {
    if (i > 0)
      all.push({
        key: `${u.id}:unit`,
        kind: 'unit',
        title: u.title,
        unitTitle: u.title,
        unitIndex: i + 1,
        done: u.done,
        total: u.total,
      });
    for (const s of u.steps) {
      const kind: PathNodeKind =
        s.id === map.currentStepId
          ? 'current'
          : s.state === 'done'
            ? 'done'
            : s.state === 'current'
              ? 'current'
              : 'locked';
      all.push({ key: `${u.id}:${s.id}`, kind, title: s.title, unitTitle: u.title });
    }
    if (u.steps.length > 0)
      all.push({
        key: `${u.id}:chest`,
        kind: u.state === 'done' ? 'chestOpen' : 'chest',
        title: u.title,
        unitTitle: u.title,
      });
  });
  let seen = false;
  for (const n of all) {
    if (n.kind !== 'current') continue;
    if (seen) n.kind = 'locked';
    seen = true;
  }
  return all;
}

/** Étapes faites gardées avant celle du jour, et étapes montrées en tout. */
const BEFORE = 2;
const WINDOW = 7;

/**
 * La suite d'étapes du chemin (un coffre à la fin de chaque unité), puis une fenêtre autour de l'étape du jour : deux
 * faites avant, elle, et la suite (coffre, verrouillées). Parcours fini : les dernières, toutes faites.
 */
export function pathWindow(map: Pick<CheminMap, 'units' | 'currentStepId'>): PathNode[] {
  const all: PathNode[] = [];
  for (const u of map.units) {
    for (const s of u.steps) {
      const kind: PathNodeKind =
        s.id === map.currentStepId
          ? 'current'
          : s.state === 'done'
            ? 'done'
            : s.state === 'current'
              ? 'current'
              : 'locked';
      all.push({ key: `${u.id}:${s.id}`, kind, title: s.title, unitTitle: u.title });
    }
    if (u.steps.length > 0)
      all.push({
        key: `${u.id}:chest`,
        kind: u.state === 'done' ? 'chestOpen' : 'chest',
        title: u.title,
        unitTitle: u.title,
      });
  }
  // Une seule étape « du jour » : la première rencontrée (le serveur n'en donne qu'une).
  let seen = false;
  for (const n of all) {
    if (n.kind !== 'current') continue;
    if (seen) n.kind = 'locked';
    seen = true;
  }
  const at = all.findIndex((n) => n.kind === 'current');
  if (at < 0) return all.slice(Math.max(0, all.length - WINDOW));
  const start = Math.max(0, Math.min(at - BEFORE, all.length - WINDOW));
  return all.slice(start, start + WINDOW);
}

/**
 * Le chemin par chapitres (un univers = un chapitre), dans l'ordre : son bandeau, ses étapes, son coffre. L'écran les
 * montre du bas vers le haut (on monte en avançant) : à l'affichage, la liste est retournée.
 */
export function pathChapters(map: Pick<CheminMap, 'units' | 'currentStepId'>): { unitId: string; current: boolean; nodes: PathNode[] }[] {
  const all = pathAll(map);
  const out: { unitId: string; current: boolean; nodes: PathNode[] }[] = [];
  for (const n of all) {
    const unitId = n.key.split(':')[0] ?? '';
    let ch = out[out.length - 1];
    if (!ch || ch.unitId !== unitId) {
      ch = { unitId, current: false, nodes: [] };
      out.push(ch);
    }
    ch.nodes.push(n);
    if (n.kind === 'current') ch.current = true;
  }
  return out;
}

// ── Accueil : le bandeau de la séance ─────────────────────────────────────────
export type TodayView =
  /** La séance du jour attend. */
  | { kind: 'todo'; unitTitle: string; questions: number }
  /** La séance bonus attend (gagnée par un geste social). */
  | { kind: 'bonus'; unitTitle: string; questions: number }
  /** Séance faite : la personne du jour (ou l'état vide) et « Demain, une nouvelle séance ». */
  | { kind: 'done'; hint: string | null }
  /** Tout est fait (séance et bonus), ou plus rien à poser aujourd'hui. */
  | { kind: 'rest'; hint: string | null };

export const SESSION_SIZE = 5;

/** L'étape du jour sur tout le chemin (« étape 4 sur 12 ») : rang 1-based, sinon le nombre d'étapes faites. */
export function stepOf(map: Pick<CheminMap, 'units' | 'currentStepId'>): { step: number; steps: number } {
  const all = map.units.flatMap((u) => u.steps);
  const at = map.currentStepId ? all.findIndex((s) => s.id === map.currentStepId) : -1;
  const done = all.filter((s) => s.state === 'done').length;
  return { step: at >= 0 ? at + 1 : Math.max(1, done), steps: all.length };
}

/** Le titre de l'unité en cours (celle de l'étape du jour), sinon la dernière commencée. */
export function currentUnitTitle(map: Pick<CheminMap, 'units' | 'currentStepId' | 'title'>): string {
  const unit =
    map.units.find((u) => u.steps.some((s) => s.id === map.currentStepId)) ??
    map.units.find((u) => u.state === 'current') ??
    map.units[map.units.length - 1];
  return unit?.title ?? map.title;
}

export function todayView(map: Pick<CheminMap, 'units' | 'currentStepId' | 'title' | 'today'>): TodayView {
  const unitTitle = currentUnitTitle(map);
  switch (map.today.state) {
    case 'todo':
      return { kind: 'todo', unitTitle, questions: SESSION_SIZE };
    case 'bonus':
      return { kind: 'bonus', unitTitle, questions: SESSION_SIZE };
    case 'done':
      return { kind: 'done', hint: map.today.quota.bonusHint };
    default:
      return { kind: 'rest', hint: null };
  }
}

/** Une séance à faire maintenant (du jour ou bonus). */
export const hasSessionToDo = (map: Pick<CheminMap, 'today'> | undefined): boolean =>
  map?.today.state === 'todo' || map?.today.state === 'bonus';

// ── Séance : l'ordre des questions, « Passer cette question » ─────────────────
export type AnswerPick = { optionId: string } | { value: number };
export interface SeanceProgress {
  /** Identifiants des questions, dans l'ordre où elles seront posées (une passée repart à la fin). */
  queue: string[];
  /** Réponses données. */
  answers: Record<string, AnswerPick>;
  /** Questions passées au moins une fois (pour ne pas la proposer sans fin). */
  skipped: string[];
}

export const startSeance = (session: { questions: readonly { id: string }[] }): SeanceProgress => ({
  queue: session.questions.map((q) => q.id),
  answers: {},
  skipped: [],
});

/** La question en cours : la première de la file sans réponse. */
export const currentQuestionId = (p: SeanceProgress): string | null =>
  p.queue.find((id) => !(id in p.answers)) ?? null;

/** Réponses données (pour la barre « 2/5 »). */
export const answeredCount = (p: SeanceProgress): number => Object.keys(p.answers).length;

/**
 * Le serveur veut une réponse à chaque question (aucune réponse inventée) : « Passer » remet la question à la fin de
 * la file, on y reviendra. Impossible quand elle est la dernière sans réponse.
 */
export const canSkip = (p: SeanceProgress): boolean => p.queue.filter((id) => !(id in p.answers)).length > 1;

export function skipQuestion(p: SeanceProgress): SeanceProgress {
  const id = currentQuestionId(p);
  if (!id || !canSkip(p)) return p;
  return {
    ...p,
    queue: [...p.queue.filter((x) => x !== id), id],
    skipped: p.skipped.includes(id) ? p.skipped : [...p.skipped, id],
  };
}

export const answerQuestion = (p: SeanceProgress, questionId: string, pick: AnswerPick): SeanceProgress => ({
  ...p,
  answers: { ...p.answers, [questionId]: pick },
});

export const seanceDone = (p: SeanceProgress): boolean => currentQuestionId(p) === null;

/** Le corps de `POST /v1/chemin/reponses` : toutes les questions, une fois chacune, dans l'ordre de la séance. */
export function answersBody(
  session: { id: string; questions: readonly { id: string }[] },
  p: SeanceProgress,
) {
  return {
    sessionId: session.id,
    answers: session.questions.flatMap((q) => {
      const a = p.answers[q.id];
      if (!a) return [];
      return [
        {
          questionId: q.id,
          ...('optionId' in a
            ? { optionId: a.optionId }
            : { value: Math.max(0, Math.min(100, Math.round(a.value))) }),
        },
      ];
    }),
  };
}

// ── Réactions ─────────────────────────────────────────────────────────────────
export interface Reaction {
  text: string;
  animation: string | null;
}

/** La réaction du minimoa à une réponse : celle de l'option, ou (curseur) celle du bout ou du milieu. */
export function reactionFor(
  q: Pick<CheminQuestion, 'options' | 'slider'>,
  pick: AnswerPick | undefined,
): Reaction | null {
  if (!pick) return null;
  if ('optionId' in pick) return q.options.find((o) => o.id === pick.optionId)?.reaction ?? null;
  const r = q.slider?.reactions;
  if (!r) return null;
  return pick.value < 35 ? r.low : pick.value > 65 ? r.high : r.mid;
}

// ── Distance à gros grains ───────────────────────────────────────────────────
export type DistanceBand = 'neighborhood' | 'near' | 'around';

/**
 * Une distance dite sans précision (positions déjà arrondies par le serveur) : dans ton quartier (1,5 km), à moins
 * de 5 km, sinon « autour de toi ». Jamais un chiffre au mètre.
 */
export function distanceBand(from: LatLng, to: LatLng): DistanceBand {
  const r = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(to.latitude - from.latitude);
  const dLng = rad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * r * Math.asin(Math.min(1, Math.sqrt(a)));
  return km <= 1.5 ? 'neighborhood' : km <= 5 ? 'near' : 'around';
}

// ── Profil ────────────────────────────────────────────────────────────────────
/** En dessous, une jauge est « encore floue » (grisée). */
export const FOGGY_BELOW = 25;

export const knowsStep = (level: Profil['knows']['level']): 1 | 2 | 3 =>
  level === 'little' ? 1 : level === 'well' ? 2 : 3;

/** Les jauges de « Ce que Nino sait de toi », les plus sûres d'abord, les floues à la fin. */
export function profilGauges(p: Pick<Profil, 'gauges'>) {
  return [...p.gauges]
    .map((g) => ({ ...g, foggy: g.confidence < FOGGY_BELOW }))
    .sort((a, b) => Number(a.foggy) - Number(b.foggy));
}
