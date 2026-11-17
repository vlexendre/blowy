import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type MemberDayStatus,
  applyGroupDay,
  dayOf,
  groupDayOutcome,
  groupDaysToSettle,
  lastClosedDay,
  memberDayStatus,
  parisHourOf,
} from '@blowy/domain';
import type { TickJob } from '../../tick/tick-job';
import type { GroupDaysRepository, GroupRecord } from '../ports';
import { GROUP_DAYS } from '../tokens';
import { GroupCore, habitStateOf } from './group-core';

const PAGE = 100;

/**
 * Minuteur des groupes d'habitude : chaque jour est jugé le lendemain à midi (Paris), une fois la fenêtre des jokers
 * fermée. Idempotent : chaque jour est réservé en avançant `evaluated_through` (écriture conditionnelle : si deux
 * minuteurs passent ensemble, un seul juge), puis rangé dans `group_days` ; un groupe interrompu reprend au jour suivant.
 * Vie perdue et groupe endormi : un événement dans le chat et une notification à chaque membre.
 */
@Injectable()
export class GroupJobs implements TickJob {
  private readonly logger = new Logger('GroupJobs');

  constructor(
    @Inject(GroupCore) private readonly core: GroupCore,
    @Inject(GROUP_DAYS) private readonly days: GroupDaysRepository,
  ) {}

  async runDue(now: Date, deadline?: number): Promise<number> {
    const over = (): boolean => deadline !== undefined && Date.now() > deadline;
    const lastClosed = lastClosedDay(dayOf(now), parisHourOf(now));
    let after: string | null = null;
    let done = 0;
    for (;;) {
      const page = await this.core.groups.listToSettle(lastClosed, after, PAGE);
      for (const g of page) {
        if (over()) return done;
        try {
          done += await this.settle(g, lastClosed, now);
        } catch (err) {
          this.logger.warn(`groupe non jugé : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
        }
      }
      if (page.length < PAGE) return done;
      after = page[page.length - 1]?.id ?? null;
    }
  }

  /** Juge les jours fermés d'un groupe ; rend le nombre de jours jugés. */
  async settle(group: GroupRecord, lastClosed: string, now: Date): Promise<number> {
    if (!group.startedOn || group.kind !== 'habit') return 0;
    const toJudge = groupDaysToSettle(group.startedOn, group.evaluatedThrough, lastClosed);
    if (toJudge.length === 0) return 0;
    const { active } = await this.core.load(group.id);
    const states = await this.core.memberStates(group, active, toJudge[0] as string);
    let state = habitStateOf(group);
    let through = group.evaluatedThrough;
    let n = 0;
    for (const day of toJudge) {
      const members: Record<string, MemberDayStatus> = {};
      for (const [userId, s] of states) members[userId] = memberDayStatus(s, day, true);
      const outcome = groupDayOutcome(Object.values(members));
      const effect = applyGroupDay(state, outcome);
      const nowIso = now.toISOString();
      const claimed = await this.core.groups.update(
        group.id,
        {
          lives: effect.state.lives,
          streak: effect.state.streak,
          bestStreak: effect.state.bestStreak,
          cleanDays: effect.state.cleanDays,
          status: effect.state.asleep ? 'asleep' : 'active',
          evaluatedThrough: day,
          updatedAt: nowIso,
        },
        through,
      );
      if (!claimed) return n; // un autre minuteur s'en occupe
      await this.days.insertIfAbsent({
        groupId: group.id,
        day,
        outcome,
        members,
        livesAfter: effect.state.lives,
        streakAfter: effect.state.streak,
        createdAt: nowIso,
      });
      n += 1;
      state = effect.state;
      through = day;
      const memberIds = active.map((m) => m.userId);
      const vars = {
        groupId: group.id,
        group: group.name,
        ...(group.habitId ? { habit: group.habitId } : {}),
      };
      if (effect.milestone) await this.core.event(group.id, 'milestone', { count: effect.milestone });
      if (effect.lifeGained) await this.core.event(group.id, 'life_gained', {});
      if (effect.lifeLost && !effect.fellAsleep) {
        await this.core.event(group.id, 'life_lost', { count: effect.state.lives });
        await this.core.notify(memberIds, 'group_life_lost', { ...vars, count: String(effect.state.lives) });
      }
      if (effect.fellAsleep) {
        await this.core.event(group.id, 'asleep', {});
        await this.core.notify(memberIds, 'group_asleep', vars);
        return n;
      }
    }
    return n;
  }
}
