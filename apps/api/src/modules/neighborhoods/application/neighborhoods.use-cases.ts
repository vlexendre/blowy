/** `GET /v1/neighborhoods`, `PUT|GET /v1/me/neighborhood` (spec-v5 §7.1, V5.1 B.5–B.6). */
import type { NeighborhoodListItem, NeighborhoodStatusView } from '@blowy/api-contract';
import { DAY_MS } from '@blowy/domain';
import { requestWindow, weekKeyOf } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock } from '../../../shared/application/clock.js';
import { Errors } from '../../../shared/domain/errors.js';
import { canSetNeighborhood, matchesQuery } from '../domain/neighborhood.js';
import type { NeighborhoodRow, NeighborhoodsRepository } from './ports/neighborhoods.repository.js';

export class NeighborhoodsUseCases {
  constructor(
    private readonly repo: NeighborhoodsRepository,
    private readonly bus: CommandBus,
    private readonly clock: Clock,
    private readonly tuning: Tuning,
  ) {}

  async list(q?: string): Promise<{ items: NeighborhoodListItem[] }> {
    const rows = await this.repo.list();
    return { items: rows.filter((n) => (n.status === 'LIVE' || n.status === 'WAITLIST') && matchesQuery(n, q)).map((n) => ({ id: n.id, slug: n.slug, name: n.name, status: n.status, city: n.city })) };
  }

  async status(userId: string): Promise<NeighborhoodStatusView> {
    const now = this.clock.now();
    const st = await this.repo.userState(null, userId, now);
    if (!st) throw Errors.notFound('Utilisateur');
    const nb = st.neighborhoodId ? await this.repo.byId(null, st.neighborhoodId) : null;
    return {
      neighborhood: nb ? { id: nb.id, name: nb.name, status: nb.status } : null,
      ...(nb && nb.status !== 'LIVE' ? { waitlist: await this.waitlist(nb, now, userId) } : {}),
      isVerified: st.verified,
      hasPhoto: st.hasPhoto,
    };
  }

  private async waitlist(nb: NeighborhoodRow, now: Date, userId: string) {
    const current = weekKeyOf(now.getTime(), nb.timezone);
    const weekKey = now.getTime() < requestWindow(current, nb.timezone, this.tuning).closesAtMs ? current : weekKeyOf(now.getTime() + 7 * DAY_MS, nb.timezone);
    const target = this.tuning.outings.composition.targetSize;
    // Le créneau le plus proche d'une sortie : il manque `target − 1 − autres` personnes (jamais un seuil abstrait).
    const best = (await this.repo.slotDemand(userId, weekKey, now))
      .map((d) => ({ startsAt: d.startsAt, missing: Math.max(0, target - 1 - d.others) }))
      .sort((a, b) => a.missing - b.missing || a.startsAt.getTime() - b.startsAt.getTime())[0];
    return {
      ...(best ? { nextOutingGap: { missing: best.missing, startsAt: best.startsAt.toISOString() } } : {}),
      verifiedCount: await this.repo.verifiedWaiting(nb.id, now),
      ...(nb.estimatedLaunchAt && nb.estimatedLaunchAt > now ? { estimatedLaunchAt: nb.estimatedLaunchAt.toISOString() } : {}),
      seedingAvailable: true,
    };
  }

  async set(userId: string, neighborhoodId: string, commandId: string): Promise<NeighborhoodStatusView> {
    await this.bus.execute({
      actorId: userId,
      operation: 'me.set_neighborhood',
      commandId,
      payload: { neighborhoodId },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const nb = await this.repo.byId(scope, neighborhoodId);
        if (!nb) throw Errors.notFound('Quartier');
        const st = await this.repo.userState(scope, userId, scope.now);
        if (!st) throw Errors.notFound('Utilisateur');
        const v = canSetNeighborhood({ current: st.neighborhoodId, target: nb, changedAt: st.changedAt, hasActiveSeat: st.hasActiveSeat, now: scope.now, cooldownDays: this.tuning.neighborhoods.changeCooldownDays });
        if (!v.ok) throw Errors.precondition(v.reason, v.reason === 'NEIGHBORHOOD_CHANGE_TOO_SOON' ? { availableAt: v.availableAt.toISOString() } : {});
        if (st.neighborhoodId !== nb.id) await this.repo.setUserNeighborhood(scope, userId, nb.id, st.neighborhoodId !== null);
        await this.repo.syncWaitlist(scope, userId, nb);
        await this.repo.ensureAcceptable(scope, userId, nb.id);
        await scope.outbox.emit({ topic: 'user.neighborhood_changed', aggregateType: 'User', aggregateId: userId, payload: { neighborhoodId: nb.id } });
        return { ok: true };
      },
    });
    return this.status(userId);
  }
}
