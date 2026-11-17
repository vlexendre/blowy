import type { GroupEventKind } from '@blowy/content';
import type {
  Day,
  GroupDayOutcome,
  GroupKind,
  GroupMemberStatus,
  GroupStatus,
  MemberDayStatus,
} from '@blowy/domain';

// ── Groupes ────────────────────────────────────────────────────────────────
export interface GroupRecord {
  id: string;
  name: string;
  kind: GroupKind;
  /** Habitude du catalogue (groupe d'habitude), sinon null. */
  habitId: string | null;
  status: GroupStatus;
  createdBy: string | null;
  lives: number;
  streak: number;
  bestStreak: number;
  cleanDays: number;
  /** Jour (Paris) où le groupe a atteint 3 membres : jugé à partir du lendemain. */
  startedOn: Day | null;
  /** Dernier jour jugé. */
  evaluatedThrough: Day | null;
  fromTogether: boolean;
  closedAt: string | null;
  closedReason: string | null;
  createdAt: string;
  updatedAt: string;
}
export type GroupPatch = Partial<
  Omit<GroupRecord, 'id' | 'kind' | 'habitId' | 'createdAt' | 'createdBy' | 'fromTogether'>
>;

export interface GroupsRepository {
  create(group: GroupRecord): Promise<void>;
  find(id: string): Promise<GroupRecord | null>;
  findMany(ids: readonly string[]): Promise<GroupRecord[]>;
  /**
   * Écrit le patch ; avec `expectEvaluatedThrough`, seulement si le dernier jour jugé n'a pas changé entre-temps
   * (deux minuteurs en même temps : un seul gagne). Rend vrai si la ligne a été écrite.
   */
  update(id: string, patch: GroupPatch, expectEvaluatedThrough?: Day | null): Promise<boolean>;
  /** Groupes d'habitude vivants dont un jour reste à juger (dernier jugé avant `lastClosed`), curseur sur l'id. */
  listToSettle(lastClosed: Day, afterId: string | null, limit: number): Promise<GroupRecord[]>;
}

// ── Membres ────────────────────────────────────────────────────────────────
export interface GroupMemberRecord {
  groupId: string;
  userId: string;
  status: GroupMemberStatus;
  invitedBy: string | null;
  joinedAt: string | null;
  leftAt: string | null;
  lastReadAt: string | null;
  /** Dernier push « message de groupe » (un seul tant que la personne n'a pas lu). */
  notifiedAt: string | null;
  createdAt: string;
}
export type GroupMemberPatch = Partial<
  Pick<GroupMemberRecord, 'status' | 'invitedBy' | 'joinedAt' | 'leftAt' | 'lastReadAt' | 'notifiedAt'>
>;

export interface GroupMembersRepository {
  /** Crée ou remplace la ligne (une par groupe et personne). */
  put(member: GroupMemberRecord): Promise<void>;
  find(groupId: string, userId: string): Promise<GroupMemberRecord | null>;
  listForGroups(groupIds: readonly string[]): Promise<GroupMemberRecord[]>;
  /** Lignes d'une personne, filtrées par statut. */
  listForUser(userId: string, statuses: readonly GroupMemberStatus[]): Promise<GroupMemberRecord[]>;
  update(groupId: string, userId: string, patch: GroupMemberPatch): Promise<void>;
}

// ── Messages ───────────────────────────────────────────────────────────────
export interface GroupMessageRecord {
  id: string;
  groupId: string;
  authorKind: 'user' | 'pet' | 'system';
  authorId: string | null;
  kind: 'text' | 'event';
  body: string | null;
  event: GroupEventKind | null;
  /** Variables de l'événement (prénom, nom du groupe, nombre) : la phrase s'écrit à la lecture, dans la langue de chacun. */
  eventVars: { name?: string; minimoa?: string; group?: string; count?: number };
  createdAt: string;
}

export interface GroupMessagesRepository {
  add(messages: readonly GroupMessageRecord[]): Promise<void>;
  find(id: string): Promise<GroupMessageRecord | null>;
  /** Du plus récent au plus ancien, strictement avant `before`. */
  page(groupId: string, before: string | null, limit: number): Promise<GroupMessageRecord[]>;
  latest(groupIds: readonly string[]): Promise<Map<string, GroupMessageRecord>>;
  /** Messages écrits par d'autres que `userId` depuis `since` (non lus). */
  countUnread(groupId: string, userId: string, since: string | null): Promise<number>;
  /** Le message et au plus `around` messages avant et après (modération). */
  context(groupId: string, messageId: string, around: number): Promise<GroupMessageRecord[]>;
}

// ── Jours jugés ────────────────────────────────────────────────────────────
export interface GroupDayRecord {
  groupId: string;
  day: Day;
  outcome: GroupDayOutcome;
  members: Record<string, MemberDayStatus>;
  livesAfter: number;
  streakAfter: number;
  createdAt: string;
}

export interface GroupDaysRepository {
  /** Faux si ce jour est déjà jugé (idempotent). */
  insertIfAbsent(day: GroupDayRecord): Promise<boolean>;
  listBetween(groupId: string, from: Day, to: Day): Promise<GroupDayRecord[]>;
}

// ── Jokers posés pour une habitude ─────────────────────────────────────────
export interface HabitJokersRepository {
  /** Faux si le jour était déjà couvert. */
  add(userId: string, day: Day, at: string): Promise<boolean>;
  /** Jours couverts de ces personnes depuis `from` (inclus). */
  listSince(userIds: readonly string[], from: Day): Promise<{ userId: string; day: Day }[]>;
}

// ── « La tenir ensemble » ──────────────────────────────────────────────────
export interface TogetherProposalRecord {
  id: string;
  userId: string;
  habitId: string;
  status: 'waiting' | 'matched' | 'withdrawn';
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TogetherRepository {
  /** Propositions en attente d'une personne. */
  listWaiting(userId: string): Promise<TogetherProposalRecord[]>;
  /** Propositions en attente pour une habitude, créées après `sinceIso`, les plus anciennes d'abord. */
  listWaitingForHabit(habitId: string, sinceIso: string, limit: number): Promise<TogetherProposalRecord[]>;
  /** Faux si la personne attend déjà pour cette habitude. */
  create(p: TogetherProposalRecord): Promise<boolean>;
  setStatus(
    ids: readonly string[],
    status: TogetherProposalRecord['status'],
    groupId: string | null,
    at: string,
  ): Promise<void>;
}
