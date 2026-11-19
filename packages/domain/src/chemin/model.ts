/**
 * Ton chemin (docs/CHEMIN.md) : chaque jour, ton minimoa te pose 5 questions, puis te présente une personne près de
 * chez toi qui a répondu comme toi. Le parcours est fait d'UNITÉS thématiques, chacune d'ÉTAPES ; une étape = une
 * SÉANCE de 5 questions. Le contenu (questions, unités, étapes, habillages) vient de la base : ce fichier n'en décrit
 * que la forme et les règles. Pur : ni horloge, ni aléa ; le jour, la personne et le build sont des paramètres.
 */
import type { VisionAxis } from '../vision';

/**
 * Formats de question. V1 : `choice` (choix illustré, 2 à 4 options) et `slider` (curseur entre deux pôles).
 * Les autres existent dans le modèle mais ne partent qu'aux builds qui les déclarent (`minBuild` de la question) ;
 * sinon un repli en `choice` quand la question a 2 à 4 options, ou rien.
 */
export const CHEMIN_FORMATS = ['choice', 'slider', 'this_or_that', 'ranking', 'photo_choice'] as const;
export type CheminFormat = (typeof CHEMIN_FORMATS)[number];
/** Formats que toute app qui ouvre Ton chemin sait afficher. */
export const CHEMIN_V1_FORMATS: readonly CheminFormat[] = ['choice', 'slider'];

/** Cycle de vie d'un contenu : brouillon → relu → en ligne (seul « en ligne » part dans l'app). */
export const CHEMIN_STATUSES = ['draft', 'reviewed', 'live'] as const;
export type CheminStatus = (typeof CHEMIN_STATUSES)[number];

/** Une séance = 5 questions. */
export const SESSION_SIZE = 5;
/** Séances offertes chaque jour, avec ou sans Minimoa+ (Minimoa+ ne vend pas de questions). */
export const FREE_SESSIONS_PER_DAY = 1;
/** Séance bonus gagnée par un geste social : une par jour au plus. */
export const MAX_BONUS_PER_DAY = 1;
/** Ce qui fait gagner la séance bonus : un pote invité qui s'inscrit, une réponse à un bonjour reçu. */
export const BONUS_REASONS = ['invite_signup', 'wave_answered'] as const;
export type BonusReason = (typeof BONUS_REASONS)[number];

/** Écart (sur 100) sous lequel deux positions de curseur « se rejoignent ». */
export const SLIDER_AGREE_SPAN = 20;

/** Sujets interdits dans les questions (garde-fou éditorial, vérifié aussi par mots dans l'administration). */
export const CHEMIN_FORBIDDEN_TOPICS = ['mental_health', 'religion', 'politics', 'sexual_orientation'] as const;

/** Une option : où elle place la personne sur l'axe de la question (−100 à 100, avant le sens de la question). */
export interface CheminOption {
  id: string;
  /** Emoji ou nom d'illustration (l'app choisit). */
  icon: string;
  weight: number;
  /** Trait partagé lisible (« Vous deux : … ») ; null : rien à dire. */
  tag: string | null;
  /** Animation de la réaction du minimoa ; envoyée seulement aux builds ≥ `reactionMinBuild`, sinon texte seul. */
  reaction: { animation: string | null; minBuild: number };
}

export interface CheminQuestion {
  id: string;
  format: CheminFormat;
  axis: VisionAxis;
  /** Sens : 1, les options de poids positif tirent vers le pôle + de l'axe ; −1, l'inverse. */
  direction: 1 | -1;
  /** Choix : 2 à 4 options. Curseur : 2 (pôle gauche, pôle droit). */
  options: readonly CheminOption[];
  /** Plus petit build qui sait afficher la question telle quelle. */
  minBuild: number;
  status: CheminStatus;
  /** Situation du test de vision reprise (unité 1) : déjà connue de qui a passé le test. */
  legacyTestId: string | null;
}

export interface CheminStep {
  id: string;
  unitId: string;
  position: number;
  questionIds: readonly string[];
  status: CheminStatus;
}

export interface CheminUnit {
  id: string;
  position: number;
  icon: string;
  minBuild: number;
  status: CheminStatus;
  steps: readonly CheminStep[];
}

/** Le parcours tel qu'une personne peut le voir : unités et étapes en ligne, dans l'ordre, et leurs questions. */
export interface CheminCatalogue {
  units: readonly CheminUnit[];
  questions: ReadonlyMap<string, CheminQuestion>;
}

/** Réponse donnée (un choix ou une position de curseur de 0 à 100). */
export interface CheminAnswerInput {
  questionId: string;
  optionId: string | null;
  value: number | null;
}

/** Ce que l'app sait afficher : son build (null : inconnu, traité comme 0) et, si elle les déclare, ses formats. */
export interface ClientCapabilities {
  build: number | null;
  formats: readonly CheminFormat[] | null;
}

// ── Catalogue ────────────────────────────────────────────────────────────────

const byPosition = <T extends { position: number; id: string }>(a: T, b: T): number => a.position - b.position || a.id.localeCompare(b.id);

/**
 * Catalogue vu par l'app : seulement ce qui est en ligne, unités et étapes triées, étapes sans question retirées,
 * unités sans étape retirées. Une question en ligne d'une étape qui ne l'est pas reste invisible.
 */
export function liveCatalogue(units: readonly CheminUnit[], questions: readonly CheminQuestion[]): CheminCatalogue {
  const live = new Map(questions.filter((q) => q.status === 'live').map((q) => [q.id, q]));
  const out: CheminUnit[] = [];
  for (const unit of [...units].filter((u) => u.status === 'live').sort(byPosition)) {
    const steps = [...unit.steps]
      .filter((s) => s.status === 'live')
      .sort(byPosition)
      .map((s) => ({ ...s, questionIds: s.questionIds.filter((id) => live.has(id)) }))
      .filter((s) => s.questionIds.length > 0);
    if (steps.length > 0) out.push({ ...unit, steps });
  }
  return { units: out, questions: live };
}

export const allSteps = (c: CheminCatalogue): CheminStep[] => c.units.flatMap((u) => [...u.steps]);

// ── Ce que l'app sait afficher ───────────────────────────────────────────────

const canShow = (format: CheminFormat, minBuild: number, client: ClientCapabilities): boolean =>
  (client.build ?? 0) >= minBuild && (client.formats === null ? true : client.formats.includes(format));

/**
 * Forme sous laquelle la question part vers cette app : telle quelle si elle sait l'afficher, sinon un choix simple
 * (repli) si la question a 2 à 4 options et que l'app sait afficher un choix ; null : la question ne part pas.
 */
export function deliverableFormat(q: CheminQuestion, client: ClientCapabilities): CheminFormat | null {
  if (canShow(q.format, q.minBuild, client)) return q.format;
  if (q.format === 'slider') return null;
  const fallbackOk = q.options.length >= 2 && q.options.length <= 4 && (client.formats === null || client.formats.includes('choice'));
  return fallbackOk ? 'choice' : null;
}

/** Animation de la réaction envoyée à cette app (null : le texte seul). */
export const deliverableAnimation = (o: CheminOption, client: ClientCapabilities): string | null =>
  o.reaction.animation !== null && (client.build ?? 0) >= o.reaction.minBuild ? o.reaction.animation : null;

/** Unité visible par ce build. */
export const unitVisible = (u: CheminUnit, client: ClientCapabilities): boolean => (client.build ?? 0) >= u.minBuild;

// ── Réponses → vision ────────────────────────────────────────────────────────

/** Valeur sur l'axe (−100 à 100, sens appliqué) d'une réponse ; null si elle ne correspond pas à la question. */
export function answerValue(q: CheminQuestion, a: Pick<CheminAnswerInput, 'optionId' | 'value'>): number | null {
  let weight: number;
  if (q.format === 'slider') {
    if (a.value === null || !Number.isFinite(a.value) || a.value < 0 || a.value > 100) return null;
    // Curseur : 0 → pôle de l'option de gauche, 100 → pôle de l'option de droite.
    const [left, right] = [q.options[0]?.weight ?? -100, q.options[1]?.weight ?? 100];
    weight = left + ((right - left) * a.value) / 100;
  } else {
    const option = q.options.find((o) => o.id === a.optionId);
    if (!option) return null;
    weight = option.weight;
  }
  return Math.max(-100, Math.min(100, Math.round(weight * q.direction))) || 0;
}

/** Deux réponses à la même question « se rejoignent » : même option, ou curseurs à moins de SLIDER_AGREE_SPAN. */
export function answersAgree(q: CheminQuestion, a: Pick<CheminAnswerInput, 'optionId' | 'value'>, b: Pick<CheminAnswerInput, 'optionId' | 'value'>): boolean {
  if (q.format === 'slider') return a.value !== null && b.value !== null && Math.abs(a.value - b.value) <= SLIDER_AGREE_SPAN;
  return a.optionId !== null && a.optionId === b.optionId;
}

/** Trait lisible d'une réponse (option choisie ; curseur : l'option du côté où il penche, rien au milieu). */
export function answerTag(q: CheminQuestion, a: Pick<CheminAnswerInput, 'optionId' | 'value'>): string | null {
  if (q.format === 'slider') {
    if (a.value === null || (a.value > 35 && a.value < 65)) return null;
    return (a.value <= 35 ? q.options[0] : q.options[1])?.tag ?? null;
  }
  return q.options.find((o) => o.id === a.optionId)?.tag ?? null;
}
