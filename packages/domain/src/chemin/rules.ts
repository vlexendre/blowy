/**
 * Règles de Ton chemin : carte (unités, étapes, état), séance du jour (étape suivante, 5 questions, révisions),
 * quota (1 séance par jour + un bonus gagné), révélation de fin de séance, type de minimoa, « il te connaît », et
 * « ta personne du jour ». Pur.
 */
import type { Day } from '../days';
import { type AxisSide, VISION_AXES, type VisionAxis, type VisionProfile, sideOf } from '../vision';
import { seedOf } from '../rituels/week';
import {
  type BonusReason,
  type CheminAnswerInput,
  type CheminCatalogue,
  type CheminFormat,
  type CheminQuestion,
  type CheminStep,
  type ClientCapabilities,
  FREE_SESSIONS_PER_DAY,
  MAX_BONUS_PER_DAY,
  SESSION_SIZE,
  allSteps,
  answerTag,
  answersAgree,
  deliverableFormat,
  unitVisible,
} from './model';

// ── Carte ────────────────────────────────────────────────────────────────────

export const CHEMIN_NODE_STATES = ['done', 'current', 'locked'] as const;
export type CheminNodeState = (typeof CHEMIN_NODE_STATES)[number];

export interface CheminProgressInput {
  /** Étapes terminées (séances faites). */
  completedSteps: ReadonlySet<string>;
  /** Test de vision passé : les situations reprises dans l'unité 1 sont déjà connues. */
  testDone: boolean;
}

/** Une étape est faite si une séance l'a terminée, ou si toutes ses questions viennent du test déjà passé. */
export function stepDone(c: CheminCatalogue, step: CheminStep, p: CheminProgressInput): boolean {
  if (p.completedSteps.has(step.id)) return true;
  return p.testDone && step.questionIds.every((id) => c.questions.get(id)?.legacyTestId != null);
}

export interface CheminMapState {
  units: {
    id: string;
    state: CheminNodeState;
    steps: { id: string; state: CheminNodeState }[];
    done: number;
    total: number;
  }[];
  /** Étape à faire maintenant ; null : tout est fait (séances de révision). */
  currentStepId: string | null;
  stepsDone: number;
  stepsTotal: number;
}

/** État de la carte : la première étape non faite (dans l'ordre) est la courante, celles d'après sont fermées. */
export function cheminMap(
  c: CheminCatalogue,
  p: CheminProgressInput,
  client: ClientCapabilities,
): CheminMapState {
  let current: string | null = null;
  let stepsDone = 0;
  let stepsTotal = 0;
  const units = c.units
    .filter((u) => unitVisible(u, client))
    .map((u) => {
      const steps = u.steps.map((s) => {
        stepsTotal += 1;
        if (stepDone(c, s, p)) {
          stepsDone += 1;
          return { id: s.id, state: 'done' as const };
        }
        if (current === null) {
          current = s.id;
          return { id: s.id, state: 'current' as const };
        }
        return { id: s.id, state: 'locked' as const };
      });
      const done = steps.filter((s) => s.state === 'done').length;
      const state: CheminNodeState =
        done === steps.length ? 'done' : steps.some((s) => s.state === 'current') ? 'current' : 'locked';
      return { id: u.id, state, steps, done, total: steps.length };
    });
  return { units, currentStepId: current, stepsDone, stepsTotal };
}

// ── Séance du jour ───────────────────────────────────────────────────────────

export interface SessionPickInput {
  catalogue: CheminCatalogue;
  progress: CheminProgressInput;
  client: ClientCapabilities;
  /** Dernier jour de réponse de chaque question déjà répondue. */
  answeredOn: ReadonlyMap<string, Day>;
  /** Profil de vision : les révisions visent les axes les moins sûrs. */
  vision: VisionProfile;
  userId: string;
  day: Day;
}

export interface SessionQuestionPick {
  questionId: string;
  format: CheminFormat;
  /** Question déjà posée un autre jour (révision). */
  review: boolean;
}

export interface SessionPick {
  kind: 'step' | 'review';
  stepId: string | null;
  questions: SessionQuestionPick[];
}

/**
 * Les questions de la séance : celles de l'étape courante que l'app sait afficher (dans l'ordre), complétées par des
 * révisions jusqu'à SESSION_SIZE. Tout le parcours fait : une séance de révision. Révisions : questions déjà
 * répondues, axe le moins sûr d'abord, puis réponse la plus ancienne, puis un ordre stable propre à la personne et au
 * jour. null : rien à poser (catalogue vide ou rien d'affichable).
 */
export function pickSession(input: SessionPickInput): SessionPick | null {
  const { catalogue: c, client } = input;
  const map = cheminMap(c, input.progress, client);
  const step = map.currentStepId ? (allSteps(c).find((s) => s.id === map.currentStepId) ?? null) : null;
  const picked: SessionQuestionPick[] = [];
  if (step) {
    for (const id of step.questionIds) {
      const q = c.questions.get(id);
      const format = q ? deliverableFormat(q, client) : null;
      if (q && format && picked.length < SESSION_SIZE) picked.push({ questionId: id, format, review: false });
    }
  }
  const taken = new Set(picked.map((p) => p.questionId));
  const confidence = (q: CheminQuestion): number => input.vision[q.axis].confidence;
  const reviews = [...input.answeredOn.entries()]
    .flatMap(([id, on]) => {
      const q = c.questions.get(id);
      const format = q ? deliverableFormat(q, client) : null;
      return q && format && !taken.has(id) && on < input.day ? [{ q, on, format }] : [];
    })
    .sort(
      (a, b) =>
        confidence(a.q) - confidence(b.q) ||
        a.on.localeCompare(b.on) ||
        seedOf('chemin-review', input.userId, input.day, a.q.id) -
          seedOf('chemin-review', input.userId, input.day, b.q.id),
    );
  for (const r of reviews) {
    if (picked.length >= SESSION_SIZE) break;
    picked.push({ questionId: r.q.id, format: r.format, review: true });
  }
  if (picked.length === 0) return null;
  return step && picked.some((p) => !p.review)
    ? { kind: 'step', stepId: step.id, questions: picked }
    : { kind: 'review', stepId: null, questions: picked };
}

// ── Quota ────────────────────────────────────────────────────────────────────

export interface QuotaInput {
  /** Séances terminées aujourd'hui (séance du jour et bonus). */
  doneToday: number;
  /** Bonus gagné aujourd'hui (au plus un) et pourquoi. Ignoré depuis le 21 nov. 2026 (une séance par jour, sans bonus). */
  bonusReason: BonusReason | null;
  /** Minimoa+ : autant de séances que tu veux dans la journée. */
  plus?: boolean;
}

export interface CheminQuota {
  free: number;
  bonus: number;
  bonusReason: BonusReason | null;
  used: number;
  left: number;
  /** Prochaine séance à ouvrir : 0 (du jour) ou 1 (une de plus) ; null : plus rien aujourd'hui. */
  nextSlot: 0 | 1 | null;
  /** Minimoa+ : pas de limite dans la journée. */
  unlimited: boolean;
}

/** Séances qu'un Minimoa+ peut encore ouvrir, affiché comme « sans limite » (un nombre fini pour le contrat). */
export const PLUS_SESSIONS_LEFT = 99;

/**
 * Le quota du jour (façon Duolingo, 21 nov. 2026) : une séance par jour sans Minimoa+, autant qu'on veut avec. Rien ne
 * se cumule : un jour sans séance n'en donne pas deux le lendemain, et plus de séance bonus.
 */
export function cheminQuota(q: QuotaInput): CheminQuota {
  const used = Math.max(0, q.doneToday);
  if (q.plus)
    return {
      free: FREE_SESSIONS_PER_DAY,
      bonus: 0,
      bonusReason: null,
      used,
      left: PLUS_SESSIONS_LEFT,
      nextSlot: used === 0 ? 0 : 1,
      unlimited: true,
    };
  const done = Math.min(FREE_SESSIONS_PER_DAY, used);
  const left = FREE_SESSIONS_PER_DAY - done;
  return {
    free: FREE_SESSIONS_PER_DAY,
    bonus: 0,
    bonusReason: null,
    used: done,
    left,
    nextSlot: left > 0 ? 0 : null,
    unlimited: false,
  };
}

// ── Révélation de fin de séance ─────────────────────────────────────────────

export interface Revelation {
  axis: VisionAxis;
  side: AxisSide;
}

/**
 * Une phrase sur toi, tirée des réponses du jour : l'axe où la moyenne du jour penche le plus (à égalité, celui qui
 * compte le plus de réponses, puis l'ordre des axes) et son côté. null sans réponse.
 */
export function revelationOf(answers: readonly { axis: VisionAxis; value: number }[]): Revelation | null {
  let best: { axis: VisionAxis; mean: number; n: number } | null = null;
  for (const axis of VISION_AXES) {
    const vals = answers.filter((a) => a.axis === axis).map((a) => a.value);
    if (vals.length === 0) continue;
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    if (
      !best ||
      Math.abs(mean) > Math.abs(best.mean) ||
      (Math.abs(mean) === Math.abs(best.mean) && vals.length > best.n)
    )
      best = { axis, mean, n: vals.length };
  }
  return best ? { axis: best.axis, side: sideOf(best.mean) } : null;
}

// ── Type de minimoa et « il te connaît » ────────────────────────────────────

/**
 * Huit types, nommés d'après trois axes : rythme (calme ↔ dehors), cap (au jour le jour ↔ tout prévoir), élan (temps
 * pour soi ↔ grands projets). Textes dans `@blowy/content` (`cheminText.types`).
 */
export const MINIMOA_TYPES = [
  'phare',
  'cocon',
  'atelier',
  'hamac',
  'locomotive',
  'hote',
  'comete',
  'fanfare',
] as const;
export type MinimoaType = (typeof MINIMOA_TYPES)[number];
/** Confiance moyenne (rythme, cap, élan) sous laquelle le type n'est pas encore annoncé. */
export const TYPE_MIN_CONFIDENCE = 20;

export function minimoaTypeOf(p: VisionProfile): MinimoaType | null {
  const avg = (p.rythme.confidence + p.cap.confidence + p.elan.confidence) / 3;
  if (avg < TYPE_MIN_CONFIDENCE) return null;
  const out = p.rythme.value >= 0;
  const plan = p.cap.value >= 0;
  const projects = p.elan.value >= 0;
  if (!out) return plan ? (projects ? 'phare' : 'cocon') : projects ? 'atelier' : 'hamac';
  return plan ? (projects ? 'locomotive' : 'hote') : projects ? 'comete' : 'fanfare';
}

export const KNOWS_LEVELS = ['little', 'well', 'very_well'] as const;
export type KnowsLevel = (typeof KNOWS_LEVELS)[number];

/** « Il te connaît : un peu / bien / très bien », selon la confiance moyenne des 5 axes. */
export function knowsLevelOf(p: VisionProfile): { level: KnowsLevel; percent: number } {
  const percent = Math.round(VISION_AXES.reduce((s, a) => s + p[a].confidence, 0) / VISION_AXES.length);
  return { level: percent >= 60 ? 'very_well' : percent >= 30 ? 'well' : 'little', percent };
}

// ── Ta personne du jour ─────────────────────────────────────────────────────

export interface DayCandidate {
  id: string;
  compatibility: number;
  /** Ses réponses aux questions de la séance (les autres sont ignorées). */
  answers: ReadonlyMap<string, Pick<CheminAnswerInput, 'optionId' | 'value'>>;
}

export interface PersonOfDay {
  id: string;
  /** Questions de la séance où vos réponses se rejoignent / diffèrent, dans l'ordre de la séance. */
  agree: string[];
  differ: string[];
  /** Traits partagés (étiquettes des options choisies tous les deux), 3 au plus, sans doublon. */
  tags: string[];
  /** Question qui sert d'amorce (se rejoignent d'abord, puis diffèrent, sinon la première de la séance). */
  openerQuestionId: string | null;
}

/**
 * Parmi les présentations du jour (déjà filtrées par l'appariement et `Audience`), celle qui a le plus de réponses en
 * commun avec la séance ; à égalité, la plus compatible, puis l'ordre reçu. Les réponses de l'autre ne sont jamais
 * rendues : seulement des traits partagés et une question pour lancer la conversation.
 */
export function pickPersonOfDay(
  session: readonly { question: CheminQuestion; answer: Pick<CheminAnswerInput, 'optionId' | 'value'> }[],
  candidates: readonly DayCandidate[],
): PersonOfDay | null {
  let best: (PersonOfDay & { score: number; compat: number }) | null = null;
  for (const c of candidates) {
    const agree: string[] = [];
    const differ: string[] = [];
    const tags: string[] = [];
    for (const { question, answer } of session) {
      const theirs = c.answers.get(question.id);
      if (!theirs) continue;
      if (answersAgree(question, answer, theirs)) {
        agree.push(question.id);
        const tag = answerTag(question, answer);
        if (tag && answerTag(question, theirs) === tag && !tags.includes(tag) && tags.length < 3)
          tags.push(tag);
      } else differ.push(question.id);
    }
    const score = agree.length;
    if (!best || score > best.score || (score === best.score && c.compatibility > best.compat)) {
      best = {
        id: c.id,
        agree,
        differ,
        tags,
        openerQuestionId: agree[0] ?? differ[0] ?? session[0]?.question.id ?? null,
        score,
        compat: c.compatibility,
      };
    }
  }
  if (!best) return null;
  const { score: _s, compat: _c, ...out } = best;
  return out;
}
