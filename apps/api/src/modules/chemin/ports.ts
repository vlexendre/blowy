import type { BonusReason, CheminFormat, CheminStatus, Day, Locale, VisionAxis } from '@blowy/domain';

/** Textes par langue : le français toujours, les autres si traduits (repli : français). */
export type ByLocale<T> = { fr: T } & Partial<Record<Exclude<Locale, 'fr'>, T>>;
export const inLocale = <T>(texts: ByLocale<T>, locale: Locale): T => texts[locale] ?? texts.fr;

// ── Contenu (piloté par le back, modifiable dans l'administration) ───────────
export interface ContentStep {
  id: string;
  unitId: string;
  position: number;
  status: CheminStatus;
  texts: ByLocale<{ title: string }>;
}
export interface ContentUnit {
  id: string;
  position: number;
  icon: string;
  minBuild: number;
  status: CheminStatus;
  texts: ByLocale<{ title: string; subtitle: string }>;
  steps: ContentStep[];
  updatedAt: string;
}
export interface ContentOption {
  id: string;
  position: number;
  icon: string;
  weight: number;
  tag: string | null;
  animation: string | null;
  reactionMinBuild: number;
  texts: ByLocale<{ label: string; reaction: string }>;
}
export interface ContentQuestion {
  id: string;
  stepId: string | null;
  position: number;
  format: CheminFormat;
  axis: VisionAxis;
  direction: 1 | -1;
  minBuild: number;
  legacyTestId: string | null;
  status: CheminStatus;
  texts: ByLocale<{ text: string; opener: string; mid?: string }>;
  options: ContentOption[];
  updatedAt: string;
}
/** Habillage : transition entre deux questions ou scène de fin, jouable à partir de `minBuild`. */
export interface ContentScene {
  id: string;
  kind: 'transition' | 'end';
  animation: string;
  minBuild: number;
  status: CheminStatus;
}
export interface CheminContent {
  units: ContentUnit[];
  questions: ContentQuestion[];
  scenes: ContentScene[];
}

export interface CheminContentRepository {
  /** Tout le contenu (tous statuts) : l'API filtre ce qui est en ligne. */
  load(): Promise<CheminContent>;
  upsertQuestion(q: ContentQuestion): Promise<void>;
  setQuestionStatus(id: string, status: CheminStatus, at: string): Promise<boolean>;
  /** Unité et ses étapes (une étape absente du corps n'est pas supprimée). */
  upsertUnit(u: ContentUnit): Promise<void>;
  /** Statut d'une unité et de toutes ses étapes. */
  setUnitStatus(id: string, status: CheminStatus, at: string): Promise<boolean>;
}

// ── Avancement d'une personne ────────────────────────────────────────────────
export interface CheminProgressRecord {
  userId: string;
  completedSteps: string[];
  sessionsDone: number;
  answersCount: number;
  /** Jour du bonus gagné et pourquoi (au plus un par jour). */
  bonusOn: Day | null;
  bonusReason: BonusReason | null;
  /** Personnes arrivées grâce à elle, déjà vues (un nouveau venu fait gagner le bonus). */
  referralsSeen: number;
  /** Dernière app vue sur Ton chemin (le rappel du matin n'en parle qu'aux builds qui l'ont). */
  lastBuild: number | null;
  lastPlatform: string | null;
  lastSessionOn: Day | null;
  createdAt: string;
  updatedAt: string;
}
export type CheminProgressPatch = Partial<Omit<CheminProgressRecord, 'userId' | 'createdAt'>>;

export interface CheminProgressRepository {
  find(userId: string): Promise<CheminProgressRecord | null>;
  findMany(userIds: readonly string[]): Promise<CheminProgressRecord[]>;
  /** Crée la ligne si besoin et n'écrit que les champs donnés. */
  upsert(userId: string, patch: CheminProgressPatch, at: string): Promise<CheminProgressRecord>;
}

export interface CheminSessionRecord {
  id: string;
  userId: string;
  day: Day;
  /** 0 : séance du jour · 1 : bonus. */
  slot: 0 | 1;
  kind: 'step' | 'review';
  stepId: string | null;
  /** Questions et format servi, dans l'ordre. */
  questions: { questionId: string; format: CheminFormat; review: boolean }[];
  status: 'open' | 'done';
  /** Résultat rendu à la fin (rejoué tel quel : idempotence). */
  result: unknown;
  createdAt: string;
  completedAt: string | null;
}

export interface CheminSessionsRepository {
  find(id: string): Promise<CheminSessionRecord | null>;
  /** Séances d'une personne pour un jour. */
  listForDay(userId: string, day: Day): Promise<CheminSessionRecord[]>;
  /** Insère si (personne, jour, créneau) est libre ; rend la séance enregistrée (course : la première gagne). */
  insertIfAbsent(s: CheminSessionRecord): Promise<CheminSessionRecord>;
  /** Passe à « faite » seulement si elle ne l'était pas : vrai si c'est cet appel. */
  markDone(id: string, at: string): Promise<boolean>;
  saveResult(id: string, result: unknown): Promise<void>;
  /** Jours avec une séance faite, entre deux jours inclus. */
  doneDays(userId: string, from: Day, to: Day): Promise<Day[]>;
  /** Séances faites un jour donné (administration) : nombre, personnes distinctes, bonus. */
  statsForDay(day: Day): Promise<{ sessions: number; people: number; bonus: number }>;
}

export interface CheminAnswerRecord {
  userId: string;
  sessionId: string;
  questionId: string;
  optionId: string | null;
  value: number | null;
  axis: VisionAxis;
  /** Valeur enregistrée sur l'axe (sens appliqué). */
  signal: number;
  day: Day;
  answeredAt: string;
}

export interface CheminAnswersRepository {
  insertMany(rows: readonly CheminAnswerRecord[]): Promise<void>;
  /** Dernier jour de réponse de chaque question répondue par la personne. */
  lastAnswered(userId: string): Promise<Map<string, Day>>;
  /** Dernière réponse de chacune de ces personnes à chacune de ces questions. */
  latestFor(userIds: readonly string[], questionIds: readonly string[]): Promise<CheminAnswerRecord[]>;
  count(userId: string): Promise<number>;
}
