/**
 * Contrat « rituels » (V7) : ce qui fait revenir chaque jour et fait évoluer le minimoa.
 * - Sortie du jour : « Tu es sorti aujourd’hui ? » (fait monter la sociabilité, besoin principal du minimoa).
 * - Défi du jour : choisi par le serveur, un par jour ; la carte monte en plein écran tant qu’elle n’a pas été vue.
 * - Série : +1 par jour avec le défi fait, jokers, paliers qui débloquent des objets (une lecture légère pour le widget).
 * - Habitudes : catalogue, rythme, preuve en photo vérifiée (oui / non / pas sûr ; « pas sûr » compte).
 * - Bilan de la semaine : le dimanche soir, toujours positif.
 *
 * Jours au format AAAA-MM-JJ, jours de Paris. Les textes (questions, consignes, phrases du minimoa) viennent du serveur.
 * Ce fichier ne dépend que de zod et du domaine (pas de `../index`, pour éviter un import circulaire).
 */
import {
  AXIS_MOVE_SIZES,
  DAILY_KINDS,
  DAILY_STATUSES,
  HABIT_RHYTHMS,
  ITEM_IDS,
  OUTING_ANSWERS,
  PROOF_VERDICTS,
  VISION_AXES,
  WEEK_DAY_STATUSES,
} from '@blowy/domain';
import { z } from 'zod';

const API = '/v1/rituals';
const Iso = z.string();
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ItemId = z.enum(ITEM_IDS as [string, ...string[]]);
const VisionAxisZ = z.enum(VISION_AXES);
const percent = z.number().int().min(0).max(100);

// ── Sortie du jour ─────────────────────────────────────────────────────────
/** saw_people : « Oui, j’ai vu du monde » · walk : « Oui, un tour » · not_yet : « Pas encore ». */
export const OutingAnswerZ = z.enum(OUTING_ANSWERS);
export type OutingAnswer = z.infer<typeof OutingAnswerZ>;

export const OutingStateZ = z.object({
  /** « Tu es sorti aujourd’hui ? » */
  question: z.string(),
  answers: z.array(z.object({ id: OutingAnswerZ, label: z.string() })).length(3),
  /** Vrai tant qu’aucune sortie n’est comptée aujourd’hui (« pas encore » laisse la question ouverte). */
  canAnswer: z.boolean(),
  /** Dernière réponse du jour, ou null. */
  answer: OutingAnswerZ.nullable(),
  /** Une position hors de la zone du domicile (app ouverte) a confirmé la sortie. */
  confirmed: z.boolean(),
});
export type OutingState = z.infer<typeof OutingStateZ>;

/**
 * Réponse à la question. La réponse est déclarative et on la croit. `awayFromHome` : l’app sait que la position
 * actuelle est hors de la zone du domicile ; sinon le serveur regarde le dernier relevé de position du jour.
 */
export const OutingBody = z.object({ answer: OutingAnswerZ, awayFromHome: z.boolean().optional() });
export type OutingBody = z.infer<typeof OutingBody>;

// ── Série ──────────────────────────────────────────────────────────────────
export const WeekDayStatusZ = z.enum(WEEK_DAY_STATUSES);
export const StreakZ = z.object({
  /** Jours d’affilée avec le défi fait (aujourd’hui compris s’il est fait). */
  current: z.number().int().min(0),
  /** Record, toujours affiché. */
  best: z.number().int().min(0),
  /** Défi du jour fait aujourd’hui. */
  doneToday: z.boolean(),
  /** La série est en jeu : elle existe et le défi n’est pas encore fait. */
  atRisk: z.boolean(),
  /**
   * Prochain palier dont l’objet n’est pas encore gagné (3, 7, 14, 30, 60, 100 ; un palier ne se gagne qu’une fois,
   * quand le record le franchit) et cet objet ; null quand les six sont gagnés.
   */
  nextMilestone: z.object({ days: z.number().int(), itemId: ItemId.nullable() }).nullable(),
  /** Jokers restants cette semaine (lundi → dimanche) ; chacun protège automatiquement un jour manqué. */
  jokersLeft: z.number().int().min(0),
  jokersPerWeek: z.number().int().min(0),
  /**
   * Lundi → dimanche. done : défi fait (ou jour compté par la série) · joker : jour protégé · missed : jour passé sans
   * défi · today : à faire · future · not_yet : avant le premier jour de la personne (neutre).
   */
  week: z.array(z.object({ day: Day, status: WeekDayStatusZ })).length(7),
});
export type Streak = z.infer<typeof StreakZ>;

// ── Défi du jour ───────────────────────────────────────────────────────────
export const DailyKindZ = z.enum(DAILY_KINDS);
export const DailyStatusZ = z.enum(DAILY_STATUSES);
export const DailyChallengeZ = z.object({
  day: Day,
  id: z.string(),
  /** question : 2 choix · photo : prendre une photo · write : écrire dans un lien · go_out : sortir. */
  kind: DailyKindZ,
  kindLabel: z.string(),
  /** Ce que le minimoa propose (question ou consigne). */
  text: z.string(),
  /** Questions seulement : les deux réponses (envoyer l’index 0 ou 1). */
  choices: z.array(z.string()).length(2).nullable(),
  /** Ce qu’il reste à faire pour que le défi compte. */
  howTo: z.string(),
  /** offered → seen → accepted → done (on peut faire le défi directement). */
  status: DailyStatusZ,
  /**
   * Le serveur décide : la carte doit monter en plein écran à cette ouverture (première ouverture du jour,
   * tant qu’elle n’a pas été vue). L’app appelle `seen` une fois la carte montrée, qu’elle soit acceptée ou rangée.
   */
  present: z.boolean(),
  /** Index de la réponse choisie (questions faites). */
  answer: z.union([z.literal(0), z.literal(1)]).nullable(),
  /** Axe de vision que le défi vise (une question en éclaire un) ; null pour un défi qui n'en vise aucun. */
  axis: VisionAxisZ.nullable().optional(),
});
export type DailyChallenge = z.infer<typeof DailyChallengeZ>;

export const DailyAnswerBody = z.object({ choice: z.union([z.literal(0), z.literal(1)]) });
export const RitualPhotoTicketBody = z.object({ contentType: z.enum(['image/jpeg', 'image/webp']) });
/** Photo envoyée avec un ticket. `keep` : la garder dans les souvenirs privés (sinon supprimée sous 24 h). */
export const RitualPhotoBody = z.object({ path: z.string().min(1).max(300), keep: z.boolean().default(false) });
export type RitualPhotoBody = z.input<typeof RitualPhotoBody>;

/** Réponse de toute action sur le défi du jour. */
export const DailyResultZ = z.object({
  challenge: DailyChallengeZ,
  streak: StreakZ,
  /** Ce que dit le minimoa (null si rien). */
  line: z.string().nullable(),
  /** Objets débloqués par cette action (palier de série), à fêter. */
  newItems: z.array(ItemId),
  /**
   * Défi photo : la photo enregistrée, pour proposer « la garder dans mes souvenirs privés » après coup
   * (`POST /v1/rituals/photos/:id/keep`, comme une preuve d'habitude) ; null sinon.
   */
  photoId: z.string().uuid().nullable().optional(),
});
export type DailyResult = z.infer<typeof DailyResultZ>;

// ── Aujourd’hui (accueil) ──────────────────────────────────────────────────
/** Tout ce que l’accueil montre des rituels, en une requête. */
export const RitualsTodayZ = z.object({
  day: Day,
  challenge: DailyChallengeZ,
  streak: StreakZ,
  outing: OutingStateZ,
  /** Sociabilité du minimoa (besoin principal, de 0 à 100) et s’il a besoin de sortir. */
  sociability: percent,
  needsOut: z.boolean(),
  /** Habitudes à faire aujourd’hui, et celles dont la preuve est demandée maintenant. */
  habitsDue: z.number().int().min(0),
  proofAsked: z.array(z.object({ habitRef: z.string().uuid(), ask: z.string() })),
  /** Dernier bilan non lu (dimanche soir), ou null. */
  unreadReviewId: z.string().uuid().nullable(),
});
export type RitualsToday = z.infer<typeof RitualsTodayZ>;

export const OutingResultZ = z.object({
  outing: OutingStateZ,
  /** Réponse du minimoa. */
  line: z.string(),
  sociability: percent,
  /** Le défi du jour (« sortir » se valide ici). */
  challenge: DailyChallengeZ,
  streak: StreakZ,
  newItems: z.array(ItemId),
});
export type OutingResult = z.infer<typeof OutingResultZ>;

// ── Habitudes ──────────────────────────────────────────────────────────────
export const HabitRhythmZ = z.enum(HABIT_RHYTHMS);
export const ProofVerdictZ = z.enum(PROOF_VERDICTS);

// ── Rigueur et habitudes partagées (spéc §25) ──────────────────────────────
/** Rigueur (jauge) : `value` de 0 à 100, ou null avec `tooEarly` (moins de 7 jours dus sur 28). */
export const RigourZ = z.object({
  value: z.number().int().min(0).max(100).nullable(),
  tooEarly: z.boolean(),
  /** Jours dus comptés sur la période (pour dire « sur N jours »). */
  dueDays: z.number().int().min(0),
});
export type Rigour = z.infer<typeof RigourZ>;

const SideZ = z.object({
  rhythm: HabitRhythmZ,
  /** Jours (tous les jours) ou semaines (3 fois par semaine) d'affilée. */
  streak: z.number().int().min(0),
  rigour: RigourZ,
});

/** « Vous tenez tous les deux : Sport » : les deux séries et les deux rigueurs. Jamais de photo ni d'heure. */
export const SharedHabitZ = z.object({
  habitId: z.string(),
  label: z.string(),
  mine: SideZ,
  theirs: SideZ,
});
export type SharedHabit = z.infer<typeof SharedHabitZ>;

/**
 * Habitudes communes avec une autre personne (fiche d'une rencontre, onglet « Le lien »). Vide si l'une des deux a
 * coupé « Montrer mes habitudes », est bloquée, suspendue ou supprimée (`Audience`), ou si rien n'est commun.
 */
export const SharedHabitsZ = z.object({
  habits: z.array(SharedHabitZ),
  /** Rigueur de l'autre sur toutes ses habitudes ; null quand rien n'est montré. */
  theirRigour: RigourZ.nullable(),
});
export type SharedHabits = z.infer<typeof SharedHabitsZ>;

export const HabitDefZ = z.object({
  id: z.string(),
  label: z.string(),
  /** Ce que le minimoa demandera en photo. */
  ask: z.string(),
  axis: VisionAxisZ,
  /** Tournée vers les autres : fait monter la sociabilité. */
  social: z.boolean(),
  rhythm: HabitRhythmZ,
  proofHour: z.number().int().min(0).max(23),
});
export type HabitDef = z.infer<typeof HabitDefZ>;

export const HabitCatalogueZ = z.object({
  habits: z.array(HabitDefZ),
  rhythms: z.array(z.object({ id: HabitRhythmZ, label: z.string() })),
  /** Habitudes suivies en même temps : 2 sans Minimoa+, 6 avec. */
  limit: z.number().int(),
  used: z.number().int(),
});
export type HabitCatalogue = z.infer<typeof HabitCatalogueZ>;

export const HabitZ = z.object({
  /** Identifiant de l’habitude suivie (à utiliser dans les routes). */
  ref: z.string().uuid(),
  habitId: z.string(),
  label: z.string(),
  ask: z.string(),
  social: z.boolean(),
  rhythm: HabitRhythmZ,
  rhythmLabel: z.string(),
  proofHour: z.number().int().min(0).max(23),
  today: z.object({
    doneToday: z.boolean(),
    doneThisWeek: z.number().int(),
    target: z.number().int(),
    /** À faire aujourd’hui. */
    due: z.boolean(),
    /** Le minimoa demande la preuve maintenant (l’heure est passée). */
    askNow: z.boolean(),
    /** Verdict de la dernière preuve du jour et la phrase du minimoa. */
    verdict: ProofVerdictZ.nullable(),
    line: z.string().nullable(),
  }),
  /** Jours (tous les jours) ou semaines (3 fois par semaine) d’affilée. */
  streak: z.number().int(),
  since: Iso,
  /** Rigueur sur 28 jours (spéc §25) ; absente des réponses des anciennes API. */
  rigour: RigourZ.optional(),
});
export type Habit = z.infer<typeof HabitZ>;

export const HabitsZ = z.object({
  habits: z.array(HabitZ),
  limit: z.number().int(),
  canAdd: z.boolean(),
  /** Ta rigueur sur toutes tes habitudes actives, pondérée par les jours dus (spéc §25). */
  rigour: RigourZ.optional(),
  /** Réglage « Montrer mes habitudes » (Moi) : coupé, rien n'est montré et aucune suggestion « ensemble ». */
  shared: z.boolean().optional(),
});
export type Habits = z.infer<typeof HabitsZ>;

export const AddHabitBody = z.object({
  habitId: z.string().min(1).max(40),
  rhythm: HabitRhythmZ.optional(),
  /** Heure (Paris) de la demande de preuve ; par défaut celle du catalogue. */
  proofHour: z.number().int().min(6).max(21).optional(),
});
export type AddHabitBody = z.infer<typeof AddHabitBody>;
/** Habitude choisie pendant l'inscription (étape « Tes habitudes », 2 au plus, « tous les jours » par défaut). */
export const OnboardHabitZ = z.object({ habitId: z.string().min(1).max(40), rhythm: HabitRhythmZ.optional() });
export type OnboardHabit = z.infer<typeof OnboardHabitZ>;
export const UpdateHabitBody = z.object({ rhythm: HabitRhythmZ.optional(), proofHour: z.number().int().min(6).max(21).optional() });
export type UpdateHabitBody = z.infer<typeof UpdateHabitBody>;

/**
 * Résultat d’une preuve. La photo est privée : aucun humain ne la voit ; une IA tierce la vérifie seulement si la
 * personne l’a accepté (`GET /v1/me/ai`, `proofs.consent`), sinon personne ne la vérifie et elle compte comme « pas sûr ».
 * Elle est supprimée sous 24 h, sauf si la personne la garde (`keep`). « pas sûr » compte comme tenu ; après un « non »,
 * on peut réessayer.
 */
export const ProofResultZ = z.object({
  photoId: z.string().uuid(),
  verdict: ProofVerdictZ,
  counted: z.boolean(),
  /** Phrase gentille du minimoa. */
  line: z.string(),
  kept: z.boolean(),
  habit: HabitZ,
  newItems: z.array(ItemId),
});
export type ProofResult = z.infer<typeof ProofResultZ>;

/**
 * Habitude validée sans photo ni IA (« Sans vérification par IA », ou accord pour l'IA retiré) : la personne dit
 * qu'elle l'a tenue, ça compte comme un « pas sûr » (on fait confiance). Rien n'est envoyé à un prestataire.
 */
export const HabitDoneResultZ = z.object({
  verdict: ProofVerdictZ,
  counted: z.boolean(),
  /** Phrase du minimoa. */
  line: z.string(),
  habit: HabitZ,
  newItems: z.array(ItemId),
});
export type HabitDoneResult = z.infer<typeof HabitDoneResultZ>;

export const KeepPhotoBody = z.object({ keep: z.boolean() });

// ── Souvenirs privés (photos gardées) ──────────────────────────────────────
export const PrivateMemoryZ = z.object({
  id: z.string().uuid(),
  day: Day,
  /** habit : preuve d’habitude · daily : photo du défi du jour. */
  source: z.enum(['habit', 'daily']),
  /** Libellé de l’habitude ou consigne du défi. */
  caption: z.string(),
  url: z.string(),
  at: Iso,
});
export const PrivateMemoriesZ = z.object({ items: z.array(PrivateMemoryZ), nextBefore: Iso.nullable() });
export type PrivateMemories = z.infer<typeof PrivateMemoriesZ>;

// ── Bilan de la semaine ────────────────────────────────────────────────────
export const WeeklyReviewZ = z.object({
  id: z.string().uuid(),
  /** Lundi de la semaine racontée. */
  weekStart: Day,
  title: z.string(),
  /** Ce que tu as fait (sorties, habitudes, défis, série). */
  did: z.array(z.string()),
  /** Ce que le minimoa a remarqué de ta vision. */
  noticed: z.string(),
  /**
   * Comment chaque axe a bougé depuis le bilan d’avant, en gros : direction (up : vers le pôle + · down · steady) et
   * taille (small, medium, large ; null si l’axe ne bouge pas). Vide pour un premier bilan ou un bilan plus ancien.
   */
  axisMoves: z
    .array(z.object({ axis: VisionAxisZ, direction: z.enum(['up', 'down', 'steady']), size: z.enum(AXIS_MOVE_SIZES).nullable() }))
    .optional(),
  /** Un conseil : une proposition. */
  tip: z.string(),
  /** Un mot par lien actif. */
  links: z.array(z.string()),
  /** Le bilan en un texte (reformulé par le minimoa pour les semaines actives, sinon assemblé des phrases ci-dessus). */
  text: z.string(),
  facts: z.object({
    outings: z.number().int(),
    habitsKept: z.number().int(),
    challengesDone: z.number().int(),
    streak: z.number().int(),
    bestStreak: z.number().int(),
  }),
  /** Minimoa+ : chaque axe sur 4 semaines et l’état de chaque lien ; null sans Minimoa+. */
  detailed: z.object({ axes: z.array(z.string()), links: z.array(z.string()) }).nullable(),
  read: z.boolean(),
  at: Iso,
});
export type WeeklyReview = z.infer<typeof WeeklyReviewZ>;
/** Bilans du plus récent au plus ancien, par pages (`?before=<nextBefore>`, un lundi). */
export const WeeklyReviewsZ = z.object({ reviews: z.array(WeeklyReviewZ), nextBefore: Day.nullable() });
export type WeeklyReviews = z.infer<typeof WeeklyReviewsZ>;

// ── Routes ─────────────────────────────────────────────────────────────────
export const ritualRoutes = {
  today: () => `${API}/today`,
  streak: () => `${API}/streak`,
  outing: () => `${API}/outing`,
  dailySeen: () => `${API}/today/seen`,
  dailyAccept: () => `${API}/today/accept`,
  dailyAnswer: () => `${API}/today/answer`,
  dailyPhotoTicket: () => `${API}/today/photo/ticket`,
  dailyPhoto: () => `${API}/today/photo`,
  dailyComplete: () => `${API}/today/complete`,
  habitCatalogue: () => `${API}/habits/catalogue`,
  habits: () => `${API}/habits`,
  habit: (ref: string) => `${API}/habits/${ref}`,
  habitProofTicket: (ref: string) => `${API}/habits/${ref}/proof/ticket`,
  habitProof: (ref: string) => `${API}/habits/${ref}/proof`,
  /** Habitude tenue sans photo (aucune IA) : `POST`, sans corps. */
  habitDone: (ref: string) => `${API}/habits/${ref}/done`,
  photoKeep: (photoId: string) => `${API}/photos/${photoId}/keep`,
  memories: () => `${API}/memories`,
  reviews: () => `${API}/reviews`,
  review: (id: string) => `${API}/reviews/${id}`,
  reviewRead: (id: string) => `${API}/reviews/${id}/read`,
} as const;
