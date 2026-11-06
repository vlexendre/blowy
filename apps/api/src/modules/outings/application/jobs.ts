/**
 * Jobs du module (spec-v5 §7.8) — exécutés par le worker, idempotents par clé métier :
 *  - `outings.compose` : V5.5 (D-053) composition GLISSANTE par (ville, jour de créneau) à J − 3 21 h
 *    (`CompositionRun(scope@jour, weekKey, ROLLING, slotDate)` unique) via `@blowy/matching/groups` ;
 *    seuls les créneaux couverts par l'astreinte (D-058) sont proposés ;
 *  - `outings.seeding` : ville fermée, team de 3 vérifiés + une autre team → sortie d'amorçage ;
 *  - `outings.lifecycle` : invitations expirées, backfill, transitions temporelles ;
 *  - `outings.purge` : bulletins (7 j après clôture), lecture du chat (7 j), corps du chat (90 j).
 */
import { composeOutings, composeSeedingOutings, compositionSeed, type ComposedGroup, type CompositionResult } from '@blowy/matching/groups';
import { composeAtOfDay, localParts, outingInstants, wallToUtc, weekKeyOf } from '@blowy/pet-engine';
import type { SlotOffer } from '@blowy/matching/groups';
import { ONCALL_MARGIN_BEFORE_MS, type OnCallCoverage } from '../../../shared/application/ports/oncall-coverage.port.js';
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
    /** V5.5 (D-058) : astreinte ; absente = tout couvert (tests unitaires). */
    private readonly oncall: OnCallCoverage | null = null,
  ) {}

  /** V5.5 (D-058) : seuls les créneaux dont toute la sortie (check-in → fin) est couverte par l'astreinte. */
  private async covered(slots: SlotOffer[], timezone: string): Promise<SlotOffer[]> {
    if (!this.oncall) return slots;
    const durationMs = this.tuning.outings.durationMinutes * 60_000;
    const out: SlotOffer[] = [];
    for (const s of slots) if (await this.oncall.covered(timezone, new Date(s.startsAtMs - ONCALL_MARGIN_BEFORE_MS), new Date(s.startsAtMs + durationMs))) out.push(s);
    return out;
  }

  /**
   * V5.5 (D-053) : composition GLISSANTE. Pour chaque ville et chaque jour local D dont la composition
   * (J − `composeDaysBefore`, `composeHourLocal` h) est passée et dont la confirmation est encore à venir :
   * un run unique `(ville@D, ROLLING)` compose TOUS les créneaux de ce jour. Une personne disponible mardi et
   * jeudi est d'abord candidate le mardi ; non placée, elle reste candidate le jeudi (elle n'est marquée
   * « non placée » qu'après le dernier de ses jours). Garde : composition < fin d'invitation ≤ confirmation.
   */
  async composeRolling(now: Date) {
    const stats: Record<string, unknown>[] = [];
    const c = this.tuning.outings.cycle;
    for (const scope of await this.repo.liveScopes()) {
      const tz = scope.timezone;
      const today = localParts(now.getTime(), tz).day;
      for (let d = today; d <= today + c.composeDaysBefore; d++) {
        if (now.getTime() < composeAtOfDay(d, tz, this.tuning)) continue;
        const dayStart = wallToUtc(d, 0, tz);
        const dayEnd = wallToUtc(d + 1, 0, tz);
        const slotDate = new Date(d * DAY).toISOString().slice(0, 10);
        const weekKey = weekKeyOf(dayStart + 12 * 3_600_000, tz);
        const scopeKey = `zone:${scope.zoneId}@${slotDate}`;
        if (await this.repo.runExists(scopeKey, weekKey, 'ROLLING')) continue;
        await this.repo.ensureVenueSlots(scope.neighborhoodIds, weekKey, tz);
        const slots = await this.covered((await this.repo.slotOffers(scope.neighborhoodIds, new Date(Math.max(now.getTime(), dayStart)), new Date(dayEnd))).filter((s) => this.lockAfter(s.startsAtMs, now, scope)), tz);
        if (slots.length === 0) continue; // aucun créneau ce jour-là (ou tous déjà confirmés) : rien à composer
        const all = await this.repo.weeklyCandidates(scope, weekKey, now);
        const keep = all.candidates.map((x) => x.slotStartsAtMs.some((t) => t >= dayStart && t < dayEnd));
        const candidates = all.candidates.filter((_, i) => keep[i]);
        const meta = all.meta.filter((_, i) => keep[i]);
        const later = new Set(all.candidates.filter((x) => x.slotStartsAtMs.some((t) => t >= dayEnd)).map((x) => x.profile.userId));
        const facts = await this.repo.compositionFacts(candidates.map((x) => x.profile.userId));
        const seed = compositionSeed(scopeKey, weekKey, this.tuning.version);
        const result = composeOutings({ candidates, facts, slots, seed, tuning: this.tuning });
        stats.push(await this.persist(now, scope, scopeKey, weekKey, 'ROLLING', seed, result, meta, { slotDate, stillCandidate: later }));
      }
    }
    return { runs: stats };
  }

  /** @deprecated V5.5 : remplacé par `composeRolling` (gardé pour les appelants existants). */
  composeWeekly(now: Date) {
    return this.composeRolling(now);
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
      const slots = await this.covered((await this.repo.slotOffers(scope.neighborhoodIds, now, new Date(now.getTime() + 8 * DAY))).filter((s) => this.lockAfter(s.startsAtMs, now, scope)), scope.timezone);
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

  private async persist(now: Date, scope: CompositionScope, scopeKey: string, weekKey: string, kind: 'WEEKLY' | 'SEEDING' | 'ROLLING', seed: string, result: CompositionResult, meta: CandidateMeta[], rolling?: { slotDate: string; stillCandidate: ReadonlySet<string> }) {
    const metaOf = new Map(meta.map((m) => [m.userId, m]));
    return this.uow.run(async (tx) => {
      await tx.lock.users(meta.map((m) => m.userId));
      const runId = this.random.uuid();
      if (!(await this.repo.createRun(tx, { id: runId, scopeKey, weekKey, kind, algoVersion: result.algoVersion, tuningVersion: this.tuning.version, seed, slotDate: rolling?.slotDate ?? null }))) return { scopeKey, skipped: true };
      let created = 0;
      for (const g of result.groups) if (await this.createOuting(tx, runId, g, scope, kind, result.algoVersion, metaOf)) created++;
      const placed = new Set(result.groups.flatMap((g) => g.memberUserIds));
      // Composition glissante : une personne encore disponible un jour suivant de la semaine reste candidate.
      const finalUnplaced = result.unplaced.filter((u) => !rolling?.stillCandidate.has(u.userId));
      for (const u of finalUnplaced) {
        const m = metaOf.get(u.userId);
        if (m?.requestId && !placed.has(u.userId)) await this.repo.setRequestStatus(tx, m.requestId, 'UNPLACED', u.reason);
      }
      // Agrégats seulement (aucun identifiant, aucune préférence).
      const stats = { ...result.stats, outingsCreated: created, unplacedByReason: result.unplaced.reduce<Record<string, number>>((a, u) => ((a[u.reason] = (a[u.reason] ?? 0) + 1), a), {}) };
      await this.repo.finishRun(tx, runId, stats);
      for (const u of finalUnplaced) {
        if (metaOf.get(u.userId)?.requestId) await tx.outbox.emit({ topic: 'outing.unplaced', aggregateType: 'User', aggregateId: u.userId, payload: { weekKey } });
      }
      return { scopeKey, weekKey, kind, ...stats };
    });
  }

  private async createOuting(tx: Parameters<Parameters<UnitOfWork['run']>[0]>[0], runId: string, g: ComposedGroup, scope: CompositionScope, kind: 'WEEKLY' | 'SEEDING' | 'ROLLING', algoVersion: string, metaOf: Map<string, CandidateMeta>) {
    if (!(await this.repo.reserveVenueSlot(tx, g.venueSlotId))) return false;
    const i = outingInstants({ startsAtMs: g.startsAtMs, composedAtMs: tx.now.getTime(), tz: scope.timezone, tuning: this.tuning });
    const id = this.random.uuid();
    const weekKey = weekKeyOf(g.startsAtMs, scope.timezone);
    await this.repo.createOuting(tx, {
      id,
      neighborhoodId: g.neighborhoodId,
      weekKey,
      kind: kind === 'SEEDING' ? 'SEEDING' : 'WEEKLY',
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
