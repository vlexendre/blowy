/**
 * Lot de matching (job 21 h locale par zone, ou lot d'onboarding). Collecte du vivier côté
 * backend, filtres réciproques, score de vision par @blowy/matching (EngineGateway), sélection
 * « deux forts + une découverte » quand le vivier suffit, quota incluant entrantes/sortantes.
 * N'invente jamais d'utilisateur ; zone vide = lot vide avec statistiques.
 * Unicité (zone, date locale, kind) : un lot rejoué ne crée rien de plus.
 */
import type { RandomSource } from '../../../shared/application/clock.js';
import type { EngineGateway } from '../../../shared/application/ports/engine.gateway.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { cellDistanceKm, exclusionReason, type ExclusionReason } from '../domain/eligibility.js';
import type { MatchingRepository, PoolMember } from './ports/matching.repository.js';

const HOUR = 3_600_000;
const pairKey = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);

export interface BatchStats {
  pool: number;
  proposals: number;
  exclusions: Partial<Record<ExclusionReason, number>>;
  replayed: boolean;
}

export class RunMatchingBatchUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly repo: MatchingRepository,
    private readonly engine: EngineGateway,
    private readonly random: RandomSource,
  ) {}

  localDate(at: Date, tz: string): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
  }

  localHour(at: Date, tz: string): number {
    return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(at));
  }

  /** Job planifié : lance les zones dont l'heure locale ≥ heure du lot (une fois par jour). */
  async runDueZones(now: Date): Promise<Record<string, BatchStats>> {
    const out: Record<string, BatchStats> = {};
    for (const z of await this.repo.zones()) {
      if (this.localHour(now, z.timezone) >= this.engine.params.matchingRunHour) out[z.code] = await this.run(z.id, z.timezone, now, 'DAILY');
    }
    return out;
  }

  async run(zoneId: string, timezone: string, now: Date, kind: 'DAILY' | `ONBOARDING:${string}`, onlyUserId?: string): Promise<BatchStats> {
    const p = this.engine.params;
    const pool = await this.repo.pool(zoneId, now);
    const userIds = pool.map((m) => m.userId);
    const [blocked, met, counts, open] = await Promise.all([
      this.repo.blockedPairs(userIds),
      this.repo.metPairs(pool.map((m) => m.petId)),
      this.repo.openProposalCounts(userIds, now),
      this.repo.openPairs(now),
    ]);
    const stats: BatchStats = { pool: pool.length, proposals: 0, exclusions: {}, replayed: false };
    const scored: { a: PoolMember; b: PoolMember; score: number; breakdown: Record<string, number> }[] = [];
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const a = pool[i]!;
        const b = pool[j]!;
        if (onlyUserId && a.userId !== onlyUserId && b.userId !== onlyUserId) continue;
        const reason = open.has(pairKey(a.petId, b.petId))
          ? 'HISTORY'
          : exclusionReason(a, b, { blocked: blocked.has(pairKey(a.userId, b.userId)), metBefore: met.has(pairKey(a.petId, b.petId)) }, now, p.inactiveAfterDays);
        if (reason) {
          stats.exclusions[reason] = (stats.exclusions[reason] ?? 0) + 1;
          continue;
        }
        const distance = a.cell && b.cell ? cellDistanceKm(a.cell, b.cell) : null;
        const maxMutual = Math.min(a.prefs.maxDistanceKm, b.prefs.maxDistanceKm);
        const s = this.engine.visionScore(
          { petId: a.petId, species: a.species, vision: a.vision, distanceKm: distance, maxMutualDistanceKm: maxMutual, rhythm: null, reputation: null },
          { petId: b.petId, species: b.species, vision: b.vision, distanceKm: distance, maxMutualDistanceKm: maxMutual, rhythm: null, reputation: null },
        );
        scored.push({ a, b, score: s.score, breakdown: s.breakdown });
      }
    }
    // Sélection gloutonne par score décroissant ; quota par personne (entrantes + sortantes).
    scored.sort((x, y) => y.score - x.score || (pairKey(x.a.petId, x.b.petId) < pairKey(y.a.petId, y.b.petId) ? -1 : 1));
    const taken = new Map<string, number>();
    const quota = (u: string) => p.batchSize - (taken.get(u) ?? 0) - Math.min(counts.get(u) ?? 0, p.batchSize);
    const chosen: typeof scored = [];
    for (const c of scored) {
      if (quota(c.a.userId) <= 0 || quota(c.b.userId) <= 0) continue;
      chosen.push(c);
      taken.set(c.a.userId, (taken.get(c.a.userId) ?? 0) + 1);
      taken.set(c.b.userId, (taken.get(c.b.userId) ?? 0) + 1);
    }
    const batchKind = kind;
    return this.uow.run(async (scope) => {
      const batchId = this.random.uuid();
      const fresh = await this.repo.startBatch(scope, { id: batchId, zoneId, localDate: this.localDate(now, timezone), kind: batchKind, algoVersion: this.engine.engineVersion, tuningVersion: this.engine.tuningVersion });
      if (!fresh) return { ...stats, proposals: 0, replayed: true };
      const expiresAt = new Date(now.getTime() + p.proposalTtlHours * HOUR);
      for (const c of chosen) {
        const [lo, hi] = c.a.petId < c.b.petId ? [c.a, c.b] : [c.b, c.a];
        const id = this.random.uuid();
        await this.repo.createProposal(scope, {
          id,
          batchId,
          petLowId: lo.petId,
          petHighId: hi.petId,
          userLowId: lo.userId,
          userHighId: hi.userId,
          kind: kind === 'DAILY' ? 'STRONG' : 'ONBOARDING',
          visionScore: Math.round(c.score),
          rankScore: c.score,
          breakdown: c.breakdown,
          expiresAt,
        });
        await scope.outbox.emit({ topic: 'match.proposed', aggregateType: 'MatchProposal', aggregateId: id, payload: { userIds: [lo.userId, hi.userId] } });
      }
      stats.proposals = chosen.length;
      await this.repo.finishBatch(scope, batchId, { ...stats });
      return stats;
    });
  }
}
