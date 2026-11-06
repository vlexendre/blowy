/**
 * Service applicatif partagé par les commandes de relations : clôture d'une relation
 * (événement, message système pré-écrit, révocation des rooms, retour des pets, outbox).
 * Une seule implémentation pour leave, emménagement ailleurs, silence 14 j, blocage.
 */
import { userRoom, type EventPublisher } from '../../../shared/application/event-publisher.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { REL_EVENTS, SYSTEM_TEMPLATES } from '../domain/relationship-events.js';
import type { ConversationAdmin, PetPlacement } from './ports/relationship-side-effects.port.js';
import type { ContextRow, RelationshipRepository } from './ports/relationship.repository.js';

export type EndReason = 'CLEAN_LEAVE' | 'SILENCE_14D' | 'MOVED_IN_ELSEWHERE' | 'BLOCK' | 'REPORT_SAFETY_EXIT' | 'ACCOUNT_DELETED' | 'TRANSFERRED_TO_NEIGHBORHOOD' | 'MODERATION';

const TEMPLATE_FOR: Partial<Record<EndReason, string>> = {
  CLEAN_LEAVE: SYSTEM_TEMPLATES.CLEAN_LEAVE,
  MOVED_IN_ELSEWHERE: SYSTEM_TEMPLATES.MOVED_IN_ELSEWHERE,
  SILENCE_14D: SYSTEM_TEMPLATES.SILENCE_14D,
};

export class RelationshipLifecycle {
  constructor(
    private readonly repo: RelationshipRepository,
    private readonly conversations: ConversationAdmin,
    private readonly pets: PetPlacement,
    private readonly events: EventPublisher,
  ) {}

  /** Verrous relation déjà pris par l'appelant. Idempotent : ne fait rien si déjà terminée. */
  async end(scope: TxScope, ctx: ContextRow, reason: EndReason, actorId: string | null): Promise<void> {
    if (ctx.status === 'ENDED') return;
    // Sécurité/blocage : aucun message de départ demandé ni publié (P-5.15).
    const template = TEMPLATE_FOR[reason];
    if (template && ctx.conversationId) await this.conversations.postSystemMessage(scope, ctx.conversationId, template);
    await this.repo.update(scope, ctx.id, { status: 'ENDED', endedAt: scope.now, endReason: reason });
    await this.repo.deactivateSides(scope, ctx.id);
    await this.repo.supersedeOffersOf(scope, [ctx.id], 'MOVE_IN');
    for (const s of ctx.sides) {
      await this.pets.returnHomeIfIn(scope, s.petId, ctx.id);
      if (ctx.conversationId) await this.conversations.revokeMember(scope, ctx.conversationId, s.userId);
      await this.repo.setReplyOwed(scope, ctx.id, s.userId, null, null);
    }
    if (ctx.conversationId) await this.conversations.close(scope, ctx.conversationId);
    // La raison n'est visible que de l'acteur ; l'autre voit un départ neutre.
    const ev = await this.repo.appendEvent(scope, ctx.id, { type: REL_EVENTS.ENDED, actorUserId: actorId, visibility: 'SYSTEM', payload: { reason } });
    // Projeté dans la room PERSONNELLE de chacun (B6) : la room `relationship:` est révoquée dans la
    // même transaction, l'événement y serait perdu selon l'ordre du relais. `user:<id>` ne l'est
    // jamais et le curseur de projection garantit la livraison (resync) même après coup.
    await this.events.publish(scope, {
      sourceEventId: ev.id,
      type: 'relationship.ended',
      aggregateId: ctx.id,
      room: userRoom,
      recipients: ctx.sides.map((s) => ({ userId: s.userId, payload: { relationshipId: ctx.id, conversationId: ctx.conversationId ?? null } })),
    });
    for (const s of ctx.sides) {
      await scope.outbox.emit({ topic: 'realtime.revoke', aggregateType: 'User', aggregateId: s.userId, payload: { rooms: [`relationship:${ctx.id}`, ...(ctx.conversationId ? [`conversation:${ctx.conversationId}`] : [])] } });
    }
    await scope.outbox.emit({
      topic: 'relationship.ended',
      aggregateType: 'RelationshipContext',
      aggregateId: ctx.id,
      payload: { relationshipId: ctx.id, userIds: ctx.sides.map((s) => s.userId), reason, occurredAt: scope.now.toISOString() },
    });
  }

  /**
   * Nouvelle relation + conversation (match) : annoncée dans la room PERSONNELLE de chaque
   * participant (B5) — ils ne connaissent pas encore la room `relationship:`.
   */
  async created(scope: TxScope, ctx: ContextRow, conversationId: string): Promise<void> {
    const ev = await this.repo.appendEvent(scope, ctx.id, { type: REL_EVENTS.CREATED, actorUserId: null, payload: {} });
    await this.events.publish(scope, {
      sourceEventId: ev.id,
      type: 'match.created',
      aggregateId: ctx.id,
      room: userRoom,
      recipients: ctx.sides.map((s) => ({ userId: s.userId, payload: { relationshipId: ctx.id, conversationId } })),
    });
  }

  /** Notifie les deux participants qu'une relation a changé (payload minimal, sans secret). */
  async touched(scope: TxScope, ctx: ContextRow, type: string, actorId: string | null, payload: Record<string, unknown> = {}): Promise<void> {
    const ev = await this.repo.appendEvent(scope, ctx.id, { type, actorUserId: actorId, payload });
    await this.events.publish(scope, {
      sourceEventId: ev.id,
      type: 'relationship.updated',
      aggregateId: ctx.id,
      room: `relationship:${ctx.id}`,
      recipients: ctx.sides.map((s) => ({ userId: s.userId, payload: { relationshipId: ctx.id, change: type } })),
    });
  }
}
