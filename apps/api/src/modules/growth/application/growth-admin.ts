import { Inject, Injectable } from '@nestjs/common';
import type { AdminCreator, AdminCreators, AdminGrowth } from '@blowy/contract';
import { type Day, FUNNEL_STEPS, addDays, dayOf, growthReport, lastWeeks, membersAt } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK } from '../../../shared/tokens';
import type { DailyStatsRepository } from '../../admin/ports';
import { DAILY_STATS } from '../../admin/tokens';
import {
  ACQUISITIONS,
  type AcquisitionsRepository,
  CREATORS,
  type CreatorsRepository,
  GROWTH_COUNTERS,
  GROWTH_EVENTS,
  GROWTH_READS,
  type GrowthCountersRepository,
  type GrowthEventsRepository,
  type GrowthReads,
} from '../ports';

/** Semaines du tableau de croissance. */
export const GROWTH_WEEKS = 12;

/** Administration de la croissance : le tableau par source et par semaine, et les codes des créateurs. */
@Injectable()
export class GrowthAdmin {
  constructor(
    @Inject(GROWTH_EVENTS) private readonly events: GrowthEventsRepository,
    @Inject(GROWTH_COUNTERS) private readonly counters: GrowthCountersRepository,
    @Inject(GROWTH_READS) private readonly reads: GrowthReads,
    @Inject(CREATORS) private readonly creators: CreatorsRepository,
    @Inject(ACQUISITIONS) private readonly acquisitions: AcquisitionsRepository,
    @Inject(DAILY_STATS) private readonly stats: DailyStatsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  private since(): { today: Day; weeks: Day[]; from: Day } {
    const today = dayOf(this.clock.now());
    const weeks = lastWeeks(today, GROWTH_WEEKS);
    return { today, weeks, from: weeks[0] ?? today };
  }

  async report(): Promise<AdminGrowth> {
    const { today, weeks, from } = this.since();
    const [events, counters, groups, daily] = await Promise.all([
      this.events.listSince(from),
      this.counters.listSince(from),
      this.reads.groupsCreatedSince(new Date(`${addDays(from, -1)}T00:00:00Z`).toISOString()),
      this.stats.range(from, today),
    ]);
    // Personnes actives de la semaine : le dernier chiffre « 7 jours glissants » calculé dans la semaine.
    const activeUsers = new Map<Day, number | null>();
    for (const w of weeks) {
      const inWeek = daily.filter((r) => r.day >= w && r.day <= addDays(w, 6)).sort((a, b) => a.day.localeCompare(b.day));
      activeUsers.set(w, inWeek.at(-1)?.metrics.wau ?? null);
    }
    const groupRows = groups.map((g) => {
      const createdOn = dayOf(new Date(g.createdAt));
      const d7 = new Date(Date.parse(g.createdAt) + 7 * 86_400_000).toISOString();
      return { createdOn, membersAtD7: membersAt(g.members, d7) };
    });
    const r = growthReport({ today, weeks, counters, events, activeUsers, groups: groupRows });
    return { ...r, steps: [...FUNNEL_STEPS] };
  }

  async listCreators(): Promise<AdminCreators> {
    const { from } = this.since();
    const [list, counters, joined] = await Promise.all([this.creators.list(), this.counters.listSince(from), this.acquisitions.countByCreator(from)]);
    const visits = new Map<string, number>();
    for (const c of counters) if (c.metric === 'visit_c' && c.ref) visits.set(c.ref, (visits.get(c.ref) ?? 0) + c.count);
    return {
      items: list.map((c): AdminCreator => ({ code: c.code, name: c.name, active: c.active, createdAt: c.createdAt, visits: visits.get(c.code) ?? 0, onboarded: joined.get(c.code) ?? 0 })),
    };
  }

  async createCreator(code: string, name: string): Promise<AdminCreators> {
    const now = this.clock.now().toISOString();
    if (!(await this.creators.create({ code, name, active: true, createdAt: now, updatedAt: now }))) throw new DomainError('conflict', 'Ce code existe déjà.');
    return this.listCreators();
  }

  async updateCreator(code: string, patch: { name?: string; active?: boolean }): Promise<AdminCreators> {
    const updated = await this.creators.update(code, { ...patch, updatedAt: this.clock.now().toISOString() });
    if (!updated) throw new DomainError('not_found', 'Code introuvable.');
    return this.listCreators();
  }
}
