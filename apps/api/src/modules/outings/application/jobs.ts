/**
 * Jobs du module (spec-v5 §7.8) — exécutés par le worker, idempotents par clé métier :
 *  - `outings.compose` : à la fermeture de la fenêtre de demande, compose les groupes d'une ville
 *    (`CompositionRun(scope, weekKey, WEEKLY)` unique) via `@blowy/matching/groups` ;
 *  - `outings.seeding` : ville fermée, team de 3 vérifiés + une autre team → sortie d'amorçage ;
 *  - `outings.lifecycle` : invitations expirées, backfill, transitions temporelles ;
 *  - `outings.purge` : bulletins (7 j après clôture), lecture du chat (7 j), corps du chat (90 j).
 */
import { composeOutings, composeSeedingOutings, compositionSeed, type ComposedGroup, type CompositionResult } from '@blowy/matching/groups';
import { outingInstants, requestWindow, weekKeyOf } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { GroupChatPort } from '../../../shared/application/ports/group-chat.port.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import type { OutingLifecycle } from './lifecycle.service.js';
import type { OutingEvents } from './outing-events.js';
import type { CandidateMeta, CompositionScope, OutingsRepository } from './ports/outings.repository.js';

const DAY = 86_400_000;
const quarter = (d: Date) => `${d.toISOString().slice(0, 14)}${String(Math.floor(d.getUTCMinutes() / 15) * 15).padStart(2, '0')}`;

export class OutingJobs {
  constructor(
    private readonly repo: OutingsRepository,
    private readonly uow: UnitOfWork,
    private readonly lifecycle: OutingLifecycle,
    private readonly chat: GroupChatPort,
    private readonly events: OutingEvents,
    private readonly random: RandomSource,
    private readonly tuning: Tuning,
  ) {}

  /** Composition hebdomadaire de chaque ville LIVE dont la fenêtre de demande est fermée. */
  async composeWeekly(now: Date) {
    const stats: Record<string, unknown>[] = [];
    for (const scope of await this.repo.liveScopes()) {
      const weekKey = weekKeyOf(now.getTime(), scope.timezone);
      const { closesAtMs } = requestWindow(weekKey, scope.timezone, this.tuning);
      const scopeKey = `zone:${scope.zoneId}`;
      if (now.getTime() < closesAtMs || (await this.repo.runExists(scopeKey, weekKey, 'WEEKLY'))) continue;
      await this.repo.ensureVenueSlots(scope.neighborhoodIds, weekKey, scope.timezone);
      const { candidates, meta } = await this.repo.weeklyCandidates(scope, weekKey, now);
      const slots = (await this.repo.slotOffers(scope.neighborhoodIds, now, new Date(now.getTime() + 8 * DAY))).filter((s) => this.lockAfter(s.startsAtMs, now, scope));
      const facts = await this.repo.compositionFacts(candidates.map((c) => c.profile.userId));
      const seed = compositionSeed(scopeKey, weekKey, this.tuning.version);
      const result = composeOutings({ candidates, facts, slots, seed, tuning: this.tuning });
      stats.push(await this.persist(now, scope, scopeKey, weekKey, 'WEEKLY', seed, result, meta));
    }
    return { runs: stats };
  }

  /** Amorçage en ville fermée (V5.1 B.7). */
  async composeSeeding(now: Date) {
    const stats: Record<string, unknown>[] = [];
    for (const scope of await this.repo.seedingScopes()) {
      const weekKey = weekKeyOf(now.getTime(), scope.timezone);
      const scopeKey = `zone:${scope.zoneId}@${quarter(now)}`;
      if (await this.repo.runExists(scopeKey, weekKey, 'SEEDING')) continue;
      await this.repo.ensureVenueSlots(scope.neighborhoodIds, weekKey, scope.timezone);
      await this.repo.ensureVenueSlots(scope.neighborhoodIds, weekKeyOf(now.getTime() + 7 * DAY, scope.timezone), scope.timezone);
      const slots = (await this.repo.slotOffers(scope.neighborhoodIds, now, new Date(now.getTime() + 8 * DAY))).filter((s) => this.lockAfter(s.startsAtMs, now, scope));
      const { candidates, meta } = await this.repo.seedingCandidates(scope, slots, now);
      const teams = new Map<string, number>();
      for (const c of candidates) if (c.teamId) teams.set(c.teamId, (teams.get(c.teamId) ?? 0) + 1);
      if (![...teams.values()].some((n) => n >= this.tuning.outings.seeding.triggerTeamSize)) continue;
      const facts = await this.repo.compositionFacts(candidates.map((c) => c.profile.userId));
      const seed = compositionSeed(scopeKey, weekKey, this.tuning.version);
      const result = composeSeedingOutings({ candidates, facts, slots, seed, tuning: this.tuning });
      if (result.groups.length === 0) continue;
      stats.push(await this.persist(now, scope, scopeKey, weekKey, 'SEEDING', seed, result, meta));
    }
    return { runs: stats };
  }

  private lockAfter(startsAtMs: number, now: Date, scope: CompositionScope) {
    return outingInstants({ startsAtMs, composedAtMs: now.getTime(), tz: scope.timezone, tuning: this.tuning }).lockAtMs > now.getTime();
  }

  private async persist(now: Date, scope: CompositionScope, scopeKey: string, weekKey: string, kind: 'WEEKLY' | 'SEEDING', seed: string, result: CompositionResult, meta: CandidateMeta[]) {
    const metaOf = new Map(meta.map((m) => [m.userId, m]));
    return this.uow.run(async (tx) => {
      await tx.lock.users(meta.map((m) => m.userId));
      const runId = this.random.uuid();
      if (!(await this.repo.createRun(tx, { id: runId, scopeKey, weekKey, kind, algoVersion: result.algoVersion, tuningVersion: this.tuning.version, seed }))) return { scopeKey, skipped: true };
      let created = 0;
      for (const g of result.groups) if (await this.createOuting(tx, runId, g, scope, kind, result.algoVersion, metaOf)) created++;
      const placed = new Set(result.groups.flatMap((g) => g.memberUserIds));
      for (const u of result.unplaced) {
        const m = metaOf.get(u.userId);
        if (m?.requestId && !placed.has(u.userId)) await this.repo.setRequestStatus(tx, m.requestId, 'UNPLACED', u.reason);
      }
      // Agrégats seulement (aucun identifiant, aucune préférence).
      const stats = { ...result.stats, outingsCreated: created, unplacedByReason: result.unplaced.reduce<Record<string, number>>((a, u) => ((a[u.reason] = (a[u.reason] ?? 0) + 1), a), {}) };
      await this.repo.finishRun(tx, runId, stats);
      for (const u of result.unplaced) {
        if (metaOf.get(u.userId)?.requestId) await tx.outbox.emit({ topic: 'outing.unplaced', aggregateType: 'User', aggregateId: u.userId, payload: { weekKey } });
      }
      return { scopeKey, weekKey, kind, ...stats };
    });
  }

  private async createOuting(tx: Parameters<Parameters<UnitOfWork['run']>[0]>[0], runId: string, g: ComposedGroup, scope: CompositionScope, kind: 'WEEKLY' | 'SEEDING', algoVersion: string, metaOf: Map<string, CandidateMeta>) {
    if (!(await this.repo.reserveVenueSlot(tx, g.venueSlotId))) return false;
    const i = outingInstants({ startsAtMs: g.startsAtMs, composedAtMs: tx.now.getTime(), tz: scope.timezone, tuning: this.tuning });
    const id = this.random.uuid();
    const weekKey = weekKeyOf(g.startsAtMs, scope.timezone);
    await this.repo.createOuting(tx, {
      id,
      neighborhoodId: g.neighborhoodId,
      weekKey,
      kind,
      venueSlotId: g.venueSlotId,
      venueId: g.venueId,
      activity: g.activity,
      startsAt: new Date(i.startsAtMs),
      endsAt: new Date(i.endsAtMs),
      capacity: Math.min(this.tuning.outings.maxSize, Math.max(this.tuning.outings.minSizeToForm, g.memberUserIds.length)),
      composedAt: tx.now,
      acceptDeadline: new Date(i.acceptDeadlineMs),
      lockAt: new Date(i.lockAtMs),
      photoRevealAt: new Date(i.photoRevealAtMs),
      checkinOpensAt: new Date(i.checkinOpensAtMs),
      checkinClosesAt: new Date(i.checkinClosesAtMs),
      votesCloseAt: new Date(i.votesCloseAtMs),
      compositionRunId: runId,
      tuningVersion: this.tuning.version,
      algoVersion,
    });
    for (const userId of g.memberUserIds) {
      const m = metaOf.get(userId);
      if (!(await this.repo.createSeat(tx, { id: this.random.uuid(), outingId: id, userId, weekKey, teamId: m?.teamId ?? null, acceptDeadline: new Date(i.acceptDeadlineMs) }))) continue;
      if (m?.requestId) await this.repo.setRequestStatus(tx, m.requestId, 'PLACED', null);
      await this.events.invited(tx, id, userId, new Date(i.acceptDeadlineMs));
      await tx.outbox.emit({ topic: 'outing.invited', aggregateType: 'Outing', aggregateId: id, payload: { outingId: id, userId } });
    }
    return true;
  }

  /** Invitations échues, backfill, puis transitions temporelles dues. */
  async lifecycleSweep(now: Date) {
    let expired = 0;
    for (const e of await this.repo.expiredInvitations(now, 200)) if (await this.lifecycle.expireInvitation(e.outingId, e.seatId, e.userId)) expired++;
    let backfilled = 0;
    for (const id of await this.repo.outingsWithFreePlaces(now, 100)) if (await this.lifecycle.backfill(id, now)) backfilled++;
    const transitions: Record<string, number> = {};
    // Plusieurs passes : une sortie peut enchaîner (ex. verrouillage puis ouverture du check-in) si le job a pris du retard.
    for (let pass = 0; pass < 4; pass++) {
      const due = await this.repo.dueOutings(now, 200);
      if (due.length === 0) break;
      let moved = 0;
      for (const id of due) {
        const r = await this.lifecycle.advance(id);
        if (r) {
          transitions[r] = (transitions[r] ?? 0) + 1;
          moved++;
        }
      }
      if (moved === 0) break;
    }
    return { expired, backfilled, transitions };
  }

  /** Rétention (spec-v5 §8.5). */
  async purge(now: Date) {
    let ballots = 0;
    for (const id of await this.repo.outingsToPurge(now, this.tuning.votes.ballotRetentionDays, 200)) {
      ballots += await this.uow.run(async (tx) => {
        const n = await this.repo.purgeBallots(tx, id);
        await this.repo.setOutingStatus(tx, id, 'DONE', { ballotsPurgedAt: tx.now });
        return n;
      });
    }
    let revoked = 0;
    for (const c of await this.repo.chatsToRevoke(now, this.tuning.outings.chat.readOnlyDaysAfterClose, 200)) {
      await this.uow.run(async (tx) => {
        const conv = await this.chat.conversationOfOuting(tx, c.outingId);
        if (!conv) return;
        for (const u of c.members) {
          await this.chat.revokeMember(tx, conv, u);
          await this.events.revoke(tx, u, c.outingId, conv);
          revoked++;
        }
      });
    }
    let purgedBodies = 0;
    for (const outingId of await this.repo.chatsToPurge(now, this.tuning.outings.chat.purgeDaysAfterClose, 100)) {
      purgedBodies += await this.uow.run(async (tx) => {
        const conv = await this.chat.conversationOfOuting(tx, outingId);
        return conv ? this.chat.purgeBodies(tx, conv) : 0;
      });
    }
    return { ballots, revoked, purgedBodies };
  }
}
