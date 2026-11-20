/**
 * Contrat « Ton chemin » (docs/CHEMIN.md) : la carte (unités, étapes, état, série, quota), la séance du jour (5
 * questions filtrées selon ce que l'app sait afficher), les réponses, et le profil (« ce que Nino sait de toi »).
 * Tous les textes (questions, options, réactions, titres) viennent du serveur, dans la langue de la requête.
 * Ce fichier ne dépend que de zod et du domaine ; le résultat des réponses, qui contient une présentation
 * (`SuggestionZ`), est dans `index.ts` (`CheminResultZ`).
 */
import {
  BONUS_REASONS,
  CHEMIN_FORMATS,
  CHEMIN_NODE_STATES,
  FREEZE_PERIODS,
  ITEM_IDS,
  KNOWS_LEVELS,
  MINIMOA_TYPES,
  VISION_AXES,
  WEEK_DAY_STATUSES,
} from '@blowy/domain';
import { z } from 'zod';
import { VisionAxisReadingZ } from './vision';

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ItemId = z.enum(ITEM_IDS as [string, ...string[]]);
const count = z.number().int().min(0);

export const CheminFormatZ = z.enum(CHEMIN_FORMATS);
export const CheminNodeStateZ = z.enum(CHEMIN_NODE_STATES);
export const BonusReasonZ = z.enum(BONUS_REASONS);
export const KnowsLevelZ = z.enum(KNOWS_LEVELS);
export const MinimoaTypeZ = z.enum(MINIMOA_TYPES);

// ── Quota, série, « il te connaît » ──────────────────────────────────────────
/** Une séance par jour (avec ou sans Minimoa+), plus un bonus gagné par un geste social (un par jour au plus). */
export const CheminQuotaZ = z.object({
  free: count,
  /** 1 si le bonus du jour est gagné. */
  bonus: count,
  /** invite_signup : un pote invité s'est inscrit · wave_answered : tu as répondu à un bonjour reçu. */
  bonusReason: BonusReasonZ.nullable(),
  used: count,
  left: count,
  /** Prochaine séance : 0 (du jour), 1 (bonus) ; null : plus rien aujourd'hui. */
  nextSlot: z.union([z.literal(0), z.literal(1)]).nullable(),
  /** Comment gagner le bonus (null s'il est déjà gagné). */
  bonusHint: z.string().nullable(),
});
export type CheminQuota = z.infer<typeof CheminQuotaZ>;

/** La série (une seule : défi du jour d'avant ou séance de Ton chemin), avec ses gels et ses paliers. */
export const CheminStreakZ = z.object({
  current: count,
  best: count,
  doneToday: z.boolean(),
  atRisk: z.boolean(),
  /** Gels restants dans la période (1 par mois en gratuit, 1 par semaine avec Minimoa+). */
  freezesLeft: count,
  freezesPerPeriod: count,
  freezePeriod: z.enum(FREEZE_PERIODS),
  /** Paliers 7, 30, 100, 365 : l'objet gagné (null : pas encore d'objet pour ce palier) et s'il est atteint. */
  milestones: z.array(z.object({ days: count, itemId: ItemId.nullable(), reached: z.boolean() })),
  nextMilestone: z.object({ days: count, itemId: ItemId.nullable() }).nullable(),
  week: z.array(z.object({ day: Day, status: z.enum(WEEK_DAY_STATUSES) })).length(7),
});
export type CheminStreak = z.infer<typeof CheminStreakZ>;

/** « Il te connaît : un peu / bien / très bien » (confiance moyenne des 5 axes). */
export const CheminKnowsZ = z.object({ level: KnowsLevelZ, label: z.string(), percent: z.number().int().min(0).max(100) });
export type CheminKnows = z.infer<typeof CheminKnowsZ>;

// ── Carte ────────────────────────────────────────────────────────────────────
export const CheminStepZ = z.object({ id: z.string(), title: z.string(), state: CheminNodeStateZ });
export const CheminUnitZ = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  /** Emoji ou nom d'illustration. */
  icon: z.string(),
  state: CheminNodeStateZ,
  done: count,
  total: count,
  steps: z.array(CheminStepZ),
});
/** todo : la séance du jour attend · done : faite (plus rien) · bonus : le bonus attend · all_done : séance et bonus faits. */
export const CheminTodayStateZ = z.enum(['todo', 'done', 'bonus', 'all_done']);
export const CheminMapZ = z.object({
  title: z.string(),
  units: z.array(CheminUnitZ),
  currentStepId: z.string().nullable(),
  stepsDone: count,
  stepsTotal: count,
  today: z.object({ day: Day, state: CheminTodayStateZ, quota: CheminQuotaZ, line: z.string() }),
  streak: CheminStreakZ,
  knows: CheminKnowsZ,
  plus: z.boolean(),
});
export type CheminMap = z.infer<typeof CheminMapZ>;

// ── Séance ───────────────────────────────────────────────────────────────────
/**
 * `?formats=choice,slider` (facultatif) : formats que l'app sait afficher. Sans : le build (`x-app-build`) décide
 * seul (`minBuild` de chaque question, repli en choix simple sinon).
 */
export const CheminSessionQuery = z.object({ formats: z.string().max(200).optional() });
export type CheminSessionQuery = z.infer<typeof CheminSessionQuery>;

/** Réaction du minimoa à une réponse. `animation` : null si l'app ne la connaît pas (texte seul). */
export const CheminReactionZ = z.object({ text: z.string(), animation: z.string().nullable() });
export const CheminOptionZ = z.object({ id: z.string(), label: z.string(), icon: z.string(), reaction: CheminReactionZ });
export const CheminQuestionZ = z.object({
  id: z.string(),
  /** Format servi à cette app (repli éventuel déjà appliqué). */
  format: CheminFormatZ,
  text: z.string(),
  /** Question déjà posée un autre jour. */
  review: z.boolean(),
  /** Choix : 2 à 4 options. Curseur : 2 (bout gauche, bout droit). */
  options: z.array(CheminOptionZ).min(2).max(6),
  /** Curseur seulement : position de départ et réaction selon où il s'arrête. */
  slider: z
    .object({ min: z.literal(0), max: z.literal(100), start: z.number().int().min(0).max(100), reactions: z.object({ low: CheminReactionZ, mid: CheminReactionZ, high: CheminReactionZ }) })
    .nullable(),
});
export type CheminQuestion = z.infer<typeof CheminQuestionZ>;

/** Habillage (transition entre deux questions, scène de fin) : un nom que l'app sait jouer, sinon le repli. */
export const CheminSceneZ = z.object({ id: z.string(), animation: z.string() });

export const CheminSessionZ = z.object({
  id: z.string().uuid(),
  day: Day,
  slot: z.enum(['daily', 'bonus']),
  kind: z.enum(['step', 'review']),
  step: z.object({ id: z.string(), title: z.string(), unitId: z.string(), unitTitle: z.string() }).nullable(),
  /** Ce que dit le minimoa avant la première question. */
  intro: z.string(),
  questions: z.array(CheminQuestionZ).min(1).max(10),
  transition: CheminSceneZ,
  endScene: CheminSceneZ,
  /** Déjà terminée (relire le résultat avec le même `POST`, idempotent). */
  done: z.boolean(),
});
export type CheminSession = z.infer<typeof CheminSessionZ>;

/**
 * Minimoa animé (docs/MOTION.md, « Minimoa animé ») : le lecteur à utiliser pour l'espèce du minimoa de la personne,
 * réglé par l'API (aucun personnage codé en dur dans l'app). `events` : noms des événements à déclencher une fois
 * (`fire`) pour rire, réfléchir, applaudir ; le minimoa revient seul au repos. Un fournisseur inconnu d'une app
 * ancienne : la lecture tolérante retire tout l'objet (image actuelle du minimoa).
 */
export const MascotZ = z.object({
  provider: z.enum(['masko']),
  /** Adresse de livraison du personnage (`https://api.masko.ai/v1/canvases/<id>/delivery`). */
  url: z.string().url(),
  /** Clé d'application publique (lecture des releases de ce personnage seulement) : pas un secret. */
  appKey: z.string().min(1),
  events: z.object({ happy: z.string().min(1), think: z.string().min(1), cheer: z.string().min(1) }),
});
export type Mascot = z.infer<typeof MascotZ>;

/** `GET /v1/chemin/seance` : la séance à faire maintenant, ou pourquoi il n'y en a pas. */
export const CheminSessionResponseZ = z.object({
  session: CheminSessionZ.nullable(),
  quota: CheminQuotaZ,
  /** quota_used : plus de séance aujourd'hui · nothing_left : rien à poser pour l'instant. */
  reason: z.enum(['quota_used', 'nothing_left']).nullable(),
  message: z.string().nullable(),
  /**
   * Le minimoa animé de la personne (null : pas de personnage animé pour son espèce, image habituelle). Facultatif :
   * une API plus ancienne ne l'envoie pas.
   */
  mascot: MascotZ.nullable().optional(),
});
export type CheminSessionResponse = z.infer<typeof CheminSessionResponseZ>;

/** Une réponse : `optionId` pour un choix, `value` (0 à 100) pour un curseur. */
export const CheminAnswerZ = z.object({
  questionId: z.string().min(1).max(60),
  optionId: z.string().min(1).max(40).optional(),
  value: z.number().int().min(0).max(100).optional(),
});
/** Toutes les réponses d'une séance, en une fois. Idempotent par séance : renvoyer donne le même résultat. */
export const CheminAnswersBody = z.object({ sessionId: z.string().uuid(), answers: z.array(CheminAnswerZ).min(1).max(10) });
export type CheminAnswersBody = z.infer<typeof CheminAnswersBody>;

/** Révélation de fin de séance : une phrase sur toi, tirée des réponses du jour. */
export const CheminRevelationZ = z.object({ title: z.string(), text: z.string(), axis: z.enum(VISION_AXES).nullable() });

export const CheminProgressZ = z.object({
  stepId: z.string().nullable(),
  stepDone: z.boolean(),
  unitId: z.string().nullable(),
  unitDone: z.boolean(),
  next: z.object({ stepId: z.string(), title: z.string(), unitTitle: z.string() }).nullable(),
  stepsDone: count,
  stepsTotal: count,
});

/** Personne du jour introuvable : état honnête. */
export const CheminEmptyZ = z.object({
  /** first_here : personne de compatible près de toi pour l'instant · no_location : sans zone, pas de voisins · not_ready : il faut d'abord mieux te connaître. */
  reason: z.enum(['first_here', 'no_location', 'not_ready']),
  title: z.string(),
  text: z.string(),
});

// ── Profil ───────────────────────────────────────────────────────────────────
export const ProfilZ = z.object({
  title: z.string(),
  /** Type de minimoa (« Le phare ») ; null tant qu'il n'en sait pas assez (`typeHint`). */
  type: z.object({ id: MinimoaTypeZ, name: z.string(), line: z.string() }).nullable(),
  typeHint: z.string().nullable(),
  knows: CheminKnowsZ,
  /** Ce que Nino sait de toi : les 5 axes (valeur, confiance, formulation). */
  gauges: z.array(VisionAxisReadingZ).length(5),
  /** Réponses données dans Ton chemin. */
  answers: count,
  /** Rapport détaillé (Minimoa+) ; null sinon (`detailLocked`). */
  detail: z.object({ title: z.string(), lines: z.array(z.string()) }).nullable(),
  detailLocked: z.boolean(),
});
export type Profil = z.infer<typeof ProfilZ>;

export const cheminRoutes = {
  /** GET : la carte. */
  chemin: () => '/v1/chemin',
  /** GET : la séance à faire. */
  cheminSession: () => '/v1/chemin/seance',
  /** POST : les réponses d'une séance (idempotent). */
  cheminAnswers: () => '/v1/chemin/reponses',
  /** GET : ce que Nino sait de toi. */
  profil: () => '/v1/profil',
} as const;
