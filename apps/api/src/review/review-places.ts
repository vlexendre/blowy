/**
 * Le monde d'exemple du compte de revue suit sa zone : quand le compte de revue donne sa position ou choisit une zone,
 * ses personnes fictives sont replacées autour (mêmes distances et directions). Rien pour tout autre compte.
 */
import { Inject, Injectable } from '@nestjs/common';
import { type GeoPoint, cellOf, offsetPoint, reviewFixtureId, reviewWorldPlan, storedPoint } from '@blowy/domain';
import type { Clock } from '../shared/clock';
import { CLOCK, PROFILES } from '../shared/tokens';
import type { ProfilesRepository } from '../modules/me/ports';
import type { MatchCacheRepository, PlacesRepository } from '../modules/vision/ports';
import { MATCH_CACHE, PLACES } from '../modules/vision/tokens';

@Injectable()
export class ReviewPlaces {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PLACES) private readonly places: PlacesRepository,
    @Inject(MATCH_CACHE) private readonly cache: MatchCacheRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Replace les personnes fictives du monde `world` autour de `center`. Rend leur nombre. */
  async placeAround(world: string, center: GeoPoint): Promise<number> {
    const reviewer = await this.profiles.findById(world);
    if (!reviewer || reviewer.reviewWorld !== world) return 0;
    const fixtures = new Set((await this.profiles.listFixtures(world)).map((p) => p.id));
    const now = this.clock.now().toISOString();
    let n = 0;
    for (const f of reviewWorldPlan(reviewer)) {
      const id = reviewFixtureId(world, f.slot);
      if (!fixtures.has(id)) continue;
      const home = storedPoint(offsetPoint(center, f.distanceKm, f.bearing));
      await this.places.save({ userId: id, last: home, locatedAt: now, lastAwayAt: null, home, homeCell: cellOf(home), candidate: null, candidateSince: null, chosenCity: null, source: 'gps', manualArea: null });
      await this.cache.clear(id);
      n += 1;
    }
    await this.cache.clear(world);
    return n;
  }

  /** Appelé après chaque changement de zone d'une personne : seul le compte de revue fait bouger son monde. */
  async follow(userId: string, center: GeoPoint): Promise<void> {
    const profile = await this.profiles.findById(userId);
    if (profile?.reviewWorld !== userId) return;
    await this.placeAround(userId, center);
  }
}
