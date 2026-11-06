/**
 * Événements WS du module `connections` (spec-v5 §7.6) — projection PAR DESTINATAIRE :
 *  - `duo.updated` dans la salle `duo:<id>` (membres d'un duo actif) ; la fin (`ENDED`) va dans
 *    `user:<id>` (la salle du duo est révoquée dans la même vague) ;
 *  - `connection.revealed`, `band.updated`, `pet.updated` dans `user:<id>` ;
 *  - perte d'accès : `realtime.revoke` (salles `duo:` et `conversation:`).
 * Aucun événement à la saisie d'un bulletin, ni chez l'autre lors d'un « passer ».
 */
import type { DuoStatus } from '@blowy/domain';
import type { RandomSource } from '../../../shared/application/clock.js';
import { userRoom, type EventPublisher } from '../../../shared/application/event-publisher.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';

export const duoRoom = (id: string) => `duo:${id}`;
export type DuoChange = 'STATUS' | 'UNLOCKED' | 'DATE' | 'VOTE' | 'ENDED' | 'EGG';

export class DuoEvents {
  constructor(
    private readonly publisher: EventPublisher,
    private readonly random: RandomSource,
  ) {}

  duoUpdated(scope: TxScope, duoId: string, userIds: readonly string[], status: DuoStatus, changed: DuoChange) {
    if (userIds.length === 0) return Promise.resolve();
    return this.publisher.publish(scope, {
      sourceEventId: this.random.uuid(),
      type: 'duo.updated',
      aggregateId: duoId,
      room: changed === 'ENDED' ? userRoom : duoRoom(duoId),
      recipients: userIds.map((userId) => ({ userId, payload: { duoId, status, changed } })),
    });
  }

  private personal(scope: TxScope, type: string, aggregateId: string, recipients: { userId: string; payload: Record<string, unknown> }[]) {
    if (recipients.length === 0) return Promise.resolve();
    return this.publisher.publish(scope, { sourceEventId: this.random.uuid(), type, aggregateId, room: userRoom, recipients });
  }

  connectionRevealed(scope: TxScope, aggregateId: string, userId: string, payload: Record<string, unknown>) {
    return this.personal(scope, 'connection.revealed', aggregateId, [{ userId, payload }]);
  }

  bandUpdated(scope: TxScope, linkId: string, userIds: string[], status: 'ACTIVE' | 'WITHDRAWN') {
    return this.personal(scope, 'band.updated', linkId, userIds.map((userId) => ({ userId, payload: { linkId, status } })));
  }

  petUpdated(scope: TxScope, userId: string, p: { petId: string; stage: string; memoryKind: string; accessoryUnlocked?: string }) {
    return this.personal(scope, 'pet.updated', p.petId, [{ userId, payload: { petId: p.petId, stage: p.stage, memoryAdded: { kind: p.memoryKind }, ...(p.accessoryUnlocked ? { accessoryUnlocked: p.accessoryUnlocked } : {}) } }]);
  }

  async revoke(scope: TxScope, userId: string, rooms: string[]) {
    if (rooms.length === 0) return;
    await scope.outbox.emit({ topic: 'realtime.revoke', aggregateType: 'User', aggregateId: userId, payload: { rooms } });
  }
}
