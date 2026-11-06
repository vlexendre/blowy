/**
 * Cycle de vie des duos (job `duos.lifecycle`, spec-v5 §2.12, §7.8) et lot quotidien de la voie Duo
 * (`duos.lane`, 21 h locale) — transitions temporelles revalidées sous verrous, idempotentes par l'état :
 *  - EXCHANGE à `exchangeEndsAt` : visages débloqués si les deux ont écrit, sinon fin neutre (V5.1 F.18) ;
 *  - voie Duo sans RDV confirmé à `dateDeadline` : fin neutre ;
 *  - RDV proposé resté sans réponse à l'heure dite : retiré ;
 *  - RDV confirmé à la fermeture du check-in : présences / absences, souvenir, votes ouverts 72 h ;
 *  - votes clos : `min` des bulletins (PLUS sans compatibilité réciproque → ami), TOGETHER / bande / fin ;
 *  - purge des bulletins 7 j après, accès retiré 7 j après une expiration ;
 *  - blocage (`trust.blocked`) : duo CLOSED silencieux, lien de bande retiré, accès révoqué.
 */
import { pairKey, seeksOf, type ConnectionKind } from '@blowy/domain';
import { romanceCompatible } from '@blowy/matching/groups';
import type { OutboxConsumer, OutboxEnvelope } from '../../../shared/application/outbox-consumer.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { canMoveDuo, checkinWindow, EXPIRED_READ_ONLY_MS, exchangeOutcome, localDateHour, resolveDuoVote, restingStatus, duoDateLockAt } from '../domain/duo-policy.js';
import { selectLanePairs, type LaneCandidate } from '../domain/lane.js';
import type { ConnectionsDeps } from './deps.js';
import type { DuoUseCases } from './duos.use-cases.js';
import type { DuoRow, SeeksFacts } from './ports/connections.repository.js';

const DAY = 86_400_000;
const LANE_ALGO = 'duo-lane-2026.12.0';

export const seeksProfileOf = (s: SeeksFacts) => ({ gender: s.gender, seeks: seeksOf(s.lookingFor), meetGenders: s.meetGenders, romanceGenders: s.romanceGenders, age: s.age, groupAge: s.groupAge });

export class DuoLifecycle {
  constructor(
    private readonly x: ConnectionsDeps,
    private readonly duos: DuoUseCases,
  ) {}

  private get repo() {
    return this.x.repo;
  }

  async sweep(now: Date): Promise<number> {
    let n = 0;
    for (const id of await this.repo.dueDuos(now, 200)) {
      // Plusieurs transitions peuvent être dues (ex. RDV clos puis votes clos) : une par passe.
      for (let i = 0; i < 4; i++) {
        const r = await this.advance(id);
        if (!r) break;
        n++;
      }
    }
    for (const e of await this.repo.expiredToRevoke(new Date(now.getTime() - EXPIRED_READ_ONLY_MS), 200)) {
      await this.x.uow.run(async (scope) => {
        await scope.lock.users(e.users);
        await this.x.ending.revokeAccess(scope, e.duoId, e.conversationId, e.users);
      });
    }
    for (const dateId of await this.repo.datesToPurge(new Date(now.getTime() - this.x.tuning.votes.ballotRetentionDays * DAY), 200)) {
      await this.x.uow.run((scope) => this.repo.purgeBallots(scope, dateId));
    }
    return n;
  }

  async advance(duoId: string): Promise<string | null> {
    return this.x.uow.run(async (scope) => {
      const pre = await this.repo.duo(scope, duoId);
      if (!pre) return null;
      const users = [pre.userLowId, pre.userHighId];
      await scope.lock.users(users);
      await scope.lock.pets([...(await this.x.memories.primaryPetIds(scope, users)).values()]);
      await scope.lock.duos([duoId]);
      const d = (await this.repo.duo(scope, duoId))!;
      const now = scope.now;
      if (d.status === 'EXCHANGE' && d.exchangeEndsAt && now >= d.exchangeEndsAt) return this.endExchange(scope, d);
      const date = await this.repo.currentDate(scope, duoId);
      if (date?.status === 'PROPOSED' && now >= date.startsAt) {
        await this.repo.updateDate(scope, date.id, { status: 'DECLINED' });
        const back = restingStatus(d.together);
        await this.repo.updateDuo(scope, duoId, { status: back });
        await this.x.events.duoUpdated(scope, duoId, users, back, 'DATE');
        return 'DATE_LAPSED';
      }
      if (date?.status === 'CONFIRMED' && now >= checkinWindow(date.startsAt, this.x.tuning).closesAt) return this.closeDate(scope, d, date.id);
      // V5.6 (E13) : à la veille 18 h, la table de 2 entre dans l'effectif du lieu (prénoms + code).
      if (date?.status === 'CONFIRMED' && !date.reservationLockedAt) {
        const venue = await this.repo.venue(date.venueId);
        if (venue && now >= duoDateLockAt(date.startsAt, venue.timezone, this.x.tuning)) {
          await this.repo.updateDate(scope, date.id, { reservationLockedAt: now });
          return 'DATE_RESERVED';
        }
      }
      if (date?.status === 'DONE' && date.votesCloseAt && !date.votesClosedAt && now >= date.votesCloseAt) return this.closeVotes(scope, d, date.id);
      if (d.origin === 'LANE' && d.dateDeadline && now >= d.dateDeadline && (d.status === 'UNLOCKED' || d.status === 'DATE_PROPOSED') && d.datesAttended === 0 && !d.together) {
        await this.x.ending.end(scope, d, 'EXPIRED', 'system.duo.exchange_expired', null);
        return 'EXPIRED';
      }
      return null;
    });
  }

  /** V5.1 F.18 : à 48 h, visages (et vocal) débloqués pour les deux en même temps si chacun a écrit. */
  private async endExchange(scope: TxScope, d: DuoRow) {
    const conv = d.conversationId ?? (await this.repo.conversationOfDuo(scope, d.id));
    const counts = conv ? await this.repo.humanMessageCounts(scope, conv, d.exchangeEndsAt) : new Map<string, number>();
    const next = { ...d, messagesLow: counts.get(d.userLowId) ?? 0, messagesHigh: counts.get(d.userHighId) ?? 0 };
    await this.repo.updateDuo(scope, d.id, { messagesLow: next.messagesLow, messagesHigh: next.messagesHigh });
    const outcome = exchangeOutcome(next, scope.now, this.x.tuning);
    if (outcome === 'UNLOCKED') {
      await this.repo.updateDuo(scope, d.id, { status: 'UNLOCKED' });
      await this.x.events.duoUpdated(scope, d.id, [d.userLowId, d.userHighId], 'UNLOCKED', 'UNLOCKED');
      await scope.outbox.emit({ topic: 'duo.unlocked', aggregateType: 'Duo', aggregateId: d.id, payload: { duoId: d.id, userIds: [d.userLowId, d.userHighId] } });
      return 'UNLOCKED';
    }
    // Même message des deux côtés, quel que soit celui qui n'a pas écrit.
    await this.x.ending.end(scope, d, 'EXPIRED', 'system.duo.exchange_expired', null);
    return 'EXPIRED';
  }

  /** Fermeture du check-in d'un RDV : les deux présents → votes ; sinon absence(s) et retour au repos. */
  private async closeDate(scope: TxScope, d: DuoRow, dateId: string) {
    const date = (await this.repo.date(scope, dateId))!;
    const users = [d.userLowId, d.userHighId];
    const present = { [d.userLowId]: !!date.checkinLowAt, [d.userHighId]: !!date.checkinHighAt };
    const both = present[d.userLowId] && present[d.userHighId];
    for (const u of users) {
      await this.x.reliability.recordDuoDate(scope, { userId: u, outcome: present[u] ? 'ATTENDED' : 'NO_SHOW', key: `duo-date:${dateId}` });
      await scope.outbox.emit({ topic: 'duo.date_attendance_recorded', aggregateType: 'DuoDate', aggregateId: dateId, payload: { duoDateId: dateId, userId: u, attended: !!present[u] } });
    }
    if (!both) {
      await this.repo.updateDate(scope, dateId, { status: 'DONE' });
      const back = restingStatus(d.together);
      await this.repo.updateDuo(scope, d.id, { status: back });
      await this.x.events.duoUpdated(scope, d.id, users, back, 'DATE');
      await scope.outbox.emit({ topic: 'duo.date_done', aggregateType: 'DuoDate', aggregateId: dateId, payload: { duoDateId: dateId, bothPresent: false } });
      return 'DATE_DONE_ALONE';
    }
    const votesCloseAt = new Date(scope.now.getTime() + this.x.tuning.duo.afterVoteHours * 3_600_000);
    await this.repo.updateDate(scope, dateId, { status: 'DONE', votesCloseAt });
    await this.repo.updateDuo(scope, d.id, { status: 'AFTER_VOTE', datesAttended: d.datesAttended + 1 });
    const venue = await this.repo.venue(date.venueId);
    for (const u of users) {
      const m = await this.x.memories.record(scope, { userId: u, kind: 'DUO_DATE_LIVED', refType: 'DuoDate', refId: dateId, attended: true, data: { venueName: venue?.name ?? '' } });
      if (m?.added) await this.x.events.petUpdated(scope, u, { petId: m.petId, stage: m.stage, memoryKind: 'DUO_DATE_LIVED', ...(m.accessoriesUnlocked[0] ? { accessoryUnlocked: m.accessoriesUnlocked[0] } : {}) });
    }
    await this.x.events.duoUpdated(scope, d.id, users, 'AFTER_VOTE', 'VOTE');
    await scope.outbox.emit({ topic: 'duo.date_done', aggregateType: 'DuoDate', aggregateId: dateId, payload: { duoDateId: dateId, bothPresent: true, votesCloseAt: votesCloseAt.toISOString() } });
    return 'AFTER_VOTE';
  }

  /** Dépouillement unique à `votesCloseAt` (jamais à l'instant d'un bulletin). */
  private async closeVotes(scope: TxScope, d: DuoRow, dateId: string) {
    const users: [string, string] = [d.userLowId, d.userHighId];
    const ballots = await this.repo.ballots(scope, dateId);
    const seeks = await this.repo.seeks(users, scope.now);
    const a = seeks.get(d.userLowId);
    const b = seeks.get(d.userHighId);
    const romanceOk = !!a && !!b && romanceCompatible(seeksProfileOf(a), seeksProfileOf(b));
    const r = resolveDuoVote(ballots.get(d.userLowId), ballots.get(d.userHighId), romanceOk);
    await this.repo.updateDate(scope, dateId, { votesClosedAt: scope.now });
    const persons = await this.repo.persons(users, scope.now);
    if (r === 'PLUS') {
      if (!canMoveDuo(d.status, 'TOGETHER')) return null;
      await this.repo.updateDuo(scope, d.id, { status: 'TOGETHER', together: true });
      await this.reveal(scope, d, dateId, 'PLUS', null, persons);
      await this.x.events.duoUpdated(scope, d.id, users, 'TOGETHER', 'STATUS');
      return 'TOGETHER';
    }
    if (r === 'FRIEND') {
      const link = await this.repo.ensureBandLink(scope, { id: this.x.random.uuid(), low: d.userLowId, high: d.userHighId, duoId: d.id, invitedById: d.userLowId });
      if (link.created) {
        await this.x.chat.openLinkChat(scope, { conversationId: this.x.random.uuid(), kind: 'BAND', friendshipId: link.id, memberIds: users });
        for (const [me, other] of [users, [users[1], users[0]]] as const) {
          const p = persons.get(other);
          const m = await this.x.memories.record(scope, { userId: me, kind: 'BAND_NEW_MEMBER', refType: 'Friendship', refId: link.id, data: { petName: p?.pet.name ?? '', species: p?.pet.species ?? '' } });
          if (m?.added) await this.x.events.petUpdated(scope, me, { petId: m.petId, stage: m.stage, memoryKind: 'BAND_NEW_MEMBER', ...(m.accessoriesUnlocked[0] ? { accessoryUnlocked: m.accessoriesUnlocked[0] } : {}) });
        }
        await this.x.events.bandUpdated(scope, link.id, users, 'ACTIVE');
      }
      await this.reveal(scope, d, dateId, 'FRIEND', link.id, persons);
      await this.x.ending.end(scope, d, 'CLOSED', null, null);
      await scope.outbox.emit({ topic: 'band.linked', aggregateType: 'Friendship', aggregateId: link.id, payload: { linkId: link.id, userIds: users, origin: 'DUO_VOTE' } });
      return 'BAND';
    }
    // Non mutuel : même message neutre des deux côtés, aucun motif, aucun « non » visible.
    await this.x.ending.end(scope, d, 'CLOSED', 'system.duo.ended', null);
    return 'CLOSED';
  }

  private async reveal(scope: TxScope, d: DuoRow, dateId: string, kind: ConnectionKind, linkId: string | null, persons: Map<string, { firstName: string; pet: unknown }>) {
    if (!(await this.repo.createReveal(scope, { id: this.x.random.uuid(), dateId, low: d.userLowId, high: d.userHighId, kind, friendshipId: linkId, duoId: kind === 'PLUS' ? d.id : null }))) return;
    for (const [me, other] of [
      [d.userLowId, d.userHighId],
      [d.userHighId, d.userLowId],
    ] as const) {
      const p = persons.get(other);
      await this.x.events.connectionRevealed(scope, linkId ?? d.id, me, { kind, other: { userId: other, firstName: p?.firstName ?? '', pet: p?.pet }, ...(linkId ? { linkId } : { duoId: d.id }), source: 'DUO' });
    }
    await scope.outbox.emit({ topic: 'connection.revealed', aggregateType: 'DuoDate', aggregateId: dateId, payload: { kind, users: [d.userLowId, d.userHighId], source: 'DUO', ...(linkId ? { friendshipId: linkId } : { duoId: d.id }) } });
  }

  // ------------------------------------------------------------------ blocage
  /** `trust.blocked` : duo CLOSED silencieux + révocation ; lien de bande retiré sans message. */
  async onBlocked(scope: TxScope, a: string, b: string) {
    await scope.lock.users([a, b]);
    const links = await this.repo.activeBandLinksBetween(scope, a, b);
    if (links.length) await scope.lock.friendships(links.map((l) => l.id));
    const duos = await this.repo.liveDuosBetween(scope, a, b);
    if (duos.length) await scope.lock.duos(duos.map((x) => x.id));
    for (const l of links) await this.x.ending.withdrawBand(scope, l, 'BLOCKED');
    for (const d of duos) await this.x.ending.end(scope, d, 'CLOSED', null, null);
  }

  // ------------------------------------------------------------------ lot quotidien voie Duo
  async runLane(now: Date): Promise<number> {
    let created = 0;
    for (const z of await this.repo.laneZones()) {
      const { date, hour } = localDateHour(now, z.timezone);
      if (hour !== this.x.tuning.duo.dailyRunHour) continue;
      created += await this.laneBatch(z.zoneId, date, now);
    }
    return created;
  }

  /** Un lot par zone et par jour local (MatchBatch unique) ; capacités recalculées sous verrou à l'acceptation. */
  async laneBatch(zoneId: string, localDate: string, now: Date): Promise<number> {
    const raw = await this.repo.laneCandidates(zoneId, now);
    const t = this.x.tuning;
    const cands: LaneCandidate[] = [];
    for (const c of raw) {
      const [photo, paused, open, activeDuos, capacityOf] = await Promise.all([this.x.photos.currentProfilePhotoId(c.userId), this.x.reliability.isPaused(null, c.userId, now), this.repo.openLaneProposalCount(null, c.userId, now), this.repo.activeDuoCount(null, c.userId), this.duos.capacity(c.userId, now)]);
      const laneDuos = await this.repo.activeLaneDuoCount(null, c.userId);
      const capacity = !photo || paused || activeDuos >= capacityOf ? 0 : Math.max(0, t.duo.maxOpenProposals - open - laneDuos);
      cands.push({ ...c, capacity });
    }
    const ids = cands.map((c) => c.userId);
    const excluded = ids.length ? await this.repo.laneExcludedPairs(ids, new Date(now.getTime() - t.duo.declinedCooldownDays * DAY)) : new Set<string>();
    const pairs = selectLanePairs(cands, excluded, `${zoneId}|${localDate}`, t);
    return this.x.uow.run(async (scope) => {
      const batchId = this.x.random.uuid();
      if (!(await this.repo.startLaneBatch(scope, { id: batchId, zoneId, localDate, algoVersion: LANE_ALGO, tuningVersion: t.version }))) return 0;
      let n = 0;
      const expiresAt = new Date(scope.now.getTime() + t.duo.proposalTtlHours * 3_600_000);
      for (const p of pairs) {
        const id = this.x.random.uuid();
        if (await this.repo.createLaneProposal(scope, { id, batchId, userA: p.a.userId, petA: p.a.petId, userB: p.b.userId, petB: p.b.petId, visionScore: p.score, expiresAt })) {
          n++;
          await scope.outbox.emit({ topic: 'duo.proposed', aggregateType: 'MatchProposal', aggregateId: id, payload: { proposalId: id, userIds: [p.a.userId, p.b.userId].sort(), pair: pairKey(p.a.userId, p.b.userId) } });
        }
      }
      await this.repo.finishLaneBatch(scope, batchId, { candidates: cands.length, proposals: n });
      return n;
    });
  }
}

/** Consommateur outbox `trust.blocked` (dédupliqué par ConsumerDeduplication). */
export class ConnectionsBlockConsumer implements OutboxConsumer {
  readonly name = 'connections.block';
  readonly topics = ['trust.blocked'] as const;
  constructor(private readonly lifecycle: DuoLifecycle) {}
  async handle(scope: TxScope, e: OutboxEnvelope) {
    const a = e.payload.blockerId as string | undefined;
    const b = e.payload.blockedId as string | undefined;
    if (a && b) await this.lifecycle.onBlocked(scope, a, b);
  }
}
