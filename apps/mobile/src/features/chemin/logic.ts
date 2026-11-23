/**
 * Ton chemin, côté app (docs/CHEMIN.md) : ce qui se calcule sans écran ni réseau. Le serveur décide de tout (unités,
 * étapes, séance, quota, personne du jour) ; ici, seulement la manière de l'afficher : le titre de l'univers du jour,
 * l'ordre des questions quand on en passe une, la réponse à envoyer, la réaction du curseur, et une distance dite à gros
 * grains (« dans ton quartier », jamais au mètre). L'accueil : `@/features/home`.
 */
import type { CheminMap, CheminQuestion, CheminResult, LatLng, Profil } from '@blowy/contract';
import { CHEMIN_STREAK_MILESTONES } from '@blowy/domain';

// ── Accueil ─────────────────────────────────────────────────────────────────────
// L'état du moment et les étapes montrées vivent dans `@/features/home` (`homeState`, `homeSteps`).
export const SESSION_SIZE = 5;

/** Le titre de l'unité en cours (celle de l'étape du jour), sinon la dernière commencée. */
export function currentUnitTitle(map: Pick<CheminMap, 'units' | 'currentStepId' | 'title'>): string {
  const unit =
    map.units.find((u) => u.steps.some((s) => s.id === map.currentStepId)) ??
    map.units.find((u) => u.state === 'current') ??
    map.units[map.units.length - 1];
  return unit?.title ?? map.title;
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

// ── Fin de séance ─────────────────────────────────────────────────────────────
/**
 * Le palier de série à fêter en plein écran (7, 30, 100, 365 jours), ou null. Seulement une séance tout juste
 * enregistrée (pas une réponse rejouée) et seulement un palier connu : tout autre nombre du serveur ne fête rien.
 */
export function milestoneToCelebrate(r: Pick<CheminResult, 'milestone' | 'alreadyRecorded'>): number | null {
  if (r.alreadyRecorded || r.milestone === null) return null;
  return (CHEMIN_STREAK_MILESTONES as readonly number[]).includes(r.milestone) ? r.milestone : null;
}
