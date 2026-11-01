/** Propositions de l'utilisateur, avec raison honnête d'une liste vide (P-5.10). */
import type { MatchFeed } from '@blowy/api-contract';
import type { Clock } from '../../../shared/application/clock.js';
import type { EngineGateway } from '../../../shared/application/ports/engine.gateway.js';
import type { PetProfileReader } from '../../../shared/application/ports/pet-profile.reader.js';
import type { MatchingRepository } from './ports/matching.repository.js';

export class GetMatchFeedQuery {
  constructor(
    private readonly repo: MatchingRepository,
    private readonly pets: PetProfileReader,
    private readonly engine: EngineGateway,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string): Promise<MatchFeed> {
    const now = this.clock.now();
    const ctx = await this.repo.feedContext(userId, now);
    const rows = await this.repo.forUser(userId, now);
    const otherIds = rows.map((r) => (r.userLowId === userId ? r.petHighId : r.petLowId));
    const profiles = await this.pets.publicProfiles(otherIds, now);
    const items = rows
      .map((r) => {
        const otherPet = profiles.get(r.userLowId === userId ? r.petHighId : r.petLowId);
        return otherPet ? { id: r.id, kind: r.kind, visionScore: r.visionScore, otherPet, expiresAt: r.expiresAt.toISOString(), acceptedByMe: r.acceptedBy.includes(userId) } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    let emptyReason: MatchFeed['emptyReason'] = null;
    if (items.length === 0) emptyReason = !ctx.hasPet ? 'NO_PRIMARY_PET' : !ctx.verified ? 'NOT_VERIFIED' : ctx.paused ? 'PAUSED' : 'WAITING_NEXT_BATCH';
    const zone = await this.repo.zoneOfUser(userId);
    return { items, emptyReason, nextBatchAt: zone ? this.nextRun(now, zone.timezone).toISOString() : null };
  }

  private nextRun(now: Date, tz: string): Date {
    // Approximation horaire : prochaine heure pleine où l'heure locale = heure du lot.
    const h = this.engine.params.matchingRunHour;
    for (let i = 0; i <= 48; i++) {
      const t = new Date(Math.ceil(now.getTime() / 3_600_000) * 3_600_000 + i * 3_600_000);
      if (Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(t)) === h) return t;
    }
    return new Date(now.getTime() + 86_400_000);
  }
}
