import type { RelationshipView } from '@blowy/api-contract';
import type { Clock } from '../../../shared/application/clock.js';
import type { ProjectionReader } from '../../../shared/application/projection.js';
import { Errors } from '../../../shared/domain/errors.js';
import type { PetProfileReader } from '../../../shared/application/ports/pet-profile.reader.js';
import type { ContextRow, RelationshipRepository } from './ports/relationship.repository.js';
import { toRelationshipView } from './relationship-view.serializer.js';

export class GetRelationshipsQuery {
  constructor(
    private readonly repo: RelationshipRepository,
    private readonly pets: PetProfileReader,
    private readonly projections: ProjectionReader,
    private readonly clock: Clock,
  ) {}

  async list(viewerId: string, includeEnded = false): Promise<RelationshipView[]> {
    const rows = await this.repo.listForUser(viewerId, includeEnded);
    return Promise.all(rows.map((r) => this.view(r, viewerId)));
  }

  async one(viewerId: string, contextId: string): Promise<RelationshipView> {
    const ctx = await this.repo.load(null, contextId);
    // IDOR : un non-participant reçoit « introuvable ».
    if (!ctx || !ctx.sides.some((s) => s.userId === viewerId)) throw Errors.notFound('Relation');
    return this.view(ctx, viewerId);
  }

  async view(ctx: ContextRow, viewerId: string): Promise<RelationshipView> {
    const now = this.clock.now();
    const petIds = ctx.sides.map((s) => s.petId);
    const userIds = ctx.sides.map((s) => s.userId);
    const [profiles, locations, paused, prefs, offers, round, head] = await Promise.all([
      this.pets.publicProfiles(petIds, now),
      this.repo.petLocations(petIds),
      this.repo.isPausedFor(null, ctx.id, userIds, now),
      this.repo.photoPreferences(userIds),
      ctx.status === 'ENDED' ? Promise.resolve([]) : this.repo.openOffers(null, ctx.id, now),
      ctx.status === 'ENDED' ? Promise.resolve(null) : this.repo.openRound(null, ctx.id),
      this.projections.head(viewerId),
    ]);
    const mine = ctx.sides.find((s) => s.userId === viewerId)!;
    const other = ctx.sides.find((s) => s.userId !== viewerId)!;
    return toRelationshipView({
      ctx,
      viewerId,
      myPet: profiles.get(mine.petId)!,
      otherPet: profiles.get(other.petId)!,
      locations,
      pausedBy: paused.byUser,
      photosAllowedByBoth: userIds.every((u) => prefs.get(u) !== 'NEVER'),
      offers,
      round,
      myChoice: round ? await this.repo.myBallot(round.id, viewerId) : null,
      viewVersion: head,
    });
  }
}
