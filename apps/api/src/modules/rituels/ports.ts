import type { DailyKind, DailyStatus, Day, HabitRhythm, OutingAnswer, ProofVerdict, StreakState, VisionAxis } from '@blowy/domain';

// ── État des rituels d'une personne (une ligne par personne) ───────────────
export interface RitualStateRecord {
  userId: string;
  streak: StreakState;
  /** Dernier jour d'ouverture de l'app (écrit une fois par jour) : les tâches planifiées ne visent que les personnes actives. */
  lastSeenOn: Day | null;
  /** Dernière réponse à « Tu es sorti aujourd'hui ? » et son jour. */
  outingOn: Day | null;
  outingAnswer: OutingAnswer | null;
  outingConfirmed: boolean;
  /** Habitudes tenues depuis toujours (compteur des objets liés). */
  habitsKept: number;
  /** Marqueurs d'idempotence des notifications planifiées. */
  dailyNotifiedOn: Day | null;
  dangerNotifiedOn: Day | null;
  needsOutNotifiedOn: Day | null;
  /** Lundi de la dernière semaine dont le bilan a été traité. */
  reviewWeek: Day | null;
}
export type RitualMarker = 'dailyNotifiedOn' | 'dangerNotifiedOn' | 'needsOutNotifiedOn' | 'reviewWeek';
export type RitualStatePatch = Partial<Omit<RitualStateRecord, 'userId'>>;

export const EMPTY_RITUAL_STATE = (userId: string): RitualStateRecord => ({
  userId,
  streak: { current: 0, best: 0, lastDoneOn: null, jokerDays: [] },
  lastSeenOn: null,
  outingOn: null,
  outingAnswer: null,
  outingConfirmed: false,
  habitsKept: 0,
  dailyNotifiedOn: null,
  dangerNotifiedOn: null,
  needsOutNotifiedOn: null,
  reviewWeek: null,
});

export interface RitualStatesRepository {
  find(userId: string): Promise<RitualStateRecord | null>;
  findMany(userIds: readonly string[]): Promise<RitualStateRecord[]>;
  /** Crée la ligne si besoin et n'écrit que les champs donnés. */
  upsert(userId: string, patch: RitualStatePatch): Promise<void>;
  /** Pose un marqueur de tâche sur plusieurs personnes (une écriture par lot). */
  mark(userIds: readonly string[], marker: RitualMarker, value: Day): Promise<void>;
  /** Ajoute `n` au compteur d'habitudes tenues (atomique) et rend la nouvelle valeur. */
  addHabitsKept(userId: string, n: number): Promise<number>;
  /**
   * Personnes vues depuis `sinceDay`, par identifiant croissant après `afterUserId` (curseur des tâches).
   * `pending` : seulement celles dont le marqueur est vide ou avant `before` (pas encore traitées) — une tâche
   * interrompue reprend là où elle en était sans relire ce qui est fait.
   */
  listActive(sinceDay: Day, afterUserId: string | null, limit: number, pending?: { marker: RitualMarker; before: Day }): Promise<RitualStateRecord[]>;
}

// ── Défi du jour ───────────────────────────────────────────────────────────
export interface DailyChallengeRecord {
  userId: string;
  day: Day;
  challengeId: string;
  kind: DailyKind;
  axis: VisionAxis | null;
  status: DailyStatus;
  answer: 0 | 1 | null;
  photoId: string | null;
  seenAt: string | null;
  acceptedAt: string | null;
  doneAt: string | null;
  createdAt: string;
}
export type DailyChallengePatch = Partial<Pick<DailyChallengeRecord, 'status' | 'answer' | 'photoId' | 'seenAt' | 'acceptedAt' | 'doneAt'>>;

export interface DailyChallengesRepository {
  find(userId: string, day: Day): Promise<DailyChallengeRecord | null>;
  /** Insère le défi du jour s'il n'existe pas encore et rend celui qui est enregistré (course : le premier gagne). */
  insertIfAbsent(record: DailyChallengeRecord): Promise<DailyChallengeRecord>;
  update(userId: string, day: Day, patch: DailyChallengePatch): Promise<void>;
  /**
   * Passe à « fait » seulement s'il ne l'était pas (atomique) : vrai si c'est cet appel qui l'a fait.
   * Garantit qu'une série n'avance qu'une fois même si deux requêtes arrivent ensemble.
   */
  markDone(userId: string, day: Day, patch: DailyChallengePatch, doneAt: string): Promise<boolean>;
  /** Défis du jour de plusieurs personnes (tâches planifiées). */
  findForDay(userIds: readonly string[], day: Day): Promise<DailyChallengeRecord[]>;
  /** Défis des jours `from` à `to` (inclus). */
  listBetween(userId: string, from: Day, to: Day): Promise<DailyChallengeRecord[]>;
}

// ── Habitudes ──────────────────────────────────────────────────────────────
export interface HabitRecord {
  id: string;
  userId: string;
  habitId: string;
  rhythm: HabitRhythm;
  proofHour: number;
  createdAt: string;
  archivedAt: string | null;
  /** Dernier jour où la preuve a été demandée par notification. */
  askedOn: Day | null;
}

export interface HabitsRepository {
  listActive(userId: string): Promise<HabitRecord[]>;
  find(id: string): Promise<HabitRecord | null>;
  /** Faux si la personne suit déjà cette habitude. */
  create(habit: HabitRecord): Promise<boolean>;
  update(id: string, patch: Partial<Pick<HabitRecord, 'rhythm' | 'proofHour' | 'archivedAt' | 'askedOn'>>): Promise<void>;
  /** Preuve demandée aujourd'hui pour ces habitudes (une écriture par lot). */
  markAsked(ids: readonly string[], day: Day): Promise<void>;
  /** Habitudes actives dont l'heure de preuve est passée (≤ `hour`) et pas encore demandées `today`, curseur sur l'id. */
  listToAsk(hour: number, today: Day, afterId: string | null, limit: number): Promise<HabitRecord[]>;
}

export interface HabitCheckRecord {
  id: string;
  habitRef: string;
  userId: string;
  day: Day;
  verdict: ProofVerdict;
  /** Phrase du minimoa. */
  line: string;
  photoId: string | null;
  createdAt: string;
}

export interface HabitChecksRepository {
  find(habitRef: string, day: Day): Promise<HabitCheckRecord | null>;
  /** Une preuve par habitude et par jour : une nouvelle preuve (après un « non ») remplace la précédente. */
  upsert(check: HabitCheckRecord): Promise<void>;
  /** Preuves de ces habitudes depuis `from` (inclus). */
  listSince(habitRefs: readonly string[], from: Day): Promise<HabitCheckRecord[]>;
  /** Preuves qui comptent (oui / pas sûr) d'une personne entre deux jours (inclus). */
  countKept(userId: string, from: Day, to: Day): Promise<number>;
}

// ── Photos privées (preuves et défis photo) ────────────────────────────────
export type RitualPhotoSource = 'habit' | 'daily';
export interface RitualPhotoRecord {
  id: string;
  userId: string;
  source: RitualPhotoSource;
  day: Day;
  path: string;
  caption: string;
  /** Gardée dans les souvenirs privés ; sinon supprimée sous 24 h. */
  keep: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface RitualPhotosRepository {
  create(photo: RitualPhotoRecord): Promise<void>;
  find(id: string): Promise<RitualPhotoRecord | null>;
  setKeep(id: string, keep: boolean): Promise<void>;
  /** Photos non gardées, pas encore supprimées, créées avant `beforeIso` (les plus anciennes d'abord). */
  listExpired(beforeIso: string, limit: number): Promise<RitualPhotoRecord[]>;
  markDeleted(ids: readonly string[], at: string): Promise<void>;
  /** Photos d'une personne encore dans le stockage (suppression du compte). */
  listLive(userId: string): Promise<RitualPhotoRecord[]>;
  /** Souvenirs privés : photos gardées, de la plus récente à la plus ancienne, strictement avant `before`. */
  listKept(userId: string, before: string | null, limit: number): Promise<RitualPhotoRecord[]>;
}

// ── Bilans de la semaine ───────────────────────────────────────────────────
export interface ReviewFacts {
  outings: number;
  habitsKept: number;
  challengesDone: number;
  streak: number;
  bestStreak: number;
  jokersUsed: number;
}

export interface WeeklyReviewRecord {
  id: string;
  userId: string;
  weekStart: Day;
  facts: ReviewFacts;
  did: string[];
  noticed: string;
  tip: string;
  links: string[];
  text: string;
  /** Texte reformulé par l'IA (sinon assemblé des modèles de phrases). */
  coached: boolean;
  detailed: { axes: string[]; links: string[] } | null;
  /** Valeurs des axes de vision à la fin de la semaine (sert au mouvement de la semaine suivante). */
  vision: Partial<Record<VisionAxis, number>>;
  readAt: string | null;
  createdAt: string;
}

export interface WeeklyReviewsRepository {
  /** Faux si le bilan de cette semaine existe déjà (idempotent). */
  insertIfAbsent(review: WeeklyReviewRecord): Promise<boolean>;
  find(id: string): Promise<WeeklyReviewRecord | null>;
  /** Du plus récent au plus ancien, semaines strictement avant `before`. */
  list(userId: string, before: Day | null, limit: number): Promise<WeeklyReviewRecord[]>;
  latestUnread(userId: string): Promise<WeeklyReviewRecord | null>;
  markRead(id: string, at: string): Promise<void>;
}

// ── Ports externes ─────────────────────────────────────────────────────────
export interface HabitProofInput {
  userId: string;
  locale: string;
  habitId: string;
  /** Chemin de la photo dans le stockage privé. */
  path: string;
}
export interface HabitProofVerdict {
  verdict: ProofVerdict;
  /** Vrai si la décision vient d'un modèle (faux : repli « pas sûr » ou adaptateur mémoire). */
  byModel: boolean;
}
/** Vérifie une preuve d'habitude. Ne lève jamais : en cas de doute ou de panne, « pas sûr » (on fait confiance). */
export interface HabitVerifier {
  verify(input: HabitProofInput): Promise<HabitProofVerdict>;
}

export interface CoachInput {
  userId: string;
  locale: string;
  /** Bilan assemblé des modèles de phrases (déjà validé par le garde-fou). */
  template: string;
}
/** Reformule un bilan ; null : garder le modèle (IA refusée, en panne, ou texte rejeté par le garde-fou). */
export interface Coach {
  rephrase(input: CoachInput): Promise<string | null>;
}

/** Image d'une photo privée, réduite à 512 px de côté au plus (pour un petit modèle de vision). */
export interface ProofImages {
  read512(path: string): Promise<{ base64: string; mediaType: 'image/jpeg' | 'image/webp' } | null>;
}
