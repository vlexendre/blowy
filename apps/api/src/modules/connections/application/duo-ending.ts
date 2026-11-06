/**
 * Fins de lien (D-017) — un seul chemin pour toute fin de duo ou de lien de bande, appelé sous les
 * verrous de l'appelant : même message système neutre des deux côtés, aucun motif, aucune pénalité.
 *  - `LEFT` (partir proprement) / `CLOSED` (vote non mutuel, blocage) : accès retiré tout de suite
 *    (conversation fermée, membres révoqués, salles `duo:` et `conversation:` révoquées) ;
 *  - `EXPIRED` (voie Duo) : conversation en lecture seule 7 j, accès retiré ensuite par le job.
 * Un RDV vivant est annulé sans effet de fiabilité ; les liens gardien sont révoqués par `safety`
 * sur `duo.date_cancelled` / `duo.ended`.
 */
import type { DuoStatus } from '@blowy/domain';
import type { GroupChatPort } from '../../../shared/application/ports/group-chat.port.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { duoRoom, type DuoEvents } from './duo-events.js';
import type { BandLinkRow, ConnectionsRepository, DuoRow } from './ports/connections.repository.js';

export class DuoEnding {
  constructor(
    private readonly repo: ConnectionsRepository,
    private readonly chat: GroupChatPort,
    private readonly events: DuoEvents,
  ) {}

  /** `template` = clé `@blowy/content` (null : aucun message, ex. blocage silencieux). */
  async end(scope: TxScope, d: DuoRow, status: Extract<DuoStatus, 'EXPIRED' | 'CLOSED' | 'LEFT'>, template: string | null, actorId: string | null) {
    const users = [d.userLowId, d.userHighId];
    const live = await this.repo.liveDate(scope, d.id);
    if (live) {
      await this.repo.updateDate(scope, live.id, live.status === 'CONFIRMED' ? { status: 'CANCELLED', cancelledByUserId: actorId ?? d.userLowId } : { status: 'SUPERSEDED' });
      await scope.outbox.emit({ topic: 'duo.date_cancelled', aggregateType: 'DuoDate', aggregateId: live.id, payload: { duoId: d.id, duoDateId: live.id, userIds: users, system: true } });
    }
    await this.repo.updateDuo(scope, d.id, { status, endedAt: scope.now });
    const conv = d.conversationId ?? (await this.repo.conversationOfDuo(scope, d.id));
    if (conv) {
      if (template) await this.chat.postSystem(scope, conv, template);
      await this.chat.close(scope, conv);
    }
    await this.events.duoUpdated(scope, d.id, users, status, 'ENDED');
    if (status !== 'EXPIRED') await this.revokeAccess(scope, d.id, conv, users);
    await scope.outbox.emit({ topic: 'duo.ended', aggregateType: 'Duo', aggregateId: d.id, payload: { duoId: d.id, status, userIds: users } });
  }

  async revokeAccess(scope: TxScope, duoId: string, conv: string | null, users: string[]) {
    for (const u of users) {
      if (conv) await this.chat.revokeMember(scope, conv, u);
      await this.events.revoke(scope, u, [duoRoom(duoId), ...(conv ? [`conversation:${conv}`] : [])]);
    }
  }

  /** « Partir proprement » d'un lien de bande (ou blocage) : neutre, sans motif ni pénalité. */
  async withdrawBand(scope: TxScope, l: BandLinkRow, reason: 'LEFT' | 'BLOCKED') {
    const users = [l.userLowId, l.userHighId];
    await this.repo.withdrawBandLink(scope, l.id, reason);
    if (l.conversationId) {
      if (reason === 'LEFT') await this.chat.postSystem(scope, l.conversationId, 'system.band.left');
      await this.chat.close(scope, l.conversationId);
      for (const u of users) await this.chat.revokeMember(scope, l.conversationId, u);
    }
    await this.events.bandUpdated(scope, l.id, users, 'WITHDRAWN');
    for (const u of users) await this.events.revoke(scope, u, l.conversationId ? [`conversation:${l.conversationId}`] : []);
    await scope.outbox.emit({ topic: 'band.withdrawn', aggregateType: 'Friendship', aggregateId: l.id, payload: { linkId: l.id, userIds: users } });
  }
}
