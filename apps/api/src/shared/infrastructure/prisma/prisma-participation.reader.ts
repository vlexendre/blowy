import type { Db } from '@blowy/database';
import type { Participation, ParticipationReader } from '../../application/ports/participation.reader.js';

export class PrismaParticipationReader implements ParticipationReader {
  constructor(private readonly db: Db) {}

  async get(userId: string, contextId: string): Promise<Participation | null> {
    const ctx = await this.db.relationshipContext.findUnique({
      where: { id: contextId },
      include: { sides: true, conversation: { select: { id: true } } },
    });
    if (!ctx) return null;
    const mine = ctx.sides.find((s) => s.userId === userId && s.active);
    const other = ctx.sides.find((s) => s.userId !== userId);
    if (!mine || !other) return null;
    return {
      contextId: ctx.id,
      type: ctx.type,
      status: ctx.status,
      myUserId: userId,
      myPetId: mine.petId,
      otherUserId: other.userId,
      otherPetId: other.petId,
      conversationId: ctx.conversation?.id ?? null,
    };
  }

  async sharesRelationshipWithPet(userId: string, petId: string): Promise<boolean> {
    const n = await this.db.relationshipSide.count({
      where: { petId, active: true, context: { status: { not: 'ENDED' }, sides: { some: { userId, active: true } } } },
    });
    return n > 0;
  }
}
