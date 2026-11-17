import type { Day, Shape } from '@blowy/domain';
import type { ModerationActionKind } from '@blowy/contract';

// ── Suspensions et journal ────────────────────────────────────────────────

export interface SuspensionRecord {
  userId: string;
  since: string;
  /** Null : jusqu'à levée. */
  until: string | null;
  reason: string;
  byEmail: string;
}

export interface SuspensionsRepository {
  find(userId: string): Promise<SuspensionRecord | null>;
  put(record: SuspensionRecord): Promise<void>;
  remove(userId: string): Promise<void>;
  /** Suspensions en cours à `now`, de la plus récente à la plus ancienne. */
  listActive(now: string, cursor: string | null, limit: number): Promise<SuspensionRecord[]>;
  /** Parmi ces personnes, celles dont la suspension court à `now` (une requête). */
  activeAmong(userIds: readonly string[], now: string): Promise<Set<string>>;
}

export interface AuditRecord {
  id: string;
  at: string;
  adminEmail: string;
  action: ModerationActionKind;
  targetUserId: string | null;
  targetName: string | null;
  reportId: string | null;
  reason: string;
  until: string | null;
}

export interface AuditFilter {
  action?: ModerationActionKind;
  /** Recherche sur le prénom recopié, l'adresse de l'admin ou le motif. */
  q?: string;
  targetUserId?: string;
}

export interface AuditLogRepository {
  append(entry: Omit<AuditRecord, 'id'>): Promise<AuditRecord>;
  /** Du plus récent au plus ancien ; `cursor` = identifiant de la dernière ligne de la page précédente. */
  page(filter: AuditFilter, cursor: string | null, limit: number): Promise<AuditRecord[]>;
}

// ── Signalements ──────────────────────────────────────────────────────────

export interface AdminReportRow {
  id: string;
  reporter: string | null;
  targetUser: string | null;
  linkId: string | null;
  messageId: string | null;
  /** Signalement dans un groupe (spéc §26) : le groupe et le message signalé. */
  groupId?: string | null;
  groupMessageId?: string | null;
  reason: string;
  details: string | null;
  createdAt: string;
  handledAt: string | null;
  handledBy: string | null;
  resolution: ModerationActionKind | null;
  /** 0 normal · 1 haut · 2 urgent ; la file des ouverts commence par les plus prioritaires. */
  priority: number;
  source: 'person' | 'filter';
  category: string | null;
  /** Monde d'exemple du compte de revue d'Apple. */
  review: boolean;
}

export interface ReportFilter {
  status: 'open' | 'handled' | 'all';
  reason?: string;
  /** Personnes dont le prénom correspond à la recherche (calculé avant, par le cas d'usage). */
  targetIds?: readonly string[];
}

export interface ContextMessage {
  id: string;
  linkId: string;
  authorKind: 'user' | 'pet' | 'system';
  authorId: string | null;
  kind: string;
  body: string | null;
  mediaPath: string | null;
  createdAt: string;
}

export interface ModerationRepository {
  /** Ouverts : les plus prioritaires d'abord, puis du plus ancien au plus récent ; les autres : du plus récent au plus ancien. */
  page(filter: ReportFilter, cursor: string | null, limit: number): Promise<AdminReportRow[]>;
  find(id: string): Promise<AdminReportRow | null>;
  counts(now: string, overdueHours: number): Promise<{ open: number; overdue: number }>;
  /** Signalements (ouverts et au total) visant chacune de ces personnes. */
  countsByTarget(userIds: readonly string[]): Promise<Map<string, { open: number; total: number }>>;
  /** Marque traités le signalement donné (ou, sans id, tous ceux ouverts sur la personne). */
  resolve(input: { reportId: string | null; targetUserId: string; at: string; by: string; resolution: ModerationActionKind }): Promise<void>;
  /** Le message signalé et au plus `around` messages avant et après, dans son lien. */
  context(linkId: string, messageId: string, around: number): Promise<ContextMessage[]>;
  /** Prénoms (profils) correspondant à une recherche, pour filtrer. */
  searchPeople(q: string, limit: number): Promise<string[]>;
}

// ── Activité et statistiques ──────────────────────────────────────────────

export interface ActivityRepository {
  /** Note qu'une personne a utilisé l'app ce jour-là (idempotent). */
  touch(userId: string, day: Day): Promise<void>;
  purgeBefore(day: Day): Promise<number>;
  /** Personnes actives ce jour-là, par identifiant croissant (échantillon des statistiques), `limit` au plus. */
  usersOn(day: Day, afterUserId: string | null, limit: number): Promise<string[]>;
}

export interface TopMinimoaRow {
  userId: string;
  ownerName: string;
  petName: string;
  species: string;
  activeLinks: number;
}

/** Chiffres d'un jour civil (Europe/Paris). Les instantanés (abonnés, liens…) sont pris au moment du calcul. */
export interface DailyMetrics {
  accountsTotal: number;
  accountsNew: number;
  dau: number;
  wau: number;
  mau: number;
  d1Cohort: number;
  d1Retained: number;
  d7Cohort: number;
  d7Retained: number;
  d30Cohort: number;
  d30Retained: number;
  subscribers: number;
  trials: number;
  newTrials: number;
  petMessages: number;
  petMessagesAnswered: number;
  encountersWaved: number;
  encountersAccepted: number;
  linksActive: number;
  linksGhost: number;
  linksArchived: number;
  /** Liens actifs où les deux ont écrit ce jour-là (série des liens, spéc §24) ; null pour un jour calculé avant. */
  linksWroteTogether: number | null;
  reportsOpened: number;
  reportsHandled: number;
  reportsOpen: number;
  top: TopMinimoaRow[];
  /** Apports des autres chantiers (null : non fournis). */
  averageStreak: number | null;
  encountersProposed: number | null;
  averageCompatibility: number | null;
  shapes: Record<Shape, number> | null;
  visions: { axis: 'foyer' | 'ancrage' | 'elan' | 'rythme' | 'cap'; buckets: number[] }[] | null;
  /** Forme et série des minimoas du classement, par personne. */
  topDetails: Record<string, { shape: Shape | null; streak: number | null }>;
}

export interface DailyStatsRow {
  day: Day;
  metrics: DailyMetrics;
  computedAt: string;
}

/** Calcul des chiffres de base d'un jour (une requête SQL côté Supabase). */
export interface MetricsSource {
  compute(day: Day): Promise<Omit<DailyMetrics, 'averageStreak' | 'encountersProposed' | 'averageCompatibility' | 'shapes' | 'visions' | 'topDetails'>>;
}

export interface DailyStatsRepository {
  get(day: Day): Promise<DailyStatsRow | null>;
  /** Jours de `from` à `to` inclus, triés. */
  range(from: Day, to: Day): Promise<DailyStatsRow[]>;
  latest(): Promise<DailyStatsRow | null>;
  put(row: DailyStatsRow): Promise<void>;
  /**
   * Retire des jours antérieurs à `before` ce qui nomme des personnes (classement `top`, `topDetails`) : les chiffres
   * gardés ensuite ne permettent plus d'identifier quelqu'un (politique de confidentialité). Rend le nombre de jours changés.
   */
  forgetPeopleBefore(before: Day): Promise<number>;
}
