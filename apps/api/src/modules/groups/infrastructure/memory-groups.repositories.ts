import type { Day, GroupMemberStatus } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
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

const copy = <T extends object>(o: T): T => ({ ...o });

export class MemoryGroupsRepository implements GroupsRepository {
  constructor(private readonly db: MemoryDb) {}
  async create(group: GroupRecord): Promise<void> {
    this.db.groups.set(group.id, copy(group));
  }
  async find(id: string): Promise<GroupRecord | null> {
    const g = this.db.groups.get(id);
    return g ? copy(g) : null;
  }
  async findMany(ids: readonly string[]): Promise<GroupRecord[]> {
    return ids.flatMap((id) => {
      const g = this.db.groups.get(id);
      return g ? [copy(g)] : [];
    });
  }
  async update(id: string, patch: GroupPatch, expectEvaluatedThrough?: Day | null): Promise<boolean> {
    const g = this.db.groups.get(id);
    if (!g) return false;
    if (expectEvaluatedThrough !== undefined && g.evaluatedThrough !== expectEvaluatedThrough) return false;
    this.db.groups.set(id, { ...g, ...patch });
    return true;
  }
  async listToSettle(lastClosed: Day, afterId: string | null, limit: number): Promise<GroupRecord[]> {
    return [...this.db.groups.values()]
      .filter(
        (g) =>
          g.kind === 'habit' &&
          g.status === 'active' &&
          (g.evaluatedThrough === null || g.evaluatedThrough < lastClosed),
      )
      .filter((g) => afterId === null || g.id > afterId)
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, limit)
      .map(copy);
  }
  async inviteCode(groupId: string): Promise<string | null> {
    return this.db.groupInviteCodes.get(groupId) ?? null;
  }
  async setInviteCode(groupId: string, code: string): Promise<boolean> {
    for (const [id, c] of this.db.groupInviteCodes) if (c === code && id !== groupId) return false;
    this.db.groupInviteCodes.set(groupId, code);
    return true;
  }
  async findByInviteCode(code: string): Promise<GroupRecord | null> {
    for (const [id, c] of this.db.groupInviteCodes) if (c === code) return this.find(id);
    return null;
  }
}

const key = (groupId: string, userId: string): string => `${groupId}:${userId}`;

export class MemoryGroupMembersRepository implements GroupMembersRepository {
  constructor(private readonly db: MemoryDb) {}
  async put(member: GroupMemberRecord): Promise<void> {
    this.db.groupMembers.set(key(member.groupId, member.userId), copy(member));
  }
  async find(groupId: string, userId: string): Promise<GroupMemberRecord | null> {
    const m = this.db.groupMembers.get(key(groupId, userId));
    return m ? copy(m) : null;
  }
  async listForGroups(groupIds: readonly string[]): Promise<GroupMemberRecord[]> {
    const ids = new Set(groupIds);
    return [...this.db.groupMembers.values()]
      .filter((m) => ids.has(m.groupId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(copy);
  }
  async listForUser(userId: string, statuses: readonly GroupMemberStatus[]): Promise<GroupMemberRecord[]> {
    return [...this.db.groupMembers.values()]
      .filter((m) => m.userId === userId && statuses.includes(m.status))
      .map(copy);
  }
  async update(groupId: string, userId: string, patch: GroupMemberPatch): Promise<void> {
    const m = this.db.groupMembers.get(key(groupId, userId));
    if (m) this.db.groupMembers.set(key(groupId, userId), { ...m, ...patch });
  }
}

export class MemoryGroupMessagesRepository implements GroupMessagesRepository {
  constructor(private readonly db: MemoryDb) {}
  async add(messages: readonly GroupMessageRecord[]): Promise<void> {
    for (const m of messages) this.db.groupMessages.push({ ...m, eventVars: { ...m.eventVars } });
  }
  async find(id: string): Promise<GroupMessageRecord | null> {
    const m = this.db.groupMessages.find((x) => x.id === id);
    return m ? copy(m) : null;
  }
  private thread(groupId: string): GroupMessageRecord[] {
    return this.db.groupMessages
      .filter((m) => m.groupId === groupId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  }
  async page(groupId: string, before: string | null, limit: number): Promise<GroupMessageRecord[]> {
    return this.thread(groupId)
      .filter((m) => before === null || m.createdAt < before)
      .reverse()
      .slice(0, limit)
      .map(copy);
  }
  async latest(groupIds: readonly string[]): Promise<Map<string, GroupMessageRecord>> {
    const out = new Map<string, GroupMessageRecord>();
    for (const id of groupIds) {
      const last = this.thread(id).at(-1);
      if (last) out.set(id, copy(last));
    }
    return out;
  }
  async countUnread(groupId: string, userId: string, since: string | null): Promise<number> {
    return this.thread(groupId).filter(
      (m) =>
        m.authorId !== userId &&
        m.authorKind === 'user' &&
        m.kind === 'text' &&
        (since === null || m.createdAt > since),
    ).length;
  }
  async context(groupId: string, messageId: string, around: number): Promise<GroupMessageRecord[]> {
    const t = this.thread(groupId);
    const at = t.findIndex((m) => m.id === messageId);
    if (at < 0) return [];
    return t.slice(Math.max(0, at - around), at + around + 1).map(copy);
  }
}

export class MemoryGroupDaysRepository implements GroupDaysRepository {
  constructor(private readonly db: MemoryDb) {}
  async insertIfAbsent(day: GroupDayRecord): Promise<boolean> {
    const k = `${day.groupId}:${day.day}`;
    if (this.db.groupDays.has(k)) return false;
    this.db.groupDays.set(k, { ...day, members: { ...day.members } });
    return true;
  }
  async listBetween(groupId: string, from: Day, to: Day): Promise<GroupDayRecord[]> {
    return [...this.db.groupDays.values()]
      .filter((d) => d.groupId === groupId && d.day >= from && d.day <= to)
      .sort((a, b) => a.day.localeCompare(b.day));
  }
}

export class MemoryHabitJokersRepository implements HabitJokersRepository {
  constructor(private readonly db: MemoryDb) {}
  async add(userId: string, day: Day, at: string): Promise<boolean> {
    const k = `${userId}:${day}`;
    if (this.db.habitJokers.has(k)) return false;
    this.db.habitJokers.set(k, at);
    return true;
  }
  async listSince(userIds: readonly string[], from: Day): Promise<{ userId: string; day: Day }[]> {
    const ids = new Set(userIds);
    return [...this.db.habitJokers.keys()]
      .map((k) => ({ userId: k.slice(0, k.lastIndexOf(':')), day: k.slice(k.lastIndexOf(':') + 1) }))
      .filter((j) => ids.has(j.userId) && j.day >= from);
  }
}

export class MemoryTogetherRepository implements TogetherRepository {
  constructor(private readonly db: MemoryDb) {}
  async listWaiting(userId: string): Promise<TogetherProposalRecord[]> {
    return [...this.db.togetherProposals.values()]
      .filter((p) => p.userId === userId && p.status === 'waiting')
      .map(copy);
  }
  async listWaitingForHabit(
    habitId: string,
    sinceIso: string,
    limit: number,
  ): Promise<TogetherProposalRecord[]> {
    return [...this.db.togetherProposals.values()]
      .filter((p) => p.habitId === habitId && p.status === 'waiting' && p.createdAt > sinceIso)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit)
      .map(copy);
  }
  async create(p: TogetherProposalRecord): Promise<boolean> {
    if (
      [...this.db.togetherProposals.values()].some(
        (x) => x.userId === p.userId && x.habitId === p.habitId && x.status === 'waiting',
      )
    )
      return false;
    this.db.togetherProposals.set(p.id, copy(p));
    return true;
  }
  async setStatus(
    ids: readonly string[],
    status: TogetherProposalRecord['status'],
    groupId: string | null,
    at: string,
  ): Promise<void> {
    for (const id of ids) {
      const p = this.db.togetherProposals.get(id);
      if (p) this.db.togetherProposals.set(id, { ...p, status, groupId, updatedAt: at });
    }
  }
}
