/**
 * Observateur outbox unique du module `notifications` : chaque événement V5 devient zéro, une ou
 * plusieurs intentions de notification (dans la transaction du relais, dédupliquée par
 * ConsumerDeduplication + clé unique en base). Aucun texte n'est écrit ici.
 *
 * Correspondance (spec-v5 §9.1) :
 *  outing.invited → `outing.invited` | `outing.seeding_invited` (≤ 1/semaine) + `outing.invite_reminder` (deadline − 4 h)
 *  outing.unplaced → `outing.unplaced` · outing.formed → `outing.formed`
 *  outing.locked (J-1 18 h) → `outing.confirmed` (lieu + groupe) + `outing.faces` (J − 3 h)
 *  outing.checkin_opened → `outing.checkin_open` · outing.done → `votes.opened` + `votes.reminder` (clôture − 12 h)
 *  outing.votes_closed → un seul message : son accord (`connection.friend|plus`) ou `votes.closed`
 *  outing.cancelled / outing.composition_changed (retrait système, « compensation ») → transactionnels
 *  economy.refund_settled → `outing.refund_done` (sauf si l'annulation l'a déjà dit)
 *  outing.attendance_recorded / duo.date_attendance_recorded (absence) → `reliability.paused` si pause
 *  safety.alert_raised → `safety.alert_sent` (la page ange est prévenue par `safety`, Web Push T4)
 *  duo.matched / duo.unlocked / duo.date_* / duo.ended / connection.revealed (DUO) → `duo.*`, `connection.*`
 *  team.member_joined → `team.member_joined` · message.submitted → `message.human` (regroupé)
 *  privacy.deletion_requested → file vidée, jetons oubliés
 * Non notifiés (choix) : `duo.proposed` (propositions duo sans push, §9.1), la compensation versée au
 * lieu (aucun message culpabilisant à la personne absente : `reliability.paused` suffit),
 * `duo.date_cancelled` (pas de clé au catalogue ; l'app l'affiche).
 */
import type { OutboxConsumer, OutboxEnvelope } from '../../../shared/application/outbox-consumer.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import type { NotificationPlanner, Plan } from './planner.js';
import type { NotificationFactsReader, NotificationRepository } from './ports.js';

const HOUR = 3_600_000;
const MIN = 60_000;
const str = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : null);
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const plus = (d: Date, ms: number) => new Date(d.getTime() + ms);

/** Fenêtre de regroupement des messages d'une même conversation. */
export const MESSAGE_GROUP_WINDOW_MS = 10 * MIN;

export const NOTIFICATION_TOPICS = [
  'outing.invited',
  'outing.unplaced',
  'outing.formed',
  'outing.locked',
  'outing.checkin_opened',
  'outing.done',
  'outing.votes_closed',
  'outing.cancelled',
  'outing.composition_changed',
  'outing.attendance_recorded',
  'economy.refund_settled',
  'safety.alert_raised',
  'connection.revealed',
  'team.member_joined',
  'duo.matched',
  'duo.unlocked',
  'duo.date_proposed',
  'duo.date_confirmed',
  'duo.date_done',
  'duo.date_attendance_recorded',
  'duo.ended',
  'message.submitted',
  'privacy.deletion_requested',
] as const;

export class NotificationsConsumer implements OutboxConsumer {
  readonly name = 'notifications.plan';
  readonly topics = NOTIFICATION_TOPICS;

  constructor(
    private readonly planner: NotificationPlanner,
    private readonly facts: NotificationFactsReader,
    private readonly repo: NotificationRepository,
  ) {}

  async handle(scope: TxScope, e: OutboxEnvelope): Promise<void> {
    const p = e.payload;
    const now = scope.now;
    const q = (plans: Plan[]) => this.planner.enqueue(scope, plans);
    switch (e.topic) {
      case 'outing.invited':
        return this.invited(scope, str(p.outingId) ?? e.aggregateId, str(p.userId));
      case 'outing.unplaced': {
        const userId = e.aggregateId;
        const wk = str(p.weekKey) ?? 'week';
        await q([{ userId, key: 'outing.unplaced', subject: wk, at: now, expiresAt: plus(now, 24 * HOUR), refs: { weekKey: wk } }]);
        return;
      }
      case 'outing.formed': {
        const o = await this.facts.outing(str(p.outingId) ?? e.aggregateId);
        if (!o) return;
        await q(o.seats.filter((s) => s.status === 'CONFIRMED').map((s) => ({ userId: s.userId, key: 'outing.formed' as const, subject: o.id, at: now, expiresAt: o.lockAt, refs: { outingId: o.id } })));
        return;
      }
      case 'outing.locked': {
        const o = await this.facts.outing(str(p.outingId) ?? e.aggregateId);
        if (!o) return;
        const confirmed = o.seats.filter((s) => s.status === 'CONFIRMED');
        await q([
          ...confirmed.map((s) => ({ userId: s.userId, key: 'outing.confirmed' as const, subject: o.id, at: now, expiresAt: o.startsAt, refs: { outingId: o.id } })),
          ...confirmed.map((s) => ({ userId: s.userId, key: 'outing.faces' as const, subject: o.id, at: o.photoRevealAt, expiresAt: o.startsAt, refs: { outingId: o.id } })),
        ]);
        return;
      }
      case 'outing.checkin_opened': {
        const o = await this.facts.outing(str(p.outingId) ?? e.aggregateId);
        if (!o) return;
        await q(o.seats.filter((s) => s.status === 'CONFIRMED').map((s) => ({ userId: s.userId, key: 'outing.checkin_open' as const, subject: o.id, at: now, expiresAt: o.checkinClosesAt, refs: { outingId: o.id } })));
        return;
      }
      case 'outing.done': {
        const o = await this.facts.outing(str(p.outingId) ?? e.aggregateId);
        if (!o || o.votesClosedAt) return;
        const attendees = o.seats.filter((s) => s.status === 'ATTENDED');
        await q([
          ...attendees.map((s) => ({ userId: s.userId, key: 'votes.opened' as const, subject: o.id, at: now, expiresAt: o.votesCloseAt, refs: { outingId: o.id } })),
          ...attendees.map((s) => ({ userId: s.userId, key: 'votes.reminder' as const, subject: o.id, at: plus(o.votesCloseAt, -12 * HOUR), expiresAt: o.votesCloseAt, refs: { outingId: o.id } })),
        ]);
        return;
      }
      case 'outing.votes_closed': {
        const o = await this.facts.outing(str(p.outingId) ?? e.aggregateId);
        if (!o) return;
        const reveals = await this.facts.reveals('OUTING', o.id);
        const plans: Plan[] = [];
        for (const s of o.seats.filter((x) => x.status === 'ATTENDED')) {
          const mine = reveals.filter((r) => r.users.includes(s.userId));
          // Un seul message par personne : son accord s'il est unique, sinon un texte neutre (l'app détaille).
          if (mine.length === 1) {
            const r = mine[0]!;
            const other = r.users[0] === s.userId ? r.users[1] : r.users[0];
            plans.push({ userId: s.userId, key: r.result === 'PLUS' ? 'connection.plus' : 'connection.friend', subject: o.id, dedupKey: `votes.closed:${o.id}`, at: now, expiresAt: plus(now, 48 * HOUR), refs: { outingId: o.id, otherUserId: other } });
          } else {
            plans.push({ userId: s.userId, key: 'votes.closed', subject: o.id, at: now, expiresAt: plus(now, 48 * HOUR), refs: { outingId: o.id } });
          }
        }
        await q(plans);
        return;
      }
      case 'outing.cancelled': {
        const outingId = str(p.outingId) ?? e.aggregateId;
        await q(strs(p.userIds).map((userId) => ({ userId, key: 'outing.cancelled' as const, subject: outingId, at: now, expiresAt: plus(now, 24 * HOUR), refs: { outingId } })));
        return;
      }
      case 'outing.composition_changed': {
        const userId = str(p.userId);
        const outingId = str(p.outingId);
        if (!userId || !outingId) return;
        await q([{ userId, key: 'outing.composition_changed', subject: outingId, at: now, expiresAt: plus(now, 24 * HOUR), refs: { outingId } }]);
        return;
      }
      case 'economy.refund_settled': {
        const userId = str(p.userId);
        const seatId = str(p.seatId);
        if (!userId || !seatId) return;
        const seat = await this.facts.seat(seatId);
        await q([{ userId, key: 'outing.refund_done', subject: seatId, at: plus(now, MIN), expiresAt: plus(now, 72 * HOUR), refs: { seatId, ...(seat ? { outingId: seat.outingId } : {}) } }]);
        return;
      }
      case 'outing.attendance_recorded':
      case 'duo.date_attendance_recorded': {
        if (p.attended !== false) return;
        const userId = str(p.userId);
        if (!userId) return;
        const until = await this.facts.reliabilityPausedUntil(userId);
        if (!until || until.getTime() <= now.getTime()) return;
        await q([{ userId, key: 'reliability.paused', subject: until.toISOString(), at: now, expiresAt: until, refs: { pausedUntil: until.toISOString() } }]);
        return;
      }
      case 'safety.alert_raised': {
        const userId = str(p.userId);
        if (!userId) return;
        await q([{ userId, key: 'safety.alert_sent', subject: str(p.alertId) ?? e.aggregateId, at: now, expiresAt: plus(now, HOUR), refs: {} }]);
        return;
      }
      case 'connection.revealed': {
        if (p.source !== 'DUO') return; // sorties : regroupé à `outing.votes_closed`
        const users = strs(p.users);
        if (users.length !== 2) return;
        const key = p.kind === 'PLUS' ? 'connection.plus' : 'connection.friend';
        await q(users.map((u, i) => ({ userId: u, key, subject: e.aggregateId, at: now, expiresAt: plus(now, 48 * HOUR), refs: { otherUserId: users[1 - i]!, ...(str(p.duoId) ? { duoId: str(p.duoId)! } : {}) } })));
        return;
      }
      case 'team.member_joined': {
        const members = strs(p.userIds);
        const joiner = members.at(-1);
        const teamId = str(p.teamId) ?? e.aggregateId;
        if (!joiner) return;
        await q(members.filter((u) => u !== joiner).map((userId) => ({ userId, key: 'team.member_joined' as const, subject: `${teamId}:${joiner}`, at: now, expiresAt: plus(now, 24 * HOUR), refs: { teamId, otherUserId: joiner } })));
        return;
      }
      case 'duo.matched': {
        const d = await this.facts.duo(str(p.duoId) ?? e.aggregateId);
        if (!d) return;
        const plans: Plan[] = d.userIds.map((userId) => ({ userId, key: 'duo.matched', subject: d.id, at: now, expiresAt: d.exchangeEndsAt, refs: { duoId: d.id } }));
        if (d.exchangeEndsAt) plans.push(...d.userIds.map((userId): Plan => ({ userId, key: 'duo.exchange_ending', subject: d.id, at: plus(d.exchangeEndsAt!, -12 * HOUR), expiresAt: d.exchangeEndsAt, refs: { duoId: d.id } })));
        await q(plans);
        return;
      }
      case 'duo.unlocked': {
        const d = await this.facts.duo(str(p.duoId) ?? e.aggregateId);
        if (!d) return;
        const plans: Plan[] = d.userIds.map((userId) => ({ userId, key: 'duo.unlocked', subject: d.id, at: now, expiresAt: plus(now, 48 * HOUR), refs: { duoId: d.id } }));
        if (d.dateDeadline) plans.push(...d.userIds.map((userId): Plan => ({ userId, key: 'duo.deadline_soon', subject: d.id, at: plus(d.dateDeadline!, -24 * HOUR), expiresAt: d.dateDeadline, refs: { duoId: d.id } })));
        await q(plans);
        return;
      }
      case 'duo.date_proposed': {
        const to = str(p.toUserId);
        const dateId = str(p.duoDateId) ?? e.aggregateId;
        const dd = await this.facts.duoDate(dateId);
        if (!to || !dd) return;
        await q([{ userId: to, key: 'duo.date_proposed', subject: dateId, at: now, expiresAt: dd.startsAt, refs: { duoId: dd.duoId, duoDateId: dateId, otherUserId: dd.proposedByUserId } }]);
        return;
      }
      case 'duo.date_confirmed': {
        const dd = await this.facts.duoDate(str(p.duoDateId) ?? e.aggregateId);
        if (!dd) return;
        const refs = { duoId: dd.duoId, duoDateId: dd.id };
        await q([
          ...dd.userIds.map((userId): Plan => ({ userId, key: 'duo.date_confirmed', subject: dd.id, at: now, expiresAt: dd.startsAt, refs })),
          ...dd.userIds.map((userId): Plan => ({ userId, key: 'duo.date_reminder', subject: dd.id, at: plus(dd.startsAt, -24 * HOUR), expiresAt: plus(dd.startsAt, -2 * HOUR), refs: { ...refs, otherUserId: dd.userIds.find((u) => u !== userId)! } })),
          ...dd.userIds.map((userId): Plan => ({ userId, key: 'duo.checkin_open', subject: dd.id, at: plus(dd.startsAt, -30 * MIN), expiresAt: dd.endsAt, refs })),
        ]);
        return;
      }
      case 'duo.date_done': {
        if (p.bothPresent !== true) return;
        const dd = await this.facts.duoDate(str(p.duoDateId) ?? e.aggregateId);
        if (!dd) return;
        await q(dd.userIds.map((userId) => ({ userId, key: 'duo.after_vote' as const, subject: dd.id, at: now, expiresAt: dd.votesCloseAt, refs: { duoId: dd.duoId, duoDateId: dd.id } })));
        return;
      }
      case 'duo.ended': {
        // LEFT / EXPIRED : texte neutre identique ; CLOSED (blocage, ou passage en bande) : rien.
        if (p.status !== 'LEFT' && p.status !== 'EXPIRED') return;
        const duoId = str(p.duoId) ?? e.aggregateId;
        await q(strs(p.userIds).map((userId) => ({ userId, key: 'duo.closed' as const, subject: duoId, at: now, expiresAt: plus(now, 24 * HOUR), refs: { duoId } })));
        return;
      }
      case 'message.submitted':
        return this.message(scope, str(p.messageId) ?? e.aggregateId, str(p.conversationId));
      case 'privacy.deletion_requested': {
        const userId = str(p.userId) ?? e.aggregateId;
        await this.repo.suppressQueuedOf(scope, userId, 'ACCOUNT_DELETED');
        await this.repo.clearAllTokens(scope, userId);
        return;
      }
    }
  }

  private async invited(scope: TxScope, outingId: string, userId: string | null) {
    if (!userId) return;
    const o = await this.facts.outing(outingId);
    const seat = o?.seats.find((s) => s.userId === userId);
    if (!o || !seat) return;
    const key = o.kind === 'SEEDING' ? 'outing.seeding_invited' : 'outing.invited';
    const queued = await this.planner.enqueueProposal(scope, { userId, key, subject: o.id, weekKey: o.weekKey, at: scope.now, expiresAt: seat.acceptDeadline, refs: { outingId: o.id, weekKey: o.weekKey } });
    const remindAt = plus(seat.acceptDeadline, -4 * HOUR);
    // Rappel unique, sans urgence, seulement si l'invitation elle-même a été notifiée.
    if (queued && remindAt.getTime() > scope.now.getTime() + HOUR) {
      await this.planner.enqueue(scope, [{ userId, key: 'outing.invite_reminder', subject: o.id, at: remindAt, expiresAt: seat.acceptDeadline, refs: { outingId: o.id } }]);
    }
  }

  /** Regroupement par conversation : une file par conversation, puis silence pendant 10 min après un envoi. */
  private async message(scope: TxScope, messageId: string, convId: string | null) {
    const m = await this.facts.messageAuthor(messageId);
    if (!m || m.kind === 'SYSTEM' || !m.authorUserId) return;
    const conv = await this.facts.conversation(convId ?? m.conversationId);
    if (!conv || conv.closedAt) return;
    const groupKey = `conv:${conv.id}`;
    const plans: Plan[] = [];
    for (const member of conv.members) {
      if (member.revokedAt || member.userId === m.authorUserId) continue;
      const pending = await this.repo.pendingInGroup(scope, member.userId, groupKey);
      if (pending) {
        await this.repo.updateRefs(scope, pending.id, { ...pending.refs, count: (pending.refs.count ?? 1) + 1 });
        continue;
      }
      const last = await this.repo.lastSentInGroup(scope, member.userId, groupKey);
      if (last && scope.now.getTime() - last.getTime() < MESSAGE_GROUP_WINDOW_MS) continue;
      plans.push({ userId: member.userId, key: 'message.human', subject: messageId, groupKey, at: scope.now, expiresAt: plus(scope.now, 12 * HOUR), refs: { conversationId: conv.id, since: new Date(scope.now.getTime() - MIN).toISOString(), count: 1 } });
    }
    await this.planner.enqueue(scope, plans);
  }
}
