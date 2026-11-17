import type { Gauges, Locale, QuizTrait, Species, ZoneInvite } from '@blowy/domain';

/** Jetons des dépôts du quiz et des quartiers (globaux : l'inscription, les codes et la garde-robe s'en servent). */
export const QUIZ_RESULTS = Symbol('QUIZ_RESULTS');
export const QUARTIERS = Symbol('QUARTIERS');

export interface QuizRecord {
  code: string;
  species: Species;
  trait: QuizTrait;
  second: QuizTrait | null;
  gauges: Gauges;
  /** Code du résultat de la personne qui a lancé le défi. */
  ref: string | null;
  locale: Locale;
  createdAt: string;
}

export interface QuizResultsRepository {
  /** Faux si le code existe déjà. */
  create(r: QuizRecord): Promise<boolean>;
  find(code: string): Promise<QuizRecord | null>;
  /** Efface les résultats créés avant `iso` ; rend le nombre effacé. */
  purgeBefore(iso: string): Promise<number>;
}

export interface ZoneRecord {
  zone: string;
  openedAt: string | null;
  openedBy: 'threshold' | 'admin' | null;
  createdAt: string;
}

export interface SignupRecord {
  id: string;
  zone: string;
  /** En minuscules ; null une fois effacée. */
  email: string | null;
  locale: Locale;
  code: string;
  token: string | null;
  invitedByUser: string | null;
  invitedBySignup: string | null;
  consentAt: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  openMailSentAt: string | null;
  userId: string | null;
  createdAt: string;
}

export interface ZoneCounts {
  /** Confirmées, non désinscrites : le compteur public. */
  confirmed: number;
  /** Envoyées, non désinscrites (confirmées ou non). */
  pending: number;
  /** E-mails d'ouverture partis. */
  notified: number;
  founders: number;
}

export interface FounderRecord {
  zone: string;
  rank: number;
  userId: string | null;
  signupId: string | null;
}

export interface QuartiersRepository {
  threshold(): Promise<number>;
  setThreshold(threshold: number, at: string): Promise<void>;
  findZone(zone: string): Promise<ZoneRecord | null>;
  /** Crée le quartier s'il n'existe pas encore. */
  ensureZone(zone: string, at: string): Promise<ZoneRecord>;
  listZones(): Promise<ZoneRecord[]>;
  /** Ouvre le quartier s'il ne l'est pas ; faux s'il l'était déjà. */
  open(zone: string, at: string, by: 'threshold' | 'admin'): Promise<boolean>;
  counts(zones: readonly string[]): Promise<Map<string, ZoneCounts>>;

  findSignup(by: { email?: string; token?: string; code?: string; id?: string }): Promise<SignupRecord | null>;
  /** Faux si l'adresse, le code ou le jeton existe déjà. */
  createSignup(s: SignupRecord): Promise<boolean>;
  updateSignup(id: string, patch: Partial<Omit<SignupRecord, 'id' | 'code'>>): Promise<SignupRecord | null>;
  /** Invitations confirmées d'un quartier (invité confirmé, non désinscrit) : `u:<compte>` ou `s:<inscription>`. */
  invitesOf(zone: string): Promise<ZoneInvite[]>;
  /** Pose les fondateurs d'un quartier (rien si déjà posés). */
  setFounders(zone: string, founders: readonly FounderRecord[], at: string): Promise<void>;
  founders(zone: string): Promise<FounderRecord[]>;
  /** Quartiers fondés par un compte (directement, ou par une inscription qu'il a reprise). */
  foundedBy(userId: string): Promise<number>;
  /** Inscriptions à prévenir : quartier ouvert, confirmées, adresse présente, e-mail d'ouverture pas encore parti. */
  toNotify(limit: number): Promise<SignupRecord[]>;
  /** Efface les inscriptions non confirmées créées avant `unconfirmedBefore` et les adresses prévenues avant `notifiedBefore`. */
  purge(unconfirmedBefore: string, notifiedBefore: string): Promise<number>;
}
