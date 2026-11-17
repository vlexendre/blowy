import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { type GroupEventKind, type GroupesText, type Locale, groupesText } from '@blowy/content';
import {
  type Day,
  type GroupHabitState,
  type MemberDayStatus,
  type MemberHabitState,
  addDays,
  dayOf,
  entitlements,
  isDayClosed,
  jokerCost,
  memberDayStatus,
  parisHourOf,
  proofCounts,
  sameWeek,
  settleStreak,
  canPlaceJokerFor,
} from '@blowy/domain';
import { NOTIFIER, type NotificationKind, type Notifier } from '../../../integrations/push/notifier';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { BLOCKS, CLOCK, IDS, PROFILES } from '../../../shared/tokens';
import { hasPlus } from '../../me/application/plus';
import type { Profile, ProfilesRepository } from '../../me/ports';
import type { HabitChecksRepository, HabitsRepository, RitualStatesRepository } from '../../rituels/ports';
import { HABIT_CHECKS, HABITS, RITUAL_STATES } from '../../rituels/tokens';
import { EMPTY_RITUAL_STATE } from '../../rituels/ports';
import type { BlocksRepository } from '../../safety/ports';
import type {
  GroupMemberRecord,
  GroupMembersRepository,
  GroupMessageRecord,
  GroupMessagesRepository,
  GroupRecord,
  GroupsRepository,
  HabitJokersRepository,
} from '../ports';
import { GROUP_MEMBERS, GROUP_MESSAGES, GROUPS, HABIT_JOKERS } from '../tokens';

/** Message d'erreur des groupes, résolu dans la langue de la requête : `groupError((t) => t.limit(2))`. */
export const groupError =
  (pick: (t: GroupesText['errors']) => string) =>
  (l: Locale): string =>
    pick(groupesText.in(l).errors);

/** Un groupe et ses lignes de membres. */
export interface LoadedGroup {
  group: GroupRecord;
  members: GroupMemberRecord[];
  active: GroupMemberRecord[];
  invited: GroupMemberRecord[];
}

export const habitStateOf = (g: GroupRecord): GroupHabitState => ({
  lives: g.lives,
  streak: g.streak,
  bestStreak: g.bestStreak,
  cleanDays: g.cleanDays,
  asleep: g.status === 'asleep',
});

/** Ce que tous les cas d'usage des groupes partagent : chargement, appartenance, événements, notifications, état du jour. */
@Injectable()
export class GroupCore {
  private readonly logger = new Logger('Groupes');

  constructor(
    @Inject(GROUPS) readonly groups: GroupsRepository,
    @Inject(GROUP_MEMBERS) readonly members: GroupMembersRepository,
    @Inject(GROUP_MESSAGES) readonly messages: GroupMessagesRepository,
    @Inject(HABIT_JOKERS) readonly jokers: HabitJokersRepository,
    @Inject(HABITS) private readonly habits: HabitsRepository,
    @Inject(HABIT_CHECKS) private readonly checks: HabitChecksRepository,
    @Inject(RITUAL_STATES) readonly ritualStates: RitualStatesRepository,
    @Inject(PROFILES) readonly profiles: ProfilesRepository,
    @Inject(BLOCKS) readonly blocks: BlocksRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) readonly ids: Ids,
    @Optional() @Inject(NOTIFIER) private readonly notifier?: Notifier,
  ) {}

  now(): Date {
    return this.clock.now();
  }
  today(): Day {
    return dayOf(this.clock.now());
  }
  hour(): number {
    return parisHourOf(this.clock.now());
  }

  async profile(userId: string): Promise<Profile> {
    const p = await this.profiles.findById(userId);
    if (!p) throw new DomainError('not_onboarded');
    return p;
  }

  limitOf(profile: Profile): number {
    return entitlements(hasPlus(profile, this.clock.now())).groups;
  }
  jokersPerWeek(profile: Profile): number {
    return entitlements(hasPlus(profile, this.clock.now())).jokersPerWeek;
  }

  /** Groupes qui comptent dans la limite : ceux dont la personne est membre, hors groupes fermés. */
  async countMemberships(userId: string): Promise<number> {
    const rows = await this.members.listForUser(userId, ['active']);
    const groups = await this.groups.findMany(rows.map((r) => r.groupId));
    return groups.filter((g) => g.status !== 'closed').length;
  }

  async load(groupId: string): Promise<LoadedGroup> {
    const group = await this.groups.find(groupId);
    if (!group)
      throw new DomainError(
        'not_found',
        groupError((t) => t.notFound),
      );
    const members = await this.members.listForGroups([groupId]);
    return {
      group,
      members,
      active: members.filter((m) => m.status === 'active'),
      invited: members.filter((m) => m.status === 'invited'),
    };
  }

  /** Le groupe vu par un membre actif ; un groupe fermé reste lisible (`allowClosed`). */
  async asMember(groupId: string, userId: string, allowClosed = false): Promise<LoadedGroup> {
    const loaded = await this.load(groupId);
    if (!loaded.active.some((m) => m.userId === userId))
      throw new DomainError(
        'forbidden',
        groupError((t) => t.notMember),
      );
    if (!allowClosed && loaded.group.status === 'closed')
      throw new DomainError(
        'forbidden',
        groupError((t) => t.closed),
      );
    return loaded;
  }

  /**
   * Une invitation n'arrive pas (invisible, impossible à accepter) si la personne invitée et un membre actif se sont
   * bloqués, dans un sens ou dans l'autre : deux personnes bloquées ne sont jamais dans le même groupe.
   */
  async invitationReachable(
    group: GroupRecord,
    active: readonly GroupMemberRecord[],
    inviteeId: string,
  ): Promise<boolean> {
    if (group.status === 'closed') return false;
    const blocked = await this.blocks.blockedEitherWay(inviteeId);
    return !active.some((m) => blocked.has(m.userId));
  }

  /** Ajoute un événement au chat du groupe (phrase écrite à la lecture, dans la langue de chacun). */
  /**
   * Instant d'un nouveau message, strictement croissant dans ce processus : plusieurs messages écrits dans la même
   * milliseconde (une arrivée puis le démarrage) gardent leur ordre.
   */
  stamp(): string {
    const now = Math.max(this.clock.now().getTime(), this.lastStamp + 1);
    this.lastStamp = now;
    return new Date(now).toISOString();
  }
  private lastStamp = 0;

  async event(
    groupId: string,
    kind: GroupEventKind,
    vars: GroupMessageRecord['eventVars'],
    by: { userId: string; minimoa: boolean } | null = null,
    at?: string,
  ): Promise<GroupMessageRecord> {
    const record: GroupMessageRecord = {
      id: this.ids.uuid(),
      groupId,
      authorKind: by ? (by.minimoa ? 'pet' : 'user') : 'system',
      authorId: by?.userId ?? null,
      kind: 'event',
      body: null,
      event: kind,
      eventVars: vars,
      createdAt: at ?? this.stamp(),
    };
    await this.messages.add([record]);
    return record;
  }

  /** Notification (réglages, heures calmes et plafond : la plateforme) ; un échec n'interrompt rien. */
  async notify(
    userIds: readonly string[],
    kind: NotificationKind,
    vars: Record<string, string>,
  ): Promise<void> {
    if (!this.notifier) return;
    for (const id of userIds) {
      try {
        await this.notifier.notify(id, kind, vars);
      } catch (err) {
        this.logger.warn(
          `notification ${kind} non envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`,
        );
      }
    }
  }

  /**
   * État de l'habitude du groupe chez chaque membre actif, depuis `from` : rythme, jours tenus, jokers posés, jour
   * d'arrivée. Un membre qui ne suit plus l'habitude a un rythme null (elle reste due chaque jour).
   */
  async memberStates(
    group: GroupRecord,
    active: readonly GroupMemberRecord[],
    from: Day,
  ): Promise<Map<string, MemberHabitState>> {
    const out = new Map<string, MemberHabitState>();
    if (!group.habitId || active.length === 0) return out;
    const lists = await Promise.all(active.map((m) => this.habits.listActive(m.userId)));
    const habitOf = new Map(
      active.map((m, i) => [m.userId, (lists[i] ?? []).find((h) => h.habitId === group.habitId) ?? null]),
    );
    const refs = [...habitOf.values()].flatMap((h) => (h ? [h.id] : []));
    const [checks, jokers] = await Promise.all([
      refs.length > 0 ? this.checks.listSince(refs, addDays(from, -7)) : Promise.resolve([]),
      this.jokers.listSince(
        active.map((m) => m.userId),
        from,
      ),
    ]);
    for (const m of active) {
      const habit = habitOf.get(m.userId) ?? null;
      const joinedOn = dayOf(new Date(m.joinedAt ?? m.createdAt));
      out.set(m.userId, {
        rhythm: habit?.rhythm ?? null,
        keptDays: habit
          ? checks.filter((c) => c.habitRef === habit.id && proofCounts(c.verdict)).map((c) => c.day)
          : [],
        jokerDays: jokers.filter((j) => j.userId === m.userId).map((j) => j.day),
        joinedOn,
        since: habit ? dayOf(new Date(habit.createdAt)) : joinedOn,
      });
    }
    return out;
  }

  /** État de chaque membre aujourd'hui et hier (hier seulement tant qu'il n'est pas jugé). */
  statusesNow(
    states: ReadonlyMap<string, MemberHabitState>,
  ): Map<string, { today: MemberDayStatus; yesterday: MemberDayStatus | null }> {
    const today = this.today();
    const hour = this.hour();
    const yesterday = addDays(today, -1);
    const yOpen = !isDayClosed(yesterday, today, hour);
    return new Map(
      [...states].map(([id, s]) => [
        id,
        {
          today: memberDayStatus(s, today, false),
          yesterday: yOpen ? memberDayStatus(s, yesterday, false) : null,
        },
      ]),
    );
  }

  /** Jokers de la semaine : ceux de la série du défi (rattrapée) et ceux posés pour une habitude. */
  async jokerPool(
    userId: string,
    profile: Profile,
    day: Day,
  ): Promise<{ used: Day[]; perWeek: number; streakDays: Day[] }> {
    const perWeek = this.jokersPerWeek(profile);
    const state = (await this.ritualStates.find(userId)) ?? EMPTY_RITUAL_STATE(userId);
    const settled = settleStreak(state.streak, this.today(), perWeek);
    const habitJokers = (await this.jokers.listSince([userId], addDays(day, -7))).map((j) => j.day);
    return {
      used: [...new Set([...settled.jokerDays, ...habitJokers])],
      perWeek,
      streakDays: settled.jokerDays,
    };
  }

  jokersLeft(used: readonly Day[], perWeek: number): number {
    const today = this.today();
    return Math.max(0, perWeek - used.filter((d) => sameWeek(d, today)).length);
  }

  /** Jour pour lequel la personne peut poser un joker maintenant, s'il y en a un. */
  jokerDayFor(
    status: { today: MemberDayStatus; yesterday: MemberDayStatus | null },
    used: readonly Day[],
    perWeek: number,
  ): Day | null {
    const today = this.today();
    const hour = this.hour();
    const yesterday = addDays(today, -1);
    const candidates: Day[] = [];
    if (status.yesterday === 'pending' && canPlaceJokerFor(yesterday, today, hour))
      candidates.push(yesterday);
    if (status.today === 'pending') candidates.push(today);
    return candidates.find((d) => jokerCost(used, d, perWeek) !== 'none_left') ?? null;
  }
}
