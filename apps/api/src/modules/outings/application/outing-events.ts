/**
 * Publication des événements V5 (spec-v5 §7.6) : projection PAR DESTINATAIRE (payload filtré) +
 * outbox dans la transaction de la commande. Les événements personnels vont dans `user:<id>`
 * (jamais révoquée) ; ceux du groupe dans `outing:<id>` (places confirmées). Aucun événement à la
 * saisie d'un vote.
 */
import type { RandomSource } from '../../../shared/application/clock.js';
import { userRoom, type EventPublisher } from '../../../shared/application/event-publisher.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';

export const outingRoom = (id: string) => `outing:${id}`;

export class OutingEvents {
  constructor(
    private readonly publisher: EventPublisher,
    private readonly random: RandomSource,
  ) {}

  private personal(scope: TxScope, type: string, aggregateId: string, recipients: { userId: string; payload: Record<string, unknown> }[]) {
    if (recipients.length === 0) return Promise.resolve();
    return this.publisher.publish(scope, { sourceEventId: this.random.uuid(), type, aggregateId, room: userRoom, recipients });
  }

  invited(scope: TxScope, outingId: string, userId: string, acceptDeadline: Date) {
    return this.personal(scope, 'outing.invited', outingId, [{ userId, payload: { outingId, acceptDeadline: acceptDeadline.toISOString() } }]);
  }

  /** Le client relit `GET /outings/:id` (projection) ; destinataires = places confirmées. */
  updated(scope: TxScope, outingId: string, recipients: string[], p: { status: string; confirmedCount?: number; changed: 'STATUS' | 'MEMBERS' | 'VENUE' | 'PHOTOS' }) {
    if (recipients.length === 0) return Promise.resolve();
    return this.publisher.publish(scope, {
      sourceEventId: this.random.uuid(),
      type: 'outing.updated',
      aggregateId: outingId,
      room: outingRoom(outingId),
      recipients: recipients.map((userId) => ({ userId, payload: { outingId, status: p.status, ...(p.confirmedCount !== undefined ? { confirmedCount: p.confirmedCount } : {}), changed: p.changed } })),
    });
  }

  seatUpdated(scope: TxScope, outingId: string, userId: string, seat: { status: string; refundState: string }) {
    return this.personal(scope, 'outing.seat_updated', outingId, [{ userId, payload: { outingId, seat } }]);
  }

  checkinUpdated(scope: TxScope, outingId: string, recipients: string[], arrivedUserId: string) {
    const others = recipients.filter((r) => r !== arrivedUserId);
    if (others.length === 0) return Promise.resolve();
    return this.publisher.publish(scope, { sourceEventId: this.random.uuid(), type: 'outing.checkin_updated', aggregateId: outingId, room: outingRoom(outingId), recipients: others.map((userId) => ({ userId, payload: { outingId, userId: arrivedUserId, arrived: true } })) });
  }

  votesOpened(scope: TxScope, outingId: string, recipients: string[], closesAt: Date) {
    return this.personal(scope, 'outing.votes_opened', outingId, recipients.map((userId) => ({ userId, payload: { outingId, closesAt: closesAt.toISOString() } })));
  }

  votesClosed(scope: TxScope, outingId: string, perUser: Map<string, { band: number; duo: number }>) {
    return this.personal(scope, 'outing.votes_closed', outingId, [...perUser].map(([userId, c]) => ({ userId, payload: { outingId, newBandCount: c.band, newDuoCount: c.duo } })));
  }

  connectionRevealed(scope: TxScope, aggregateId: string, userId: string, payload: Record<string, unknown>) {
    return this.personal(scope, 'connection.revealed', aggregateId, [{ userId, payload }]);
  }

  bandUpdated(scope: TxScope, linkId: string, userIds: string[], status: 'ACTIVE' | 'WITHDRAWN') {
    return this.personal(scope, 'band.updated', linkId, userIds.map((userId) => ({ userId, payload: { linkId, status } })));
  }

  reliabilityUpdated(scope: TxScope, userId: string, p: { attended: number; total: number; pausedUntil: Date | null }) {
    return this.personal(scope, 'reliability.updated', userId, [{ userId, payload: { attended: p.attended, total: p.total, ...(p.pausedUntil ? { pausedUntil: p.pausedUntil.toISOString() } : {}) } }]);
  }

  petUpdated(scope: TxScope, userId: string, p: { petId: string; stage: string; memoryKind: string; accessoryUnlocked?: string }) {
    return this.personal(scope, 'pet.updated', p.petId, [{ userId, payload: { petId: p.petId, stage: p.stage, memoryAdded: { kind: p.memoryKind }, ...(p.accessoryUnlocked ? { accessoryUnlocked: p.accessoryUnlocked } : {}) } }]);
  }

  /** Perte d'accès (salles `outing:` et `conversation:`). */
  async revoke(scope: TxScope, userId: string, outingId: string, conversationId: string | null) {
    await scope.outbox.emit({ topic: 'realtime.revoke', aggregateType: 'User', aggregateId: userId, payload: { rooms: [outingRoom(outingId), ...(conversationId ? [`conversation:${conversationId}`] : [])] } });
  }
}
