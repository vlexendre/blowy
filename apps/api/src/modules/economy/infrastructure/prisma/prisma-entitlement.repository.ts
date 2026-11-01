import { uuidv7, type Db } from '@blowy/database';
import type { SubscriptionState } from '@blowy/domain';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import { txOf } from '../../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { BLOWY_PLUS_ENTITLEMENT, type BillingEnvironment, type DerivedGrantDraft, type GrantRecord, type SubscriptionRecord } from '../../domain/index.js';
import type { EntitlementRepository, SubscriptionUpsert } from '../../application/ports/entitlement.repository.js';

type SubRow = {
  id: string; userId: string; provider: string; environment: string; entitlementId: string; state: string; productId: string | null; store: string | null;
  periodType: string | null; currentPeriodEndsAt: Date | null; gracePeriodEndsAt: Date | null; lastProviderEventAt: Date | null; lastReconciledAt: Date | null; version: number;
};
const toSub = (r: SubRow): SubscriptionRecord => ({
  ...r,
  provider: r.provider as SubscriptionRecord['provider'],
  environment: r.environment as BillingEnvironment,
  state: r.state as SubscriptionState,
});
type GrantRow = Omit<GrantRecord, 'source' | 'environment'> & { source: string; environment: string };
const toGrant = (r: GrantRow): GrantRecord => ({ ...r, source: r.source as GrantRecord['source'], environment: r.environment as BillingEnvironment });
const grantSelect = {
  id: true, beneficiaryUserId: true, entitlementId: true, source: true, environment: true, subscriptionId: true,
  derivedFromUserId: true, relationshipId: true, startsAt: true, endsAt: true, revokedAt: true,
} as const;

export class PrismaEntitlementRepository implements EntitlementRepository {
  constructor(private readonly db: Db) {}

  async lockSubscriptions(scope: TxScope, userId: string): Promise<SubscriptionRecord[]> {
    const tx = txOf(scope);
    await tx.$queryRaw`SELECT 1 FROM "Subscription" WHERE "userId" = ${userId}::uuid ORDER BY id FOR UPDATE`;
    return (await tx.subscription.findMany({ where: { userId } })).map(toSub);
  }

  async upsertSubscription(scope: TxScope, d: SubscriptionUpsert): Promise<SubscriptionRecord> {
    const tx = txOf(scope);
    const key = { userId_provider_environment_entitlementId: { userId: d.userId, provider: d.provider, environment: d.environment, entitlementId: d.entitlementId } };
    const stamps = {
      ...(d.lastProviderEventAt ? { lastProviderEventAt: d.lastProviderEventAt } : {}),
      ...(d.lastReconciledAt ? { lastReconciledAt: d.lastReconciledAt } : {}),
      ...(d.state === 'REFUNDED' ? { refundedAt: scope.now } : {}),
      ...(d.state === 'REVOKED' ? { revokedAt: scope.now } : {}),
      ...(d.state === 'CANCELLED_PENDING_EXPIRY' ? { cancelledAt: scope.now } : {}),
    };
    const fields = { state: d.state, productId: d.productId, store: d.store, periodType: d.periodType, currentPeriodEndsAt: d.currentPeriodEndsAt, gracePeriodEndsAt: d.gracePeriodEndsAt };
    const r = await tx.subscription.upsert({
      where: key,
      create: { id: uuidv7(scope.now.getTime()), userId: d.userId, provider: d.provider, environment: d.environment, entitlementId: d.entitlementId, startedAt: scope.now, ...fields, ...stamps },
      update: { ...fields, ...stamps, version: { increment: 1 } },
    });
    return toSub(r);
  }

  async listSubscriptions(userId: string): Promise<SubscriptionRecord[]> {
    return (await this.db.subscription.findMany({ where: { userId } })).map(toSub);
  }

  async listSubscriptionsToReconcile(now: Date, staleBefore: Date, limit: number): Promise<SubscriptionRecord[]> {
    // Échéance passée, jamais/anciennement réconcilié, ou touché par un webhook depuis la dernière réconciliation.
    const ids = await this.db.$queryRaw<{ id: string }[]>`
      SELECT id::text AS id FROM "Subscription"
      WHERE provider = 'REVENUECAT' AND (
        (state IN ('TRIAL','ACTIVE','GRACE_PERIOD','CANCELLED_PENDING_EXPIRY') AND (
          "currentPeriodEndsAt" <= ${now} OR "gracePeriodEndsAt" <= ${now} OR "lastReconciledAt" IS NULL OR "lastReconciledAt" < ${staleBefore}))
        OR ("lastProviderEventAt" IS NOT NULL AND ("lastReconciledAt" IS NULL OR "lastProviderEventAt" > "lastReconciledAt"))
      )
      ORDER BY "lastReconciledAt" ASC NULLS FIRST, id LIMIT ${limit}`;
    if (ids.length === 0) return [];
    return (await this.db.subscription.findMany({ where: { id: { in: ids.map((r) => r.id) } } })).map(toSub);
  }

  async listLiveGrants(userId: string, at: Date, scope?: TxScope): Promise<GrantRecord[]> {
    const client = scope ? txOf(scope) : this.db;
    const rows = await client.entitlementGrant.findMany({
      where: { beneficiaryUserId: userId, revokedAt: null, startsAt: { lte: at }, OR: [{ endsAt: null }, { endsAt: { gt: at } }] },
      select: grantSelect,
    });
    return rows.map(toGrant);
  }

  async upsertOwnGrant(scope: TxScope, sub: SubscriptionRecord, endsAt: Date | null, source: 'STORE_SUBSCRIPTION' | 'LOCAL_DEMO'): Promise<GrantRecord> {
    const tx = txOf(scope);
    const existing = await tx.entitlementGrant.findFirst({ where: { subscriptionId: sub.id, beneficiaryUserId: sub.userId, source, revokedAt: null }, select: grantSelect });
    if (existing) {
      const r = await tx.entitlementGrant.update({ where: { id: existing.id }, data: { endsAt }, select: grantSelect });
      return toGrant(r);
    }
    const r = await tx.entitlementGrant.create({
      data: { id: uuidv7(scope.now.getTime()), beneficiaryUserId: sub.userId, entitlementId: BLOWY_PLUS_ENTITLEMENT, source, environment: sub.environment, subscriptionId: sub.id, startsAt: scope.now, endsAt },
      select: grantSelect,
    });
    return toGrant(r);
  }

  async revokeOwnGrants(scope: TxScope, subscriptionId: string, reason: string): Promise<number> {
    const r = await txOf(scope).entitlementGrant.updateMany({
      where: { subscriptionId, source: { in: ['STORE_SUBSCRIPTION', 'LOCAL_DEMO'] }, revokedAt: null },
      data: { revokedAt: scope.now, revokeReason: reason },
    });
    return r.count;
  }

  async createDerivedGrant(scope: TxScope, d: DerivedGrantDraft): Promise<GrantRecord> {
    const r = await txOf(scope).entitlementGrant.create({
      data: {
        id: uuidv7(scope.now.getTime()),
        beneficiaryUserId: d.beneficiaryUserId,
        entitlementId: BLOWY_PLUS_ENTITLEMENT,
        source: 'DERIVED_PARTNER',
        environment: d.environment,
        derivedFromUserId: d.derivedFromUserId,
        relationshipId: d.relationshipId,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
      },
      select: grantSelect,
    });
    return toGrant(r);
  }

  private async revokeWhere(scope: TxScope, where: { derivedFromUserId?: string; relationshipId?: string }, reason: string): Promise<GrantRecord[]> {
    const tx = txOf(scope);
    const rows = await tx.entitlementGrant.findMany({ where: { ...where, source: 'DERIVED_PARTNER', revokedAt: null }, select: grantSelect });
    if (rows.length) await tx.entitlementGrant.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { revokedAt: scope.now, revokeReason: reason } });
    return rows.map(toGrant);
  }

  revokeDerivedFrom(scope: TxScope, holderUserId: string, reason: string) {
    return this.revokeWhere(scope, { derivedFromUserId: holderUserId }, reason);
  }

  revokeDerivedForRelationship(scope: TxScope, relationshipId: string, reason: string) {
    return this.revokeWhere(scope, { relationshipId }, reason);
  }

  async extendDerivedFrom(scope: TxScope, holderUserId: string, endsAt: Date | null): Promise<void> {
    await txOf(scope).entitlementGrant.updateMany({ where: { derivedFromUserId: holderUserId, source: 'DERIVED_PARTNER', revokedAt: null }, data: { endsAt } });
  }

  async listExpiredDerived(now: Date, limit: number): Promise<GrantRecord[]> {
    return (
      await this.db.entitlementGrant.findMany({ where: { source: 'DERIVED_PARTNER', revokedAt: null, endsAt: { lte: now } }, select: grantSelect, take: limit, orderBy: { endsAt: 'asc' } })
    ).map(toGrant);
  }

  async revokeGrant(scope: TxScope, grantId: string, reason: string): Promise<void> {
    await txOf(scope).entitlementGrant.updateMany({ where: { id: grantId, revokedAt: null }, data: { revokedAt: scope.now, revokeReason: reason } });
  }

  async insertMonthlyBenefit(scope: TxScope, d: { userId: string; period: string; subscriptionId: string; ledgerEntryId: string; freezesGranted: number; coinsGranted: number }): Promise<{ id: string } | null> {
    const id = uuidv7(scope.now.getTime());
    const n = await txOf(scope).$executeRaw`INSERT INTO "MonthlyBenefitGrant" (id, "userId", period, "subscriptionId", "ledgerEntryId", "freezesGranted", "coinsGranted", "createdAt")
      VALUES (${id}::uuid, ${d.userId}::uuid, ${d.period}, ${d.subscriptionId}::uuid, ${d.ledgerEntryId}::uuid, ${d.freezesGranted}, ${d.coinsGranted}, ${scope.now})
      ON CONFLICT ("userId", period) DO NOTHING`;
    return n === 1 ? { id } : null;
  }

  async hasMonthlyBenefit(scope: TxScope, userId: string, period: string): Promise<boolean> {
    return (await txOf(scope).monthlyBenefitGrant.count({ where: { userId, period } })) > 0;
  }

  async listMonthlyCandidates(period: string, environments: readonly BillingEnvironment[], limit: number, afterUserId: string | null) {
    const rows = await this.db.subscription.findMany({
      where: {
        state: { in: ['ACTIVE', 'GRACE_PERIOD', 'CANCELLED_PENDING_EXPIRY'] },
        environment: { in: [...environments] },
        entitlementId: BLOWY_PLUS_ENTITLEMENT,
        ...(afterUserId ? { userId: { gt: afterUserId } } : {}),
        user: { monthlyBenefits: { none: { period } } },
      },
      select: { userId: true, id: true, state: true },
      orderBy: { userId: 'asc' },
      distinct: ['userId'],
      take: limit,
    });
    return rows.map((r) => ({ userId: r.userId, subscriptionId: r.id, state: r.state as SubscriptionState }));
  }
}
