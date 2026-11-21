import { Inject, Injectable } from '@nestjs/common';
import type { Progression } from '@blowy/contract';
import {
  LEAGUE_SIZE,
  type LeagueTier,
  NO_ACTIVITY,
  TROPHY_COUNT,
  addDays,
  dayOf,
  leagueZones,
  nextLeague,
  rankLeague,
  settleLeague,
  trophies,
  trophiesWon,
  weekEnd,
  weekStart,
  weeklySparks,
} from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { CLOCK, PETS } from '../../../shared/tokens';
import type { PetsRepository } from '../../pets/ports';
import { RITUAL_STATES } from '../../rituels/tokens';
import type { RitualStatesRepository } from '../../rituels/ports';
import { Audience } from '../../safety/application/audience';
import {
  LEAGUE_STANDINGS,
  type LeagueStanding,
  type LeagueStandingsRepository,
  PROGRESSION_READER,
  type ProgressionReader,
} from '../ports';

/**
 * Étincelles de la semaine, ligue entre voisins (même zone de domicile, ceux que la carte peut montrer) et trophées.
 * Tout est recalculé à la lecture à partir des compteurs existants (`packages/domain/src/progression.ts`).
 */
@Injectable()
export class ProgressionService {
  constructor(
    @Inject(PROGRESSION_READER) private readonly reader: ProgressionReader,
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(LEAGUE_STANDINGS) private readonly standings: LeagueStandingsRepository,
  ) {}

  /** Le groupe d'une ligue : les voisins de la même ligue (au moins 5), sinon tous les voisins ; toi compris. */
  private groupOf(
    userId: string,
    tier: LeagueTier,
    near: readonly string[],
    tiers: Map<string, LeagueStanding>,
  ): string[] {
    const same = near.filter((id) => id === userId || (tiers.get(id)?.tier ?? 'plume') === tier);
    const pool = same.length >= 5 ? same : near;
    return [userId, ...pool.filter((id) => id !== userId)].slice(0, LEAGUE_SIZE);
  }

  async get(userId: string): Promise<Progression> {
    const today = dayOf(this.clock.now());
    const monday = weekStart(today);
    // Lundi 00:00 à Paris, à une heure près (UTC+1 ou +2) : on prend le plus tôt des deux.
    const since = new Date(`${monday}T00:00:00+02:00`).toISOString();
    const lastMonday = new Date(`${addDays(monday, -7)}T00:00:00+02:00`).toISOString();

    const [life, state, near] = await Promise.all([
      this.reader.lifetime(userId),
      this.states.find(userId),
      this.reader.neighbours(userId, LEAGUE_SIZE),
    ]);
    const streak = state?.streak ?? { current: 0, best: 0 };
    const list = trophies({ ...life, bestStreak: Math.max(streak.best, streak.current) });

    const located = near.length > 0;
    const others = await this.audience.visible(
      userId,
      near.filter((id) => id !== userId),
      'map',
    );
    const visibleNear = [userId, ...others.map((p) => p.id)];
    const names = new Map(others.map((p) => [p.id, p.displayName]));
    const tiers = await this.standings.find(visibleNear);

    // Ta ligue, gardée d'une semaine à l'autre ; la semaine finie se solde à la première lecture de la suivante.
    let mineSt: LeagueStanding = tiers.get(userId) ?? {
      userId,
      tier: 'plume',
      week: monday,
      result: null,
      resultRank: null,
      resultFrom: null,
    };
    if (!tiers.has(userId)) await this.standings.save(mineSt);
    else if (mineSt.week < monday) {
      const lastGroup = this.groupOf(userId, mineSt.tier, visibleNear, tiers);
      const lastActivity = await this.reader.week(lastGroup, lastMonday, since);
      const lastRanked = rankLeague(
        lastGroup.map((id) => ({ userId: id, sparks: weeklySparks(lastActivity.get(id) ?? NO_ACTIVITY) })),
      );
      const me = lastRanked.find((r) => r.userId === userId);
      // Pas venu la semaine d'avant (ou plus) : zéro étincelle, comme Duolingo.
      const wasLastWeek = mineSt.week === weekStart(addDays(monday, -7));
      const settled = settleLeague(
        mineSt.tier,
        me?.rank ?? lastGroup.length,
        lastGroup.length,
        wasLastWeek ? (me?.sparks ?? 0) : 0,
      );
      mineSt = {
        userId,
        tier: settled.tier,
        week: monday,
        result: settled.outcome,
        resultRank: me?.rank ?? null,
        resultFrom: mineSt.tier,
      };
      await this.standings.save(mineSt);
      tiers.set(userId, mineSt);
    }
    const tier = mineSt.tier;
    const members = this.groupOf(userId, tier, visibleNear, tiers);
    const [activity, pets, last] = await Promise.all([
      this.reader.week(members, since),
      this.pets.findByOwners(members),
      this.reader.week([userId], lastMonday, since),
    ]);
    const lastWeekSparks = weeklySparks(last.get(userId) ?? NO_ACTIVITY);
    const species = new Map(pets.map((p) => [p.ownerId, p.species]));
    const ranked = rankLeague(
      members.map((id) => ({ userId: id, sparks: weeklySparks(activity.get(id) ?? NO_ACTIVITY) })),
    );
    const mine = ranked.find((r) => r.userId === userId);
    const zones = { ...leagueZones(tier, ranked.length), size: ranked.length };
    const cut = zones.promote > 0 ? ranked[zones.promote - 1] : undefined;
    const toPromote =
      zones.promote === 0 || !nextLeague(tier)
        ? null
        : !mine
          ? null
          : mine.rank <= zones.promote && mine.sparks > 0
            ? 0
            : Math.max(1, (cut?.sparks ?? 0) - mine.sparks + 1);

    return {
      sparks: mine?.sparks ?? 0,
      streak: { current: streak.current, best: Math.max(streak.best, streak.current) },
      trophies: list,
      trophiesWon: trophiesWon(list),
      trophiesTotal: TROPHY_COUNT,
      league: {
        endsOn: weekEnd(today),
        located,
        tier,
        lastWeekSparks,
        next: nextLeague(tier),
        zones,
        result:
          mineSt.result && mineSt.resultFrom && mineSt.week === monday
            ? { outcome: mineSt.result, from: mineSt.resultFrom, to: tier, rank: mineSt.resultRank ?? 0 }
            : null,
        toPromote,
        rows: ranked
          .filter((r) => species.has(r.userId))
          .map((r) => ({
            rank: r.rank,
            userId: r.userId,
            displayName: r.userId === userId ? '' : (names.get(r.userId) ?? ''),
            species: species.get(r.userId) ?? 'nino',
            sparks: r.sparks,
            podium: r.podium,
            me: r.userId === userId,
          })),
      },
    };
  }
}
