/** V5.5 (D-064) : récompenses de parrainage « prochaine sortie offerte » (`ReferralReward`). */
import { civilMonthOf } from '@blowy/domain';
import { uuidv7, type Db } from '@blowy/database';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import { txOf } from '../../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { ReferralFreeStore } from '../../application/payments/ports.js';
export type { ReferralFreeStore };

export class PrismaReferralFreeStore implements ReferralFreeStore {
  constructor(private readonly db: Db) {}

  async grant(scope: TxScope, i: { referrerUserId: string; refereeUserId: string; period: string }) {
    const tx = txOf(scope);
    if (await tx.referralReward.count({ where: { referrerUserId: i.referrerUserId, consumedSeatId: null } })) return false;
    const n = await tx.$executeRaw`
      INSERT INTO "ReferralReward" (id, "referrerUserId", "refereeUserId", period, "createdAt")
      VALUES (${uuidv7(scope.now.getTime())}::uuid, ${i.referrerUserId}::uuid, ${i.refereeUserId}::uuid, ${i.period}, ${scope.now})
      ON CONFLICT DO NOTHING`;
    return n === 1;
  }

  async available(scope: TxScope | null, userId: string) {
    const c = scope ? txOf(scope) : this.db;
    return c.referralReward.findFirst({ where: { referrerUserId: userId, consumedSeatId: null }, orderBy: { createdAt: 'asc' }, select: { id: true } });
  }

  async periodOf(scope: TxScope | null, userId: string, at: Date) {
    const c = scope ? txOf(scope) : this.db;
    const tz = (await c.user.findUnique({ where: { id: userId }, select: { timezone: true } }))?.timezone ?? 'Europe/Paris';
    return civilMonthOf(at, tz);
  }

  async usedThisPeriod(userId: string, period: string) {
    return (await this.db.referralReward.count({ where: { referrerUserId: userId, period } })) > 0;
  }

  async consume(scope: TxScope, rewardId: string, seatId: string) {
    const r = await txOf(scope).referralReward.updateMany({ where: { id: rewardId, consumedSeatId: null }, data: { consumedSeatId: seatId, consumedAt: scope.now } });
    return r.count === 1;
  }

  async release(scope: TxScope, seatId: string) {
    const r = await txOf(scope).referralReward.updateMany({ where: { consumedSeatId: seatId }, data: { consumedSeatId: null, consumedAt: null } });
    return r.count === 1;
  }
}
