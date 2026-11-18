import { Inject, Injectable } from '@nestjs/common';
import { habitById } from '@blowy/content';
import type { CreateGroupBody, GroupAction, GroupDetail, GroupInviteLink, GroupPreview, GroupReportBody, Groups } from '@blowy/contract';
import {
  type Day,
  GROUP_MAX_MEMBERS,
  NEW_GROUP_HABIT_STATE,
  canJoinAnotherGroup,
  canPlaceJokerFor,
  classifyText,
  decideModeration,
  groupSeatsLeft,
  groupStatusAfter,
  jokerCost,
  lastClosedDay,
  memberDayStatus,
  missingMembers,
  wakeGroup,
  addDays,
  normalizeCode,
} from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import { Audience } from '../../safety/application/audience';
import { Growth } from '../../growth/application/growth';
import { requestLocale } from '../../../shared/locale';
import { LINKS } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import { ReportDesk } from '../../moderation/report-desk';
import { HabitsService } from '../../rituels/application/habits.service';
import type { HabitsRepository } from '../../rituels/ports';
import { HABITS } from '../../rituels/tokens';
import type { GroupDaysRepository } from '../ports';
import { GROUP_DAYS } from '../tokens';
import { GroupPresenter } from '../interface/group.presenter';
import type { GroupMemberRecord, GroupMessageRecord, GroupRecord } from '../ports';
import { GroupCore, type LoadedGroup, groupError, habitStateOf } from './group-core';

/** Nom d'un groupe : vu par tous ses membres, passé au filtre des contenus comme un prénom (refus clair, rien n'est écrit). */
export function checkGroupName(name: string): void {
  const decision = decideModeration('display_name', classifyText(name, requestLocale()));
  if (decision.outcome === 'block')
    throw new DomainError(
      'content_refused',
      groupError((t) => t.nameRefused),
    );
}

/**
 * Groupes (spéc §26) : créer, inviter, accepter, refuser, quitter, renommer, réveiller, poser un joker, signaler.
 * Deux personnes bloquées ne sont jamais dans le même groupe ; aucune IA ne lit un groupe.
 */
@Injectable()
export class GroupsUseCases {
  constructor(
    @Inject(GroupCore) private readonly core: GroupCore,
    @Inject(GroupPresenter) private readonly presenter: GroupPresenter,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(HABITS) private readonly habits: HabitsRepository,
    @Inject(HabitsService) private readonly habitsService: HabitsService,
    @Inject(ReportDesk) private readonly desk: ReportDesk,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(GROUP_DAYS) private readonly days: GroupDaysRepository,
    @Inject(Growth) private readonly growth: Growth,
  ) {}

  async list(userId: string): Promise<Groups> {
    const profile = await this.core.profile(userId);
    const rows = await this.core.members.listForUser(userId, ['active', 'invited']);
    const groups = await this.core.groups.findMany(rows.map((r) => r.groupId));
    const allMembers = await this.core.members.listForGroups(groups.map((g) => g.id));
    const myHabits = new Set((await this.habits.listActive(userId)).map((h) => h.habitId));
    const loadedOf = (g: GroupRecord): LoadedGroup => {
      const members = allMembers.filter((m) => m.groupId === g.id);
      return {
        group: g,
        members,
        active: members.filter((m) => m.status === 'active'),
        invited: members.filter((m) => m.status === 'invited'),
      };
    };
    const summaries = [];
    const invitations = [];
    for (const g of groups) {
      const loaded = loadedOf(g);
      const mine = rows.find((r) => r.groupId === g.id);
      if (mine?.status === 'active') summaries.push(await this.presenter.summary(userId, loaded));
      else if (
        mine?.status === 'invited' &&
        (await this.core.invitationReachable(g, loaded.active, userId))
      ) {
        const inv = await this.presenter.invitation(
          userId,
          loaded,
          g.habitId !== null && myHabits.has(g.habitId),
        );
        if (inv) invitations.push(inv);
      }
    }
    summaries.sort((a, b) =>
      (b.lastMessage?.at ?? b.createdAt).localeCompare(a.lastMessage?.at ?? a.createdAt),
    );
    const used = summaries.filter((s) => s.status !== 'closed').length;
    const limit = this.core.limitOf(profile);
    return { groups: summaries, invitations, limit, used, canCreate: canJoinAnotherGroup(used, limit) };
  }

  async detail(userId: string, groupId: string): Promise<GroupDetail> {
    return this.presenter.detail(userId, await this.core.asMember(groupId, userId, true));
  }

  private async checkLimit(userId: string): Promise<void> {
    const profile = await this.core.profile(userId);
    const limit = this.core.limitOf(profile);
    if (!canJoinAnotherGroup(await this.core.countMemberships(userId), limit)) {
      throw new DomainError(
        'forbidden',
        groupError((t) => (limit >= 10 ? t.limitPlus : t.limit(limit))),
      );
    }
  }

  /** La personne suit l'habitude du groupe ; sinon on l'ajoute (dans sa limite d'habitudes). */
  private async ensureHabit(userId: string, habitId: string): Promise<void> {
    if ((await this.habits.listActive(userId)).some((h) => h.habitId === habitId)) return;
    try {
      await this.habitsService.add(userId, habitId);
    } catch (err) {
      if (err instanceof DomainError && err.code === 'forbidden') {
        const limit = (await this.habits.listActive(userId)).length;
        throw new DomainError(
          'forbidden',
          groupError((t) => t.habitSlot(limit)),
        );
      }
      throw err;
    }
  }

  /** Personnes invitables par `by` : ses liens vivants seulement. */
  private async checkLinks(by: string, ids: readonly string[]): Promise<void> {
    for (const id of ids) {
      const [a, b] = by < id ? [by, id] : [id, by];
      const link = await this.links.findBetween(a, b);
      if (!link || link.status !== 'active')
        throw new DomainError(
          'invalid',
          groupError((t) => t.notALink),
        );
    }
  }

  /** Écrit les invitations et prévient celles qui arrivent (les autres restent en attente, invisibles). */
  private async sendInvitations(loaded: LoadedGroup, by: string, ids: readonly string[]): Promise<void> {
    const now = this.core.now().toISOString();
    const inviter = await this.core.profile(by);
    for (const id of ids) {
      const existing = loaded.members.find((m) => m.userId === id);
      if (existing && (existing.status === 'active' || existing.status === 'invited')) continue;
      await this.core.members.put({
        groupId: loaded.group.id,
        userId: id,
        status: 'invited',
        invitedBy: by,
        joinedAt: null,
        leftAt: null,
        lastReadAt: null,
        notifiedAt: null,
        createdAt: now,
      });
      if (await this.core.invitationReachable(loaded.group, loaded.active, id)) {
        await this.core.notify([id], 'group_invite', {
          groupId: loaded.group.id,
          group: loaded.group.name,
          name: inviter.displayName,
          about: by,
          ...(loaded.group.habitId ? { habit: loaded.group.habitId } : {}),
        });
      }
    }
  }

  async create(userId: string, body: CreateGroupBody): Promise<GroupDetail> {
    checkGroupName(body.name);
    if (body.kind === 'habit' && (!body.habitId || !habitById(body.habitId)))
      throw new DomainError(
        'invalid',
        groupError((t) => t.habitUnknown),
      );
    const ids = [...new Set(body.memberIds.filter((id) => id !== userId))];
    // Aucune invitation : le groupe se remplit avec son lien (`minimoa.app/g/<code>`).
    if (ids.length > GROUP_MAX_MEMBERS - 1)
      throw new DomainError(
        'invalid',
        groupError((t) => t.invitees),
      );
    await this.checkLimit(userId);
    await this.checkLinks(userId, ids);
    if (body.kind === 'habit' && body.habitId) await this.ensureHabit(userId, body.habitId);
    const now = this.core.now().toISOString();
    const group: GroupRecord = {
      id: this.core.ids.uuid(),
      name: body.name,
      kind: body.kind,
      habitId: body.kind === 'habit' ? (body.habitId ?? null) : null,
      status: 'forming',
      createdBy: userId,
      lives: NEW_GROUP_HABIT_STATE.lives,
      streak: 0,
      bestStreak: 0,
      cleanDays: 0,
      startedOn: null,
      evaluatedThrough: null,
      fromTogether: false,
      closedAt: null,
      closedReason: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.core.groups.create(group);
    const me: GroupMemberRecord = {
      groupId: group.id,
      userId,
      status: 'active',
      invitedBy: null,
      joinedAt: now,
      leftAt: null,
      lastReadAt: now,
      notifiedAt: null,
      createdAt: now,
    };
    await this.core.members.put(me);
    const profile = await this.core.profile(userId);
    await this.core.event(
      group.id,
      'created',
      { name: profile.displayName, group: group.name },
      { userId, minimoa: false },
    );
    await this.sendInvitations({ group, members: [me], active: [me], invited: [] }, userId, ids);
    return this.detail(userId, group.id);
  }

  async invite(userId: string, groupId: string, memberIds: readonly string[]): Promise<GroupDetail> {
    const loaded = await this.core.asMember(groupId, userId);
    const ids = [...new Set(memberIds.filter((id) => id !== userId))].filter(
      (id) =>
        !loaded.members.some((m) => m.userId === id && (m.status === 'active' || m.status === 'invited')),
    );
    if (ids.length > groupSeatsLeft(loaded.active.length, loaded.invited.length))
      throw new DomainError(
        'forbidden',
        groupError((t) => t.full),
      );
    await this.checkLinks(userId, ids);
    await this.sendInvitations(loaded, userId, ids);
    return this.detail(userId, groupId);
  }

  // ── Lien d'invitation (`minimoa.app/g/<code>`, docs/VIRALITE.md) ──────────

  /** Le code du lien, créé à la première demande d'un membre. */
  async inviteLink(userId: string, groupId: string): Promise<GroupInviteLink> {
    const { group } = await this.core.asMember(groupId, userId);
    const code = (await this.core.groups.inviteCode(groupId)) ?? (await this.freshLinkCode(groupId));
    return { code, canReset: group.createdBy === userId };
  }

  /** Un nouveau code (le créateur seulement) : l'ancien lien ne mène plus nulle part. */
  async resetInviteLink(userId: string, groupId: string): Promise<GroupInviteLink> {
    const { group } = await this.core.asMember(groupId, userId);
    if (group.createdBy !== userId)
      throw new DomainError(
        'forbidden',
        groupError((t) => t.linkResetCreator),
      );
    return { code: await this.freshLinkCode(groupId), canReset: true };
  }

  private async freshLinkCode(groupId: string): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const code = this.core.ids.code();
      if (await this.core.groups.setInviteCode(groupId, code)) return code;
    }
    throw new Error('aucun code de groupe libre trouvé');
  }

  /** Groupe d'un lien encore valable (pas fermé, créé dans le vrai monde). */
  private async byCode(code: string): Promise<LoadedGroup> {
    const group = await this.core.groups.findByInviteCode(normalizeCode(code));
    if (!group || group.status === 'closed')
      throw new DomainError(
        'not_found',
        groupError((t) => t.linkGone),
      );
    return this.core.load(group.id);
  }

  /**
   * Page publique d'un groupe : nom, habitude, jours tenus, nombre de membres et l'espèce de leurs minimoas. Jamais un
   * prénom, un nom de minimoa ni une position. Une visite est comptée (sans IP).
   */
  async preview(code: string): Promise<GroupPreview> {
    const loaded = await this.byCode(code);
    const g = loaded.group;
    // Les membres visibles du public seulement (un compte suspendu n'y est pas).
    const visible = (await Promise.all(loaded.active.map(async (m) => (await this.audience.publiclyVisible(await this.core.profiles.findById(m.userId))) ? m.userId : null))).filter((id): id is string => id !== null);
    if (visible.length === 0)
      throw new DomainError(
        'not_found',
        groupError((t) => t.linkGone),
      );
    const people = await this.presenter.people(visible[0] ?? '', visible);
    const kept = g.startedOn ? (await this.days.listBetween(g.id, g.startedOn, this.core.today())).filter((d) => d.outcome === 'kept').length : 0;
    await this.growth.visit('g');
    return {
      name: g.name,
      kind: g.kind,
      status: g.status,
      habitLabel: g.habitId ? (habitById(g.habitId, requestLocale())?.label ?? null) : null,
      daysKept: kept,
      streak: g.streak,
      bestStreak: g.bestStreak,
      memberCount: loaded.active.length,
      full: loaded.active.length >= GROUP_MAX_MEMBERS,
      missing: missingMembers(loaded.active.length),
      species: [...people.values()].map((p) => p.pet.species),
    };
  }

  /**
   * Rejoindre par le lien : mêmes règles qu'une invitation (8 membres au plus, ta limite de groupes, l'habitude ajoutée
   * dans ta limite). Bloqué avec un membre, monde de revue d'Apple : introuvable (rien ne trahit un blocage). Déjà
   * membre : le groupe, sans rien changer. Les autres membres sont prévenus.
   */
  async joinByCode(userId: string, code: string): Promise<GroupDetail> {
    const loaded = await this.byCode(code);
    const g = loaded.group;
    if (loaded.active.some((m) => m.userId === userId)) return this.detail(userId, g.id);
    const me = await this.core.profile(userId);
    const creator = g.createdBy ? await this.core.profiles.findById(g.createdBy) : null;
    if ((me.reviewWorld ?? null) !== (creator?.reviewWorld ?? null) || !(await this.core.invitationReachable(g, loaded.active, userId)))
      throw new DomainError(
        'not_found',
        groupError((t) => t.linkGone),
      );
    if (loaded.active.length >= GROUP_MAX_MEMBERS)
      throw new DomainError(
        'forbidden',
        groupError((t) => t.full),
      );
    await this.checkLimit(userId);
    if (g.habitId) await this.ensureHabit(userId, g.habitId);
    const now = this.core.now().toISOString();
    const row = loaded.members.find((m) => m.userId === userId);
    await this.core.members.put({
      groupId: g.id,
      userId,
      status: 'active',
      invitedBy: row?.invitedBy ?? null,
      joinedAt: now,
      leftAt: null,
      lastReadAt: now,
      notifiedAt: null,
      createdAt: row?.createdAt ?? now,
    });
    const pet = await this.petName(userId);
    await this.core.event(g.id, 'joined', { name: me.displayName, minimoa: pet }, { userId, minimoa: true });
    await this.core.notify(
      loaded.active.map((m) => m.userId),
      'group_joined',
      { groupId: g.id, group: g.name, name: me.displayName, about: userId, count: String(loaded.active.length + 1) },
    );
    await this.startIfReady(await this.core.load(g.id));
    return this.detail(userId, g.id);
  }

  /** Démarre le groupe s'il atteint 3 membres. */
  private async startIfReady(loaded: LoadedGroup): Promise<void> {
    const next = groupStatusAfter(loaded.group.status, loaded.active.length);
    if (next === loaded.group.status) return;
    await this.core.groups.update(loaded.group.id, {
      status: next,
      startedOn: this.core.today(),
      updatedAt: this.core.now().toISOString(),
    });
    await this.core.event(loaded.group.id, 'started', { count: loaded.active.length });
  }

  async accept(userId: string, groupId: string): Promise<GroupDetail> {
    const loaded = await this.core.load(groupId);
    const row = loaded.members.find((m) => m.userId === userId);
    if (row?.status === 'active')
      throw new DomainError(
        'conflict',
        groupError((t) => t.alreadyMember),
      );
    if (
      row?.status !== 'invited' ||
      !(await this.core.invitationReachable(loaded.group, loaded.active, userId))
    ) {
      throw new DomainError(
        'not_found',
        groupError((t) => t.invitationGone),
      );
    }
    if (loaded.active.length >= GROUP_MAX_MEMBERS)
      throw new DomainError(
        'forbidden',
        groupError((t) => t.full),
      );
    await this.checkLimit(userId);
    if (loaded.group.habitId) await this.ensureHabit(userId, loaded.group.habitId);
    const now = this.core.now().toISOString();
    await this.core.members.update(groupId, userId, {
      status: 'active',
      joinedAt: now,
      lastReadAt: now,
      leftAt: null,
    });
    const [profile, pet] = await Promise.all([this.core.profile(userId), this.petName(userId)]);
    await this.core.event(
      groupId,
      'joined',
      { name: profile.displayName, minimoa: pet },
      { userId, minimoa: true },
    );
    const after = await this.core.load(groupId);
    await this.startIfReady(after);
    return this.detail(userId, groupId);
  }

  private async petName(userId: string): Promise<string> {
    return (await this.presenter.people(userId, [userId])).get(userId)?.pet.name ?? '';
  }

  async decline(userId: string, groupId: string): Promise<void> {
    const row = await this.core.members.find(groupId, userId);
    if (row?.status !== 'invited')
      throw new DomainError(
        'not_found',
        groupError((t) => t.invitationGone),
      );
    await this.core.members.update(groupId, userId, { status: 'declined' });
  }

  async leave(userId: string, groupId: string): Promise<void> {
    const row = await this.core.members.find(groupId, userId);
    if (row?.status === 'invited') return this.decline(userId, groupId);
    if (row?.status !== 'active')
      throw new DomainError(
        'forbidden',
        groupError((t) => t.notMember),
      );
    await this.core.members.update(groupId, userId, {
      status: 'left',
      leftAt: this.core.now().toISOString(),
    });
    const profile = await this.core.profile(userId);
    await this.core.event(groupId, 'left', { name: profile.displayName });
  }

  async rename(userId: string, groupId: string, name: string): Promise<GroupAction> {
    await this.core.asMember(groupId, userId);
    checkGroupName(name);
    await this.core.groups.update(groupId, { name, updatedAt: this.core.now().toISOString() });
    const profile = await this.core.profile(userId);
    const event = await this.core.event(
      groupId,
      'renamed',
      { name: profile.displayName, group: name },
      { userId, minimoa: false },
    );
    return this.action(userId, groupId, [event]);
  }

  /** Réveiller un groupe endormi : 5 vies, série à zéro ; les jours où il dormait ne sont pas jugés. */
  async wake(userId: string, groupId: string): Promise<GroupAction> {
    const { group } = await this.core.asMember(groupId, userId);
    if (group.status !== 'asleep')
      throw new DomainError(
        'conflict',
        groupError((t) => t.notAsleep),
      );
    const state = wakeGroup(habitStateOf(group));
    const closed = lastClosedDay(this.core.today(), this.core.hour());
    const evaluatedThrough =
      group.evaluatedThrough && group.evaluatedThrough > closed ? group.evaluatedThrough : closed;
    await this.core.groups.update(groupId, {
      status: 'active',
      lives: state.lives,
      streak: state.streak,
      cleanDays: state.cleanDays,
      evaluatedThrough,
      updatedAt: this.core.now().toISOString(),
    });
    const [profile, pet] = await Promise.all([this.core.profile(userId), this.petName(userId)]);
    const event = await this.core.event(
      groupId,
      'woke',
      { name: profile.displayName, minimoa: pet },
      { userId, minimoa: true },
    );
    return this.action(userId, groupId, [event]);
  }

  /**
   * Poser un joker pour le jour du groupe (aujourd'hui, ou hier jusqu'à midi) : il vient de la même réserve que la
   * série du défi (le jour s'ajoute aussi à ses jokers) et couvre ce jour pour tous les groupes de la personne.
   */
  async joker(userId: string, groupId: string, day: Day): Promise<GroupAction> {
    const loaded = await this.core.asMember(groupId, userId);
    const g = loaded.group;
    if (g.kind !== 'habit')
      throw new DomainError(
        'invalid',
        groupError((t) => t.notHabitGroup),
      );
    if (g.status === 'asleep')
      throw new DomainError(
        'conflict',
        groupError((t) => t.asleep),
      );
    const today = this.core.today();
    if (!canPlaceJokerFor(day, today, this.core.hour()))
      throw new DomainError(
        'invalid',
        groupError((t) => t.jokerWindow),
      );
    const states = await this.core.memberStates(
      g,
      loaded.active.filter((m) => m.userId === userId),
      addDays(day, -7),
    );
    const mine = states.get(userId);
    if (!mine || memberDayStatus(mine, day, false) !== 'pending')
      throw new DomainError(
        'conflict',
        groupError((t) => t.jokerUseless),
      );
    const profile = await this.core.profile(userId);
    const pool = await this.core.jokerPool(userId, profile, day);
    const cost = jokerCost(pool.used, day, pool.perWeek);
    if (cost === 'none_left')
      throw new DomainError(
        'forbidden',
        groupError((t) => t.jokerNone),
      );
    const nowIso = this.core.now().toISOString();
    await this.core.jokers.add(userId, day, nowIso);
    if (!pool.streakDays.includes(day)) {
      const state = await this.core.ritualStates.find(userId);
      const streak = state?.streak ?? { current: 0, best: 0, lastDoneOn: null, jokerDays: [] };
      await this.core.ritualStates.upsert(userId, {
        streak: { ...streak, jokerDays: [...pool.streakDays, day] },
      });
    }
    const event = await this.core.event(
      groupId,
      'joker',
      { name: profile.displayName },
      { userId, minimoa: false },
    );
    return this.action(userId, groupId, [event]);
  }

  /** Signaler un message, un membre ou le groupe : même bureau des signalements que les liens. */
  async report(userId: string, groupId: string, body: GroupReportBody): Promise<void> {
    const loaded = await this.core.asMember(groupId, userId, true);
    let target: string | null = null;
    let messageId: string | null = null;
    if (body.messageId) {
      const m = await this.core.messages.find(body.messageId);
      if (!m || m.groupId !== groupId)
        throw new DomainError(
          'invalid',
          groupError((t) => t.reportTarget),
        );
      messageId = m.id;
      target = m.authorKind === 'user' ? m.authorId : null;
    } else if (body.userId) {
      if (!loaded.members.some((m) => m.userId === body.userId && m.status !== 'invited'))
        throw new DomainError(
          'invalid',
          groupError((t) => t.reportTarget),
        );
      target = body.userId;
    }
    if (target === userId) target = null;
    await this.desk.file({
      reporter: userId,
      targetUser: target,
      groupId,
      groupMessageId: messageId,
      reason: body.reason,
      details: body.details ?? null,
      source: 'person',
      category: null,
    });
  }

  async action(
    userId: string,
    groupId: string,
    records: readonly GroupMessageRecord[],
  ): Promise<GroupAction> {
    const group = await this.detail(userId, groupId);
    return { group, messages: await this.presenter.messages(userId, records) };
  }
}
