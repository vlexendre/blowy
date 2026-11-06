/**
 * Auteurs du chat de sortie (spec-v5 §2.8, V5.3 B.7) : pet de chaque membre ; prénom seulement à partir de
 * la confirmation (statut ≥ CONFIRMED et `now ≥ lockAt`) et pour un lecteur dont la place est confirmée.
 * Une personne bloquée (dans un sens ou l'autre) n'est jamais signée.
 */
import type { Db } from '@blowy/database';
import type { MessageAuthorResolver, MessageAuthorView } from '../../../shared/application/ports/message-author.port.js';
import type { BlockReader } from '../../../shared/application/ports/block-reader.port.js';

const LOCKED = new Set(['CONFIRMED', 'CHECKIN_OPEN', 'DONE']);
const SEATED = new Set(['CONFIRMED', 'CHECKED_IN', 'ATTENDED', 'CANCELLED', 'NO_SHOW']);

export class PrismaMessageAuthors implements MessageAuthorResolver {
  constructor(
    private readonly db: Db,
    private readonly blocks: BlockReader,
  ) {}

  async authorsFor(conversationId: string, viewerId: string, at: Date): Promise<ReadonlyMap<string, MessageAuthorView> | null> {
    const conv = await this.db.conversation.findUnique({ where: { id: conversationId }, select: { outingId: true } });
    if (!conv?.outingId) return null;
    const o = await this.db.outing.findUnique({
      where: { id: conv.outingId },
      select: {
        status: true,
        lockAt: true,
        seats: { where: { status: { in: [...SEATED] as never } }, select: { userId: true, status: true, user: { select: { profile: { select: { displayName: true } }, primaryPet: { select: { name: true, species: true } }, outingPreferences: { select: { showCalmBadge: true } } } } } },
      },
    });
    if (!o) return null;
    const mine = o.seats.find((s) => s.userId === viewerId);
    const named = LOCKED.has(o.status) && at >= o.lockAt && !!mine && mine.status !== 'CANCELLED';
    const out = new Map<string, MessageAuthorView>();
    for (const s of o.seats) {
      if (s.userId === viewerId || !s.user.primaryPet) continue;
      if (await this.blocks.isBlockedBetween(viewerId, s.userId)) continue;
      out.set(s.userId, { pet: { name: s.user.primaryPet.name, species: s.user.primaryPet.species }, ...(named && s.user.profile?.displayName ? { firstName: s.user.profile.displayName } : {}), ...(s.user.outingPreferences?.showCalmBadge ? { calm: true as const } : {}) });
    }
    return out;
  }
}
