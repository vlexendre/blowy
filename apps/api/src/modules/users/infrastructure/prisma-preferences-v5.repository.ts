import type { Db } from '@blowy/database';
import type { IntentionsV5Dto, OutingPreferencesV5Dto } from '@blowy/api-contract';
import { AGE_BRACKETS_V52, kidsHorizonOf, type AgeBracketV52 } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { PreferencesV5Repository } from '../application/ports/preferences-v5.repository.js';
import { ageOn, localCivilDate } from '../domain/age.js';

export class PrismaPreferencesV5Repository implements PreferencesV5Repository {
  constructor(private readonly db: Db) {}

  async intentions(userId: string): Promise<IntentionsV5Dto | null> {
    const p = await this.db.matchPreferences.findUnique({ where: { userId } });
    if (!p?.lookingFor || !p.meetingMode) return null;
    return { lookingFor: p.lookingFor, storySeriousness: p.storySeriousness, kidsSomeday: p.kidsSomeday, kidsHorizon: kidsHorizonOf(p.kidsHorizon, p.kidsSomeday), storyAgeBrackets: (p.storyAgeBrackets ?? []).filter((b): b is AgeBracketV52 => (AGE_BRACKETS_V52 as readonly string[]).includes(b)), meetingMode: p.meetingMode, meetGenders: p.meetGenders, romanceGenders: p.romanceGenders };
  }

  async saveIntentions(scope: TxScope, userId: string, i: IntentionsV5Dto) {
    const friends = i.lookingFor === 'FRIENDS';
    const data = {
      lookingFor: i.lookingFor,
      storySeriousness: i.storySeriousness,
      kidsSomeday: i.kidsSomeday,
      meetingMode: i.meetingMode,
      meetGenders: i.meetGenders,
      romanceGenders: friends ? [] : i.romanceGenders,
      // V5.6 (E11) : absents = inchangés ; « en amitié » efface les sous-choix « histoire ».
      ...(friends ? { kidsHorizon: null, storyAgeBrackets: [] } : { ...(i.kidsHorizon !== undefined ? { kidsHorizon: i.kidsHorizon } : {}), ...(i.storyAgeBrackets !== undefined ? { storyAgeBrackets: i.storyAgeBrackets } : {}) }),
    };
    await txOf(scope).matchPreferences.upsert({ where: { userId }, create: { userId, seekingGenders: [], ...data }, update: data });
  }

  async clearSensitive(scope: TxScope, userId: string) {
    await txOf(scope).matchPreferences.updateMany({ where: { userId }, data: { romanceGenders: [], storySeriousness: null, kidsSomeday: null, kidsHorizon: null, storyAgeBrackets: [], lookingFor: 'FRIENDS' } });
  }

  async outingPreferences(userId: string): Promise<OutingPreferencesV5Dto | null> {
    const u = await this.db.user.findUnique({ where: { id: userId }, include: { outingPreferences: true, acceptableNeighborhoods: true, slotAvailability: true, weeksOff: true } });
    if (!u?.outingPreferences) return null;
    const p = u.outingPreferences;
    return {
      groupAge: { min: p.groupAgeMin, max: p.groupAgeMax },
      availableSlotTemplateIds: u.slotAvailability.map((s) => s.slotTemplateId),
      weeksOff: u.weeksOff.map((w) => w.weekKey).sort(),
      activities: p.activities,
      neighborhoodIds: u.acceptableNeighborhoods.map((a) => a.neighborhoodId),
      maxTravelMinutes: p.maxTravelMinutes,
      everyOtherWeekOffFrom: p.alternateWeeksOffFrom ?? null,
      everyOtherWeekendOffFrom: p.alternateWeekendsOffFrom ?? null,
      showCalmBadge: p.showCalmBadge,
      ambiance: p.ambiance,
    };
  }

  async saveOutingPreferences(scope: TxScope, userId: string, p: OutingPreferencesV5Dto) {
    const tx = txOf(scope);
    const data = { groupAgeMin: p.groupAge.min, groupAgeMax: p.groupAge.max, activities: p.activities, maxTravelMinutes: p.maxTravelMinutes, ...(p.everyOtherWeekOffFrom !== undefined ? { alternateWeeksOffFrom: p.everyOtherWeekOffFrom } : {}), ...(p.everyOtherWeekendOffFrom !== undefined ? { alternateWeekendsOffFrom: p.everyOtherWeekendOffFrom } : {}), ...(p.showCalmBadge !== undefined ? { showCalmBadge: p.showCalmBadge } : {}), ...(p.ambiance ? { ambiance: p.ambiance } : {}) };
    await tx.outingPreferences.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    await tx.userAcceptableNeighborhood.deleteMany({ where: { userId } });
    await tx.userAcceptableNeighborhood.createMany({ data: p.neighborhoodIds.map((neighborhoodId) => ({ userId, neighborhoodId })) });
    await tx.userSlotAvailability.deleteMany({ where: { userId } });
    await tx.userSlotAvailability.createMany({ data: p.availableSlotTemplateIds.map((slotTemplateId) => ({ userId, slotTemplateId })) });
    await tx.userWeekOff.deleteMany({ where: { userId } });
    await tx.userWeekOff.createMany({ data: p.weeksOff.map((weekKey) => ({ userId, weekKey })) });
  }

  async homeNeighborhood(userId: string) {
    return (await this.db.user.findUnique({ where: { id: userId }, select: { neighborhoodId: true } }))?.neighborhoodId ?? null;
  }

  async existingNeighborhoods(ids: string[]) {
    return (await this.db.neighborhood.findMany({ where: { id: { in: ids }, status: { not: 'CLOSED' } }, select: { id: true } })).map((n) => n.id);
  }

  async slotTemplatesIn(ids: string[], neighborhoodIds: string[]) {
    if (ids.length === 0) return [];
    return (await this.db.neighborhoodSlotTemplate.findMany({ where: { id: { in: ids }, neighborhoodId: { in: neighborhoodIds }, active: true }, select: { id: true } })).map((t) => t.id);
  }

  async ageOf(userId: string, at: Date) {
    const u = await this.db.user.findUnique({ where: { id: userId }, select: { birthDate: true, timezone: true } });
    if (!u?.birthDate) return null;
    return ageOn({ y: u.birthDate.getUTCFullYear(), m: u.birthDate.getUTCMonth() + 1, d: u.birthDate.getUTCDate() }, localCivilDate(at, u.timezone));
  }
}
