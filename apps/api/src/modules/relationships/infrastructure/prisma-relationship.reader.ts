import type { Db } from '@blowy/database';
import type { RelationshipReader } from '../../../shared/application/ports/relationship-reader.port.js';

/** Port de lecture pour l'économie (droits dérivés du partenaire emménagé). */
export class PrismaRelationshipReader implements RelationshipReader {
  constructor(private readonly db: Db) {}
  async findMovedInPartner(userId: string) {
    const side = await this.db.relationshipSide.findFirst({ where: { userId, exclusive: true, active: true, context: { status: 'MOVED_IN' } }, include: { context: { include: { sides: true } } } });
    const other = side?.context.sides.find((s) => s.userId !== userId);
    return side && other ? { partnerUserId: other.userId, relationshipId: side.contextId } : null;
  }
}
