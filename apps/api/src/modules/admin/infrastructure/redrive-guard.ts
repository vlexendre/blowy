/**
 * Garde « état actuel » du redrive d'outbox (§18.13 : « le redrive d'un job contrôle l'état
 * actuel et n'exécute pas aveuglément une ancienne permission »). Strategy par famille de topic.
 * Topic inconnu → refusé par défaut (liste blanche).
 */
import type { Db } from '@blowy/database';
import type { RedriveGuard } from '../application/ports/admin.ports.js';

type Ev = { topic: string; aggregateType: string; aggregateId: string; payload: Record<string, unknown> };
type Check = (db: Db, e: Ev) => Promise<string | null>;

const userActive: Check = async (db, e) => {
  const id = (e.aggregateType === 'User' ? e.aggregateId : (e.payload['userId'] as string | undefined)) ?? null;
  if (!id) return null;
  const u = await db.user.findUnique({ where: { id }, select: { status: true } });
  if (!u) return 'USER_NOT_FOUND';
  return u.status === 'DELETED' || u.status === 'BANNED' ? `USER_${u.status}` : null;
};

const CHECKS: { prefix: string; check: Check }[] = [
  {
    // Message : n'est re-modéré que s'il est TOUJOURS en attente et que l'auteur/la conversation sont encore actifs.
    prefix: 'message.',
    check: async (db, e) => {
      const m = await db.message.findUnique({ where: { id: e.aggregateId }, select: { status: true, authorUserId: true, conversation: { select: { closedAt: true } } } });
      if (!m) return 'MESSAGE_NOT_FOUND';
      if (m.status !== 'PENDING_MODERATION') return `MESSAGE_ALREADY_${m.status}`;
      if (m.conversation.closedAt) return 'CONVERSATION_CLOSED';
      if (m.authorUserId) {
        const u = await db.user.findUnique({ where: { id: m.authorUserId }, select: { status: true } });
        if (!u || u.status === 'DELETED' || u.status === 'BANNED') return 'AUTHOR_UNAVAILABLE';
      }
      return null;
    },
  },
  {
    prefix: 'relationship.',
    check: async (db, e) => {
      const id = (e.payload['relationshipId'] as string | undefined) ?? e.aggregateId;
      const c = await db.relationshipContext.findUnique({ where: { id }, select: { id: true } });
      return c ? null : 'RELATIONSHIP_NOT_FOUND';
    },
  },
  { prefix: 'economy.', check: userActive },
  { prefix: 'referral.', check: userActive },
  { prefix: 'social.', check: async () => null },
  { prefix: 'user.', check: userActive },
  { prefix: 'pet.', check: async () => null },
  { prefix: 'match.', check: async () => null },
  { prefix: 'audit.', check: async () => null },
  // Diffusions temps réel périmées : jamais rejouées (l'état se resynchronise par curseur).
  { prefix: 'realtime.', check: async () => 'REALTIME_NOT_REPLAYABLE' },
];

export class StateAwareRedriveGuard implements RedriveGuard {
  constructor(private readonly db: Db) {}
  async check(e: Ev) {
    const rule = CHECKS.find((c) => e.topic.startsWith(c.prefix));
    if (!rule) return { ok: false as const, reason: 'TOPIC_NOT_REDRIVABLE' };
    const reason = await rule.check(this.db, e);
    return reason ? { ok: false as const, reason } : { ok: true as const };
  }
}
