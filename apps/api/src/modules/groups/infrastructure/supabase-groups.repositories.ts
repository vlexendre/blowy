import type { GroupEventKind } from '@blowy/content';
import type { Day, GroupMemberStatus, MemberDayStatus } from '@blowy/domain';
import type { Database, Db, Json } from '../../../persistence/database.types';
import { check, iso, isoOrNull, isUniqueViolation } from '../../../persistence/supabase';
import type {
  GroupDayRecord,
  GroupDaysRepository,
  GroupMemberPatch,
  GroupMemberRecord,
  GroupMembersRepository,
  GroupMessageRecord,
  GroupMessagesRepository,
  GroupPatch,
  GroupRecord,
  GroupsRepository,
  HabitJokersRepository,
  TogetherProposalRecord,
  TogetherRepository,
} from '../ports';

type Tables = Database['public']['Tables'];
type GroupRow = Tables['groups']['Row'];
type MemberRow = Tables['group_members']['Row'];
type MessageRow = Tables['group_messages']['Row'];
type DayRow = Tables['group_days']['Row'];
type TogetherRow = Tables['together_proposals']['Row'];

const groupFromRow = (r: GroupRow): GroupRecord => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  habitId: r.habit_id,
  status: r.status,
  createdBy: r.created_by,
  lives: r.lives,
  streak: r.streak,
  bestStreak: r.best_streak,
  cleanDays: r.clean_days,
  startedOn: r.started_on,
  evaluatedThrough: r.evaluated_through,
  fromTogether: r.from_together,
  closedAt: isoOrNull(r.closed_at),
  closedReason: r.closed_reason,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

const groupPatchRow = (p: GroupPatch): Partial<GroupRow> => {
  const row: Partial<GroupRow> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.status !== undefined) row.status = p.status;
  if (p.lives !== undefined) row.lives = p.lives;
  if (p.streak !== undefined) row.streak = p.streak;
  if (p.bestStreak !== undefined) row.best_streak = p.bestStreak;
  if (p.cleanDays !== undefined) row.clean_days = p.cleanDays;
  if (p.startedOn !== undefined) row.started_on = p.startedOn;
  if (p.evaluatedThrough !== undefined) row.evaluated_through = p.evaluatedThrough;
  if (p.closedAt !== undefined) row.closed_at = p.closedAt;
  if (p.closedReason !== undefined) row.closed_reason = p.closedReason;
  row.updated_at = p.updatedAt ?? new Date().toISOString();
  return row;
};

export class SupabaseGroupsRepository implements GroupsRepository {
  constructor(private readonly client: Db) {}
  private get table() {
    return this.client.from('groups');
  }
  async create(g: GroupRecord): Promise<void> {
    const { error } = await this.table.insert({
      id: g.id,
      name: g.name,
      kind: g.kind,
      habit_id: g.habitId,
      status: g.status,
      created_by: g.createdBy,
      lives: g.lives,
      streak: g.streak,
      best_streak: g.bestStreak,
      clean_days: g.cleanDays,
      started_on: g.startedOn,
      evaluated_through: g.evaluatedThrough,
      from_together: g.fromTogether,
      closed_at: g.closedAt,
      closed_reason: g.closedReason,
      created_at: g.createdAt,
      updated_at: g.updatedAt,
    });
    check(error, 'création du groupe');
  }
  async find(id: string): Promise<GroupRecord | null> {
    const { data, error } = await this.table.select('*').eq('id', id).maybeSingle();
    check(error, 'lecture du groupe');
    return data ? groupFromRow(data) : null;
  }
  async findMany(ids: readonly string[]): Promise<GroupRecord[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.table.select('*').in('id', [...ids]);
    check(error, 'lecture des groupes');
    return (data ?? []).map(groupFromRow);
  }
  async update(id: string, patch: GroupPatch, expectEvaluatedThrough?: Day | null): Promise<boolean> {
    let query = this.table.update(groupPatchRow(patch)).eq('id', id);
    if (expectEvaluatedThrough !== undefined)
      query =
        expectEvaluatedThrough === null
          ? query.is('evaluated_through', null)
          : query.eq('evaluated_through', expectEvaluatedThrough);
    const { data, error } = await query.select('id');
    check(error, 'mise à jour du groupe');
    return (data ?? []).length > 0;
  }
  async listToSettle(lastClosed: Day, afterId: string | null, limit: number): Promise<GroupRecord[]> {
    let query = this.table
      .select('*')
      .eq('kind', 'habit')
      .eq('status', 'active')
      .or(`evaluated_through.is.null,evaluated_through.lt.${lastClosed}`);
    if (afterId) query = query.gt('id', afterId);
    const { data, error } = await query.order('id', { ascending: true }).limit(limit);
    check(error, 'groupes à juger');
    return (data ?? []).map(groupFromRow);
  }
}

const memberFromRow = (r: MemberRow): GroupMemberRecord => ({
  groupId: r.group_id,
  userId: r.user_id,
  status: r.status,
  invitedBy: r.invited_by,
  joinedAt: isoOrNull(r.joined_at),
  leftAt: isoOrNull(r.left_at),
  lastReadAt: isoOrNull(r.last_read_at),
  notifiedAt: isoOrNull(r.notified_at),
  createdAt: iso(r.created_at),
});

export class SupabaseGroupMembersRepository implements GroupMembersRepository {
  constructor(private readonly client: Db) {}
  private get table() {
    return this.client.from('group_members');
  }
  async put(m: GroupMemberRecord): Promise<void> {
    const { error } = await this.table.upsert(
      {
        group_id: m.groupId,
        user_id: m.userId,
        status: m.status,
        invited_by: m.invitedBy,
        joined_at: m.joinedAt,
        left_at: m.leftAt,
        last_read_at: m.lastReadAt,
        notified_at: m.notifiedAt,
        created_at: m.createdAt,
      },
      { onConflict: 'group_id,user_id' },
    );
    check(error, 'membre du groupe');
  }
  async find(groupId: string, userId: string): Promise<GroupMemberRecord | null> {
    const { data, error } = await this.table
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();
    check(error, 'lecture d’un membre');
    return data ? memberFromRow(data) : null;
  }
  async listForGroups(groupIds: readonly string[]): Promise<GroupMemberRecord[]> {
    if (groupIds.length === 0) return [];
    const { data, error } = await this.table
      .select('*')
      .in('group_id', [...groupIds])
      .order('created_at', { ascending: true });
    check(error, 'membres des groupes');
    return (data ?? []).map(memberFromRow);
  }
  async listForUser(userId: string, statuses: readonly GroupMemberStatus[]): Promise<GroupMemberRecord[]> {
    const { data, error } = await this.table
      .select('*')
      .eq('user_id', userId)
      .in('status', [...statuses]);
    check(error, 'groupes d’une personne');
    return (data ?? []).map(memberFromRow);
  }
  async update(groupId: string, userId: string, p: GroupMemberPatch): Promise<void> {
    const row: Partial<MemberRow> = {};
    if (p.status !== undefined) row.status = p.status;
    if (p.invitedBy !== undefined) row.invited_by = p.invitedBy;
    if (p.joinedAt !== undefined) row.joined_at = p.joinedAt;
    if (p.leftAt !== undefined) row.left_at = p.leftAt;
    if (p.lastReadAt !== undefined) row.last_read_at = p.lastReadAt;
    if (p.notifiedAt !== undefined) row.notified_at = p.notifiedAt;
    const { error } = await this.table.update(row).eq('group_id', groupId).eq('user_id', userId);
    check(error, 'mise à jour d’un membre');
  }
}

const messageFromRow = (r: MessageRow): GroupMessageRecord => ({
  id: r.id,
  groupId: r.group_id,
  authorKind: r.author_kind,
  authorId: r.author_id,
  kind: r.kind,
  body: r.body,
  event: r.event as GroupEventKind | null,
  eventVars: (r.event_vars ?? {}) as GroupMessageRecord['eventVars'],
  createdAt: iso(r.created_at),
});

export class SupabaseGroupMessagesRepository implements GroupMessagesRepository {
  constructor(private readonly client: Db) {}
  private get table() {
    return this.client.from('group_messages');
  }
  async add(messages: readonly GroupMessageRecord[]): Promise<void> {
    if (messages.length === 0) return;
    const { error } = await this.table.insert(
      messages.map((m) => ({
        id: m.id,
        group_id: m.groupId,
        author_kind: m.authorKind,
        author_id: m.authorId,
        kind: m.kind,
        body: m.body,
        event: m.event,
        event_vars: m.eventVars as Json,
        created_at: m.createdAt,
      })),
    );
    check(error, 'messages du groupe');
  }
  async find(id: string): Promise<GroupMessageRecord | null> {
    const { data, error } = await this.table.select('*').eq('id', id).maybeSingle();
    check(error, 'lecture d’un message de groupe');
    return data ? messageFromRow(data) : null;
  }
  async page(groupId: string, before: string | null, limit: number): Promise<GroupMessageRecord[]> {
    let query = this.table.select('*').eq('group_id', groupId);
    if (before) query = query.lt('created_at', before);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    check(error, 'page de messages du groupe');
    return (data ?? []).map(messageFromRow);
  }
  async latest(groupIds: readonly string[]): Promise<Map<string, GroupMessageRecord>> {
    const out = new Map<string, GroupMessageRecord>();
    await Promise.all(
      groupIds.map(async (id) => {
        const [m] = await this.page(id, null, 1);
        if (m) out.set(id, m);
      }),
    );
    return out;
  }
  async countUnread(groupId: string, userId: string, since: string | null): Promise<number> {
    let query = this.table
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('author_kind', 'user')
      .eq('kind', 'text')
      .neq('author_id', userId);
    if (since) query = query.gt('created_at', since);
    const { count, error } = await query;
    check(error, 'messages non lus du groupe');
    return count ?? 0;
  }
  async context(groupId: string, messageId: string, around: number): Promise<GroupMessageRecord[]> {
    const m = await this.find(messageId);
    if (!m || m.groupId !== groupId) return [];
    const [before, after] = await Promise.all([
      this.table
        .select('*')
        .eq('group_id', groupId)
        .lt('created_at', m.createdAt)
        .order('created_at', { ascending: false })
        .limit(around),
      this.table
        .select('*')
        .eq('group_id', groupId)
        .gt('created_at', m.createdAt)
        .order('created_at', { ascending: true })
        .limit(around),
    ]);
    check(before.error, 'contexte du message');
    check(after.error, 'contexte du message');
    return [
      ...(before.data ?? []).reverse().map(messageFromRow),
      m,
      ...(after.data ?? []).map(messageFromRow),
    ];
  }
}

const dayFromRow = (r: DayRow): GroupDayRecord => ({
  groupId: r.group_id,
  day: r.day,
  outcome: r.outcome,
  members: (r.members ?? {}) as Record<string, MemberDayStatus>,
  livesAfter: r.lives_after,
  streakAfter: r.streak_after,
  createdAt: iso(r.created_at),
});

export class SupabaseGroupDaysRepository implements GroupDaysRepository {
  constructor(private readonly client: Db) {}
  private get table() {
    return this.client.from('group_days');
  }
  async insertIfAbsent(d: GroupDayRecord): Promise<boolean> {
    const { error } = await this.table.insert({
      group_id: d.groupId,
      day: d.day,
      outcome: d.outcome,
      members: d.members as Json,
      lives_after: d.livesAfter,
      streak_after: d.streakAfter,
      created_at: d.createdAt,
    });
    if (isUniqueViolation(error)) return false;
    check(error, 'jour du groupe');
    return true;
  }
  async listBetween(groupId: string, from: Day, to: Day): Promise<GroupDayRecord[]> {
    const { data, error } = await this.table
      .select('*')
      .eq('group_id', groupId)
      .gte('day', from)
      .lte('day', to)
      .order('day', { ascending: true });
    check(error, 'jours du groupe');
    return (data ?? []).map(dayFromRow);
  }
}

export class SupabaseHabitJokersRepository implements HabitJokersRepository {
  constructor(private readonly client: Db) {}
  async add(userId: string, day: Day, at: string): Promise<boolean> {
    const { error } = await this.client.from('habit_jokers').insert({ user_id: userId, day, created_at: at });
    if (isUniqueViolation(error)) return false;
    check(error, 'joker d’habitude');
    return true;
  }
  async listSince(userIds: readonly string[], from: Day): Promise<{ userId: string; day: Day }[]> {
    if (userIds.length === 0) return [];
    const { data, error } = await this.client
      .from('habit_jokers')
      .select('user_id, day')
      .in('user_id', [...userIds])
      .gte('day', from);
    check(error, 'jokers d’habitude');
    return (data ?? []).map((r) => ({ userId: r.user_id, day: r.day }));
  }
}

const togetherFromRow = (r: TogetherRow): TogetherProposalRecord => ({
  id: r.id,
  userId: r.user_id,
  habitId: r.habit_id,
  status: r.status,
  groupId: r.group_id,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

export class SupabaseTogetherRepository implements TogetherRepository {
  constructor(private readonly client: Db) {}
  private get table() {
    return this.client.from('together_proposals');
  }
  async listWaiting(userId: string): Promise<TogetherProposalRecord[]> {
    const { data, error } = await this.table.select('*').eq('user_id', userId).eq('status', 'waiting');
    check(error, 'propositions « ensemble »');
    return (data ?? []).map(togetherFromRow);
  }
  async listWaitingForHabit(
    habitId: string,
    sinceIso: string,
    limit: number,
  ): Promise<TogetherProposalRecord[]> {
    const { data, error } = await this.table
      .select('*')
      .eq('habit_id', habitId)
      .eq('status', 'waiting')
      .gt('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(limit);
    check(error, 'propositions « ensemble » d’une habitude');
    return (data ?? []).map(togetherFromRow);
  }
  async create(p: TogetherProposalRecord): Promise<boolean> {
    const { error } = await this.table.insert({
      id: p.id,
      user_id: p.userId,
      habit_id: p.habitId,
      status: p.status,
      group_id: p.groupId,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    });
    if (isUniqueViolation(error)) return false;
    check(error, 'proposition « ensemble »');
    return true;
  }
  async setStatus(
    ids: readonly string[],
    status: TogetherProposalRecord['status'],
    groupId: string | null,
    at: string,
  ): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await this.table
      .update({ status, group_id: groupId, updated_at: at })
      .in('id', [...ids]);
    check(error, 'propositions « ensemble »');
  }
}
