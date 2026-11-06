/** V5.4 (A.6) : `PhoneIdentity` (condensé du numéro vérifié) et `AvoidPair` (paires symétriques). Aucun numéro. */
import { pairKey } from '@blowy/domain';
import type { Db } from '@blowy/database';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { CONTACT_AVOIDANCE_CONSENT_VERSION, CONTACT_AVOIDANCE_PURPOSE, type ContactAvoidanceRepository } from '../application/contact-avoidance.use-cases.js';

export class PrismaContactAvoidanceRepository implements ContactAvoidanceRepository {
  constructor(private readonly db: Db) {}

  async consent(userId: string) {
    const c = await this.db.processingConsent.findFirst({ where: { userId, purpose: CONTACT_AVOIDANCE_PURPOSE }, orderBy: { createdAt: 'desc' }, select: { granted: true } });
    return c ? c.granted : null;
  }

  async hasPhone(userId: string) {
    return (await this.db.phoneIdentity.count({ where: { userId } })) > 0;
  }

  async hasEverBeenInvited(userId: string) {
    return (await this.db.outingSeat.count({ where: { userId } })) > 0;
  }

  async recordConsent(scope: TxScope, userId: string, granted: boolean) {
    await txOf(scope).processingConsent.create({ data: { userId, purpose: CONTACT_AVOIDANCE_PURPOSE, version: CONTACT_AVOIDANCE_CONSENT_VERSION, granted, createdAt: scope.now } });
  }

  async savePhone(scope: TxScope, userId: string, tokenDigest: string) {
    const tx = txOf(scope);
    const owner = await tx.phoneIdentity.findUnique({ where: { tokenDigest }, select: { userId: true } });
    if (owner && owner.userId !== userId) return false;
    await tx.phoneIdentity.upsert({ where: { userId }, create: { userId, tokenDigest, verifiedAt: scope.now }, update: { tokenDigest, verifiedAt: scope.now } });
    return true;
  }

  async usersWithDigests(digests: string[], exceptUserId: string) {
    if (digests.length === 0) return [];
    const rows = await this.db.phoneIdentity.findMany({ where: { tokenDigest: { in: digests }, userId: { not: exceptUserId } }, select: { userId: true } });
    return rows.map((r) => r.userId);
  }

  async addAvoidPairs(scope: TxScope, userId: string, others: string[]) {
    const data = [...new Set(others.filter((o) => o !== userId).map((o) => pairKey(userId, o)))].map((k) => {
      const [userLowId, userHighId] = k.split('|') as [string, string];
      return { userLowId, userHighId, createdAt: scope.now };
    });
    if (data.length) await txOf(scope).avoidPair.createMany({ data, skipDuplicates: true });
  }

  async erase(scope: TxScope, userId: string) {
    const tx = txOf(scope);
    await tx.avoidPair.deleteMany({ where: { OR: [{ userLowId: userId }, { userHighId: userId }] } });
    await tx.phoneIdentity.deleteMany({ where: { userId } });
  }
}
