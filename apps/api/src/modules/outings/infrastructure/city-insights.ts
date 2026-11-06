/**
 * V5.5 (D-059, spec §2.2) — indicateurs de ville : photographie QUOTIDIENNE (`CityInsightSnapshot`, serveur seul,
 * purge `[T] cityInsights.snapshotRetentionDays`) des personnes vérifiées actives de la ville ; lecture
 * `GET /v1/me/city-insights` : `storyCompatible` (seulement pour qui cherche une histoire, d'après MA ligne de
 * la photographie — un changement de préférences n'agit qu'au lendemain : pas d'attaque par différences) et
 * inscrits par tranche d'âge de la grille fixe ; toujours ≥ 10 et arrondis (`approxCount`), jamais par groupe.
 */
import { createHmac } from 'node:crypto';
import type { Db } from '@blowy/database';
import { AGE_BRACKETS_V52, ageBracketOf, seeksOf, type Gender } from '@blowy/domain';
import { approxCount, storyCompatible } from '@blowy/matching/groups';
import { defaultGroupAge } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import { verifiedSet } from './candidates.js';

interface Entry {
  /** Condensé de l'identifiant (pour s'exclure soi-même) — jamais l'identifiant. */
  h: string;
  g: Gender;
  r: boolean;
  rg: Gender[];
  a: number;
  ga: [number, number];
}
interface Payload {
  v: 1;
  entries: Entry[];
}

const DAY = 86_400_000;
const ageOn = (birth: Date, at: Date) => {
  let a = at.getUTCFullYear() - birth.getUTCFullYear();
  if (at.getUTCMonth() < birth.getUTCMonth() || (at.getUTCMonth() === birth.getUTCMonth() && at.getUTCDate() < birth.getUTCDate())) a--;
  return a;
};

export class CityInsights {
  constructor(
    private readonly db: Db,
    private readonly tuning: Tuning,
    private readonly secret: string,
  ) {}

  private hash(userId: string) {
    return createHmac('sha256', this.secret).update(`city-insights:${userId}`).digest('base64url').slice(0, 16);
  }

  /** Job quotidien `neighborhoods.city_insights` : une photographie par ville et par jour (UTC) ; purge. */
  async snapshot(now: Date): Promise<{ cities: number; purged: number }> {
    const day = new Date(Math.floor(now.getTime() / DAY) * DAY);
    const nbs = await this.db.neighborhood.findMany({ where: { status: { in: ['LIVE', 'WAITLIST'] } }, select: { id: true, cityZoneId: true } });
    const zones = new Map<string, string[]>();
    for (const n of nbs) zones.set(n.cityZoneId, [...(zones.get(n.cityZoneId) ?? []), n.id]);
    let cities = 0;
    for (const [zoneId, ids] of zones) {
      if (await this.db.cityInsightSnapshot.count({ where: { cityZoneId: zoneId, day } })) continue;
      const users = await this.db.user.findMany({
        where: { neighborhoodId: { in: ids }, status: 'ACTIVE', onboardedAt: { not: null }, birthDate: { not: null } },
        select: { id: true, birthDate: true, profile: { select: { gender: true } }, matchPreferences: { select: { lookingFor: true, romanceGenders: true } }, outingPreferences: { select: { groupAgeMin: true, groupAgeMax: true } } },
      });
      const verified = await verifiedSet(this.db, users.map((u) => u.id), now);
      const entries: Entry[] = users
        .filter((u) => verified.has(u.id))
        .map((u) => {
          const a = ageOn(u.birthDate!, now);
          const romance = seeksOf(u.matchPreferences?.lookingFor ?? 'FRIENDS').romance;
          const ga = u.outingPreferences ? [u.outingPreferences.groupAgeMin, u.outingPreferences.groupAgeMax] : (Object.values(defaultGroupAge(a, this.tuning)) as [number, number]);
          return { h: this.hash(u.id), g: (u.profile?.gender ?? 'UNDISCLOSED') as Gender, r: romance, rg: romance ? ((u.matchPreferences?.romanceGenders ?? []) as Gender[]) : [], a, ga: [ga[0]!, ga[1]!] };
        });
      await this.db.cityInsightSnapshot.create({ data: { cityZoneId: zoneId, day, payload: { v: 1, entries } as object } });
      cities++;
    }
    const purged = (await this.db.cityInsightSnapshot.deleteMany({ where: { day: { lt: new Date(day.getTime() - this.tuning.cityInsights.snapshotRetentionDays * DAY) } } })).count;
    return { cities, purged };
  }

  /** `GET /v1/me/city-insights` : photographie la plus récente de MA ville. */
  async forUser(userId: string) {
    const u = await this.db.user.findUnique({ where: { id: userId }, select: { neighborhood: { select: { cityZoneId: true } } } });
    const zoneId = u?.neighborhood?.cityZoneId;
    const snap = zoneId ? await this.db.cityInsightSnapshot.findFirst({ where: { cityZoneId: zoneId }, orderBy: { day: 'desc' } }) : null;
    const min = this.tuning.cityInsights.minCount;
    if (!snap) return { asOf: null, ageBrackets: AGE_BRACKETS_V52.map((bracket) => ({ bracket, ...approxCount(0, min) })) };
    const p = snap.payload as unknown as Payload;
    const me = p.entries.find((e) => e.h === this.hash(userId));
    const prof = (e: Entry) => ({ gender: e.g, seeks: { friends: true, romance: e.r }, meetGenders: [], romanceGenders: e.rg, age: e.a, groupAge: { min: e.ga[0], max: e.ga[1] } });
    const story = me?.r ? approxCount(p.entries.filter((e) => e.h !== me.h && storyCompatible(prof(me), prof(e))).length, min) : undefined;
    const counts = new Map<string, number>();
    for (const e of p.entries) counts.set(ageBracketOf(e.a), (counts.get(ageBracketOf(e.a)) ?? 0) + 1);
    return {
      asOf: snap.day.toISOString().slice(0, 10),
      ...(story ? { storyCompatible: story } : {}),
      ageBrackets: AGE_BRACKETS_V52.map((bracket) => ({ bracket, ...approxCount(counts.get(bracket) ?? 0, min) })),
    };
  }
}
