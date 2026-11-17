import { Inject, Injectable, Optional } from '@nestjs/common';
import { groupesText, habitById } from '@blowy/content';
import type { Together, TogetherResult } from '@blowy/contract';
import {
  GROUP_MAX_MEMBERS,
  TOGETHER_PROPOSAL_DAYS,
  type TogetherCandidate,
  ZONE_RADIUS_KM,
  isTogetherEligible,
  togetherCount,
} from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import { requestLocale } from '../../../shared/locale';
import type { Profile } from '../../me/ports';
import type { HabitsRepository } from '../../rituels/ports';
import { HABITS } from '../../rituels/tokens';
import { Audience } from '../../safety/application/audience';
import { Matchmaker } from '../../vision/application/matchmaker';
import type { GroupRecord, TogetherRepository } from '../ports';
import { TOGETHER, TOGETHER_FIXTURES, type TogetherFixtures } from '../tokens';
import { GroupCore, groupError } from './group-core';

/** Personnes de la zone examinées au plus (les plus compatibles d'abord). */
const CANDIDATE_CAP = 100;

/**
 * « La tenir ensemble » (spéc §26). Seul un nombre sort d'ici : ni identité, ni position (pas même arrondie). Sont
 * comptées les personnes de ta zone (celle de la carte, ~1,5 km) dont la vision est compatible (seuil 70), qui tiennent
 * la même habitude, la montrent, ne sont pas en mode discret, et que `Audience` laisse voir (« together » : ni bloquées
 * dans un sens ou dans l'autre, ni suspendues). Dire oui range une proposition ; dès que deux autres personnes
 * éligibles ont dit oui, le groupe démarre et les identités apparaissent entre elles seulement.
 */
@Injectable()
export class TogetherUseCases {
  constructor(
    @Inject(GroupCore) private readonly core: GroupCore,
    @Inject(HABITS) private readonly habits: HabitsRepository,
    @Inject(TOGETHER) private readonly proposals: TogetherRepository,
    @Inject(Matchmaker) private readonly matchmaker: Matchmaker,
    @Inject(Audience) private readonly audience: Audience,
    @Optional() @Inject(TOGETHER_FIXTURES) private readonly fixtures?: TogetherFixtures,
  ) {}

  /**
   * Candidats de la zone avec leur compatibilité (jamais renvoyés au client). Toujours autour de la zone du domicile
   * gardée par le serveur (celle de la carte gratuite), jamais d'un centre envoyé par l'app ni de la ville choisie avec
   * Minimoa+ : des requêtes répétées ne permettent pas de trianguler qui que ce soit.
   */
  private async zone(profile: Profile): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    const seeker = await this.matchmaker.seeker(profile);
    const home = seeker.place?.home ?? null;
    if (home)
      for (const m of await this.matchmaker.around(seeker, home, ZONE_RADIUS_KM, CANDIDATE_CAP))
        out.set(m.userId, m.score);
    if (this.fixtures)
      for (const id of await this.fixtures.candidatesFor(profile.id)) if (!out.has(id)) out.set(id, 100);
    return out;
  }

  /** Pour chaque habitude, les personnes éligibles (identifiants : usage interne seulement). */
  private async eligibleByHabit(
    profile: Profile,
    habitIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    const out = new Map<string, string[]>(habitIds.map((h) => [h, []]));
    if (habitIds.length === 0 || profile.showHabits === false || profile.discreet) return out;
    const zone = await this.zone(profile);
    const visible = await this.audience.visibleIds(profile.id, [...zone.keys()], 'together');
    const ids = [...visible];
    const lists = await Promise.all(ids.map((id) => this.habits.listActive(id)));
    ids.forEach((id, i) => {
      const held = new Set((lists[i] ?? []).map((h) => h.habitId));
      for (const habitId of habitIds) {
        const c: TogetherCandidate = {
          holdsHabit: held.has(habitId),
          sharesHabits: true,
          discreet: false,
          hidden: false,
          inZone: true,
          compatibility: zone.get(id) ?? null,
        };
        if (isTogetherEligible(c)) out.get(habitId)?.push(id);
      }
    });
    return out;
  }

  async suggestions(userId: string): Promise<Together> {
    const profile = await this.core.profile(userId);
    const mine = (await this.habits.listActive(userId)).map((h) => h.habitId);
    const eligible = await this.eligibleByHabit(profile, mine);
    const waiting = new Set((await this.proposals.listWaiting(userId)).map((p) => p.habitId));
    const locale = requestLocale();
    const t = groupesText.in(locale);
    return {
      suggestions: mine.flatMap((habitId) => {
        const ids = eligible.get(habitId) ?? [];
        const count = togetherCount(
          { sharesHabits: profile.showHabits !== false, discreet: profile.discreet },
          ids.map(() => ({
            holdsHabit: true,
            sharesHabits: true,
            discreet: false,
            hidden: false,
            inZone: true,
            compatibility: 100,
          })),
        );
        if (count === null) return [];
        const label = habitById(habitId, locale)?.label ?? habitId;
        return [{ habitId, label, count, text: t.together(count, label), proposed: waiting.has(habitId) }];
      }),
    };
  }

  async propose(userId: string, habitId: string): Promise<TogetherResult> {
    const profile = await this.core.profile(userId);
    if (!(await this.habits.listActive(userId)).some((h) => h.habitId === habitId))
      throw new DomainError(
        'invalid',
        groupError((t) => t.habitUnknown),
      );
    if (profile.showHabits === false || profile.discreet)
      throw new DomainError(
        'forbidden',
        groupError((t) => t.sharingOff),
      );
    const eligible = new Set((await this.eligibleByHabit(profile, [habitId])).get(habitId) ?? []);
    if (eligible.size < 2)
      throw new DomainError(
        'conflict',
        groupError((t) => t.togetherUnavailable),
      );
    const now = this.core.now();
    const nowIso = now.toISOString();
    const mineExisting = (await this.proposals.listWaiting(userId)).find((p) => p.habitId === habitId);
    const myProposalId = mineExisting?.id ?? this.core.ids.uuid();
    if (!mineExisting)
      await this.proposals.create({
        id: myProposalId,
        userId,
        habitId,
        status: 'waiting',
        groupId: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

    // Celles et ceux qui ont déjà dit oui, éligibles pour moi, deux à deux non bloqués, avec de la place pour un groupe.
    const since = new Date(now.getTime() - TOGETHER_PROPOSAL_DAYS * 86_400_000).toISOString();
    const others = (await this.proposals.listWaitingForHabit(habitId, since, 50)).filter(
      (p) => p.userId !== userId && eligible.has(p.userId),
    );
    const chosen: { userId: string; proposalId: string }[] = [];
    const blockedOf = new Map<string, Set<string>>([
      [userId, await this.core.blocks.blockedEitherWay(userId)],
    ]);
    for (const p of others) {
      if (chosen.length >= GROUP_MAX_MEMBERS - 1) break;
      const theirs = await this.core.blocks.blockedEitherWay(p.userId);
      const clash = [userId, ...chosen.map((c) => c.userId)].some(
        (id) => theirs.has(id) || blockedOf.get(id)?.has(p.userId),
      );
      if (clash) continue;
      const them = await this.core.profiles.findById(p.userId);
      if (!them || (await this.core.countMemberships(p.userId)) >= this.core.limitOf(them)) continue;
      blockedOf.set(p.userId, theirs);
      chosen.push({ userId: p.userId, proposalId: p.id });
    }
    const t = groupesText.in(requestLocale());
    if (chosen.length < 2 || (await this.core.countMemberships(userId)) >= this.core.limitOf(profile)) {
      // Prévenir les autres personnes éligibles qu'une proposition attend (le nombre seulement, une fois par jour).
      const waitingIds = new Set(others.map((p) => p.userId));
      await this.core.notify(
        [...eligible].filter((id) => !waitingIds.has(id)),
        'together_proposal',
        { habit: habitId },
      );
      return { status: 'waiting', groupId: null, line: t.togetherWaiting };
    }
    const group = await this.start(
      userId,
      habitId,
      chosen.map((c) => c.userId),
      nowIso,
    );
    await this.proposals.setStatus(
      [myProposalId, ...chosen.map((c) => c.proposalId)],
      'matched',
      group.id,
      nowIso,
    );
    return { status: 'started', groupId: group.id, line: t.togetherWaiting };
  }

  /** Le groupe démarre : tous ont déjà dit oui, ils deviennent membres ensemble (3 au moins). */
  private async start(
    userId: string,
    habitId: string,
    others: readonly string[],
    nowIso: string,
  ): Promise<GroupRecord> {
    const name = (habitById(habitId, requestLocale())?.label ?? habitId).slice(0, 30);
    const group: GroupRecord = {
      id: this.core.ids.uuid(),
      name,
      kind: 'habit',
      habitId,
      status: 'active',
      createdBy: userId,
      lives: 5,
      streak: 0,
      bestStreak: 0,
      cleanDays: 0,
      startedOn: this.core.today(),
      evaluatedThrough: null,
      fromTogether: true,
      closedAt: null,
      closedReason: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await this.core.groups.create(group);
    const all = [userId, ...others];
    for (const id of all) {
      await this.core.members.put({
        groupId: group.id,
        userId: id,
        status: 'active',
        invitedBy: null,
        joinedAt: nowIso,
        leftAt: null,
        lastReadAt: id === userId ? nowIso : null,
        notifiedAt: null,
        createdAt: nowIso,
      });
    }
    await this.core.event(group.id, 'started', { count: all.length });
    await this.core.notify(others, 'together_proposal', {
      groupId: group.id,
      group: name,
      habit: habitId,
      count: String(all.length),
    });
    return group;
  }

  async withdraw(userId: string, habitId: string): Promise<void> {
    const mine = (await this.proposals.listWaiting(userId)).filter((p) => p.habitId === habitId);
    await this.proposals.setStatus(
      mine.map((p) => p.id),
      'withdrawn',
      null,
      this.core.now().toISOString(),
    );
  }
}
