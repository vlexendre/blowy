import { Inject, Injectable } from '@nestjs/common';
import type { Progression } from '@blowy/contract';
import { LEAGUE_SIZE, NO_ACTIVITY, TROPHY_COUNT, dayOf, rankLeague, trophies, trophiesWon, weekEnd, weekStart, weeklySparks } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { CLOCK, PETS } from '../../../shared/tokens';
import type { PetsRepository } from '../../pets/ports';
import { RITUAL_STATES } from '../../rituels/tokens';
import type { RitualStatesRepository } from '../../rituels/ports';
import { Audience } from '../../safety/application/audience';
import { PROGRESSION_READER, type ProgressionReader } from '../ports';

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
  ) {}

  async get(userId: string): Promise<Progression> {
    const today = dayOf(this.clock.now());
    const monday = weekStart(today);
    // Lundi 00:00 à Paris, à une heure près (UTC+1 ou +2) : on prend le plus tôt des deux.
    const since = new Date(`${monday}T00:00:00+02:00`).toISOString();

    const [life, state, near] = await Promise.all([this.reader.lifetime(userId), this.states.find(userId), this.reader.neighbours(userId, LEAGUE_SIZE)]);
    const streak = state?.streak ?? { current: 0, best: 0 };
    const list = trophies({ ...life, bestStreak: Math.max(streak.best, streak.current) });

    const located = near.length > 0;
    const others = await this.audience.visible(userId, near.filter((id) => id !== userId), 'map');
    const members = [userId, ...others.slice(0, LEAGUE_SIZE - 1).map((p) => p.id)];
    const names = new Map(others.map((p) => [p.id, p.displayName]));
    const [activity, pets] = await Promise.all([this.reader.week(members, since), this.pets.findByOwners(members)]);
    const species = new Map(pets.map((p) => [p.ownerId, p.species]));
    const ranked = rankLeague(members.map((id) => ({ userId: id, sparks: weeklySparks(activity.get(id) ?? NO_ACTIVITY) })));
    const mine = ranked.find((r) => r.userId === userId);

    return {
      sparks: mine?.sparks ?? 0,
      streak: { current: streak.current, best: Math.max(streak.best, streak.current) },
      trophies: list,
      trophiesWon: trophiesWon(list),
      trophiesTotal: TROPHY_COUNT,
      league: {
        endsOn: weekEnd(today),
        located,
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
