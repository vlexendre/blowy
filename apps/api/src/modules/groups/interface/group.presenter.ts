import { Inject, Injectable } from '@nestjs/common';
import { groupEventLine, groupesText, habitById } from '@blowy/content';
import type {
  GroupDetail,
  GroupHabit,
  GroupInvitation,
  GroupMember,
  GroupMessage,
  GroupSummary,
  Person,
} from '@blowy/contract';
import {
  type Day,
  GROUP_MAX_LIVES,
  type MemberDayStatus,
  addDays,
  groupSeatsLeft,
  isDayClosed,
  shapeOf,
  weekDaysOf,
} from '@blowy/domain';
import { requestLocale } from '../../../shared/locale';
import { PETS } from '../../../shared/tokens';
import { toPerson } from '../../me/interface/person.presenter';
import type { Profile } from '../../me/ports';
import { livePet, moodForShape } from '../../pets/application/pet-catch-up';
import { toPublicPet } from '../../pets/interface/pet.presenter';
import type { PetsRepository } from '../../pets/ports';
import { Audience } from '../../safety/application/audience';
import { GroupCore, type LoadedGroup } from '../application/group-core';
import type { GroupDaysRepository, GroupMessageRecord, GroupRecord } from '../ports';
import { GROUP_DAYS } from '../tokens';

const PREVIEW_MAX = 80;

/** Assemble les vues des groupes pour la personne qui regarde. Les autres passent par `Audience` (« group »). */
@Injectable()
export class GroupPresenter {
  constructor(
    @Inject(GroupCore) private readonly core: GroupCore,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(GROUP_DAYS) private readonly days: GroupDaysRepository,
  ) {}

  /** Personnes vues comme dans un lien (prénom, minimoa ; visage caché) : soi, et les autres visibles. */
  async people(viewerId: string, ids: readonly string[]): Promise<Map<string, Person>> {
    const others = await this.audience.visible(viewerId, ids, 'group');
    const self = ids.includes(viewerId) ? await this.core.profiles.findById(viewerId) : null;
    const profiles: Profile[] = [...(self ? [self] : []), ...others];
    const pets = await this.pets.findByOwners(profiles.map((p) => p.id));
    const now = this.core.now();
    const out = new Map<string, Person>();
    for (const p of profiles) {
      const raw = pets.find((x) => x.ownerId === p.id);
      if (!raw) continue;
      const pet = livePet(raw, now);
      out.set(p.id, toPerson(p, toPublicPet(pet, moodForShape(shapeOf(pet.needs))), 'hidden', null));
    }
    return out;
  }

  private habitLabel(habitId: string | null): string | null {
    return habitId ? (habitById(habitId, requestLocale())?.label ?? habitId) : null;
  }

  private async habitView(
    viewerId: string,
    loaded: LoadedGroup,
  ): Promise<{
    habit: GroupHabit | null;
    statuses: Map<string, { today: MemberDayStatus; yesterday: MemberDayStatus | null }>;
  }> {
    const g = loaded.group;
    if (g.kind !== 'habit' || !g.habitId) return { habit: null, statuses: new Map() };
    const states = await this.core.memberStates(g, loaded.active, addDays(this.core.today(), -7));
    const statuses = this.core.statusesNow(states);
    const todays = [...statuses.values()].map((s) => s.today);
    return {
      statuses,
      habit: {
        habitId: g.habitId,
        label: this.habitLabel(g.habitId) ?? g.habitId,
        lives: g.lives,
        maxLives: GROUP_MAX_LIVES,
        streak: g.streak,
        bestStreak: g.bestStreak,
        today: {
          day: this.core.today(),
          upToDate: todays.filter((s) => s === 'kept' || s === 'joker').length,
          due: todays.filter((s) => s !== 'not_due').length,
          mine: statuses.get(viewerId)?.today ?? 'not_due',
        },
      },
    };
  }

  previewOf(m: GroupMessageRecord): string {
    const text =
      m.kind === 'text' ? (m.body ?? '') : groupEventLine(requestLocale(), m.event ?? 'created', m.eventVars);
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > PREVIEW_MAX ? `${flat.slice(0, PREVIEW_MAX - 1)}…` : flat;
  }

  async summary(viewerId: string, loaded: LoadedGroup): Promise<GroupSummary> {
    const g = loaded.group;
    const me = loaded.members.find((m) => m.userId === viewerId);
    const [{ habit }, latest, unread] = await Promise.all([
      this.habitView(viewerId, loaded),
      this.core.messages.latest([g.id]),
      this.core.messages.countUnread(g.id, viewerId, me?.lastReadAt ?? me?.joinedAt ?? null),
    ]);
    const last = latest.get(g.id);
    return {
      id: g.id,
      name: g.name,
      kind: g.kind,
      status: g.status,
      memberCount: loaded.active.length,
      habit,
      unread,
      lastMessage: last ? { preview: this.previewOf(last), at: last.createdAt } : null,
      createdAt: g.createdAt,
    };
  }

  async detail(viewerId: string, loaded: LoadedGroup): Promise<GroupDetail> {
    const g = loaded.group;
    const summary = await this.summary(viewerId, loaded);
    const { statuses } = await this.habitView(viewerId, loaded);
    const people = await this.people(
      viewerId,
      loaded.active.map((m) => m.userId),
    );
    const members: GroupMember[] = loaded.active.flatMap((m) => {
      const person = people.get(m.userId);
      if (!person) return [];
      const s = statuses.get(m.userId);
      return [
        {
          person,
          me: m.userId === viewerId,
          creator: m.userId === g.createdBy,
          today: s?.today ?? null,
          yesterday: s?.yesterday ?? null,
        },
      ];
    });
    let jokers: GroupDetail['jokers'] = null;
    if (g.kind === 'habit') {
      const profile = await this.core.profile(viewerId);
      const pool = await this.core.jokerPool(viewerId, profile, this.core.today());
      const mine = statuses.get(viewerId);
      jokers = {
        left: this.core.jokersLeft(pool.used, pool.perWeek),
        perWeek: pool.perWeek,
        canPlaceFor:
          mine && (g.status === 'active' || g.status === 'forming')
            ? this.core.jokerDayFor(mine, pool.used, pool.perWeek)
            : null,
      };
    }
    const t = groupesText.in(requestLocale());
    return {
      ...summary,
      members,
      invited: loaded.invited.length,
      seatsLeft: groupSeatsLeft(loaded.active.length, loaded.invited.length),
      week: g.kind === 'habit' ? await this.week(g) : [],
      jokers,
      canWake: g.status === 'asleep',
      transparency: g.kind === 'habit' ? t.transparency : null,
      privacy: t.privacy,
    };
  }

  private async week(g: GroupRecord): Promise<GroupDetail['week']> {
    const today = this.core.today();
    const hour = this.core.hour();
    const days = weekDaysOf(today);
    const judged = new Map(
      (await this.days.listBetween(g.id, days[0] as Day, days[6] as Day)).map((d) => [d.day, d.outcome]),
    );
    return days.map((day) => {
      if (day > today) return { day, outcome: 'future' as const };
      const outcome = judged.get(day);
      if (outcome) return { day, outcome };
      if (!g.startedOn || day <= g.startedOn || isDayClosed(day, today, hour))
        return { day, outcome: 'before' as const };
      return { day, outcome: 'pending' as const };
    });
  }

  async invitation(
    viewerId: string,
    loaded: LoadedGroup,
    hasHabit: boolean,
  ): Promise<GroupInvitation | null> {
    const g = loaded.group;
    const row = loaded.invited.find((m) => m.userId === viewerId);
    if (!row) return null;
    const inviterId = row.invitedBy ?? g.createdBy;
    const people = inviterId ? await this.people(viewerId, [inviterId]) : new Map<string, Person>();
    const invitedBy = inviterId ? people.get(inviterId) : undefined;
    if (!invitedBy) return null;
    return {
      groupId: g.id,
      name: g.name,
      kind: g.kind,
      habitId: g.habitId,
      habitLabel: this.habitLabel(g.habitId),
      invitedBy,
      memberCount: loaded.active.length,
      addsHabit: g.kind === 'habit' && !hasHabit,
      transparency: g.kind === 'habit' ? groupesText.in(requestLocale()).transparency : null,
      at: row.createdAt,
    };
  }

  async messages(viewerId: string, records: readonly GroupMessageRecord[]): Promise<GroupMessage[]> {
    const authorIds = [
      ...new Set(records.flatMap((m) => (m.authorId && m.kind === 'text' ? [m.authorId] : []))),
    ];
    const visible = new Map(
      (await this.audience.visible(viewerId, authorIds, 'group')).map((p) => [p.id, p.displayName]),
    );
    const locale = requestLocale();
    return records.map((m): GroupMessage => {
      if (m.kind === 'event') {
        const minimoa = m.authorKind === 'pet';
        return {
          id: m.id,
          groupId: m.groupId,
          author: minimoa ? 'minimoa' : 'system',
          authorId: minimoa ? m.authorId : null,
          authorName: minimoa ? (m.eventVars.minimoa ?? null) : null,
          kind: 'event',
          body: groupEventLine(locale, m.event ?? 'created', m.eventVars),
          at: m.createdAt,
        };
      }
      const mine = m.authorId === viewerId;
      return {
        id: m.id,
        groupId: m.groupId,
        author: mine ? 'me' : 'member',
        authorId: m.authorId,
        authorName: mine ? null : m.authorId ? (visible.get(m.authorId) ?? null) : null,
        kind: 'text',
        body: m.body ?? '',
        at: m.createdAt,
      };
    });
  }
}
