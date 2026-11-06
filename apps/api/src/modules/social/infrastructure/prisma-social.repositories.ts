/**
 * Adapters Prisma du module social (réponses anonymes, parrainage).
 * CONTOURNEMENT SCHÉMA (handoff F) : l'anti-rejeu du jeton de formulaire est stocké comme
 * `CommandRecord(actorId = cible, operation = 'social.anon_form_nonce', commandId = uuid(nonce))`
 * (unique) faute de table dédiée ; aucune IP ni empreinte de navigateur n'est stockée.
 */
import { createHash } from 'node:crypto';
import { uuidv7, type Db } from '@blowy/database';
import type { Species } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { decodeCursor, pageFrom } from '../../../shared/application/pagination.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { aggregateWords } from '../domain/anonymous.js';
import type { AnonymousRepository, QuotaCounter, ReferralRepository } from '../application/ports/social.ports.js';

function uuidFromKey(key: string): string {
  const h = createHash('sha256').update(key).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-${((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export class PrismaAnonymousRepository implements AnonymousRepository {
  constructor(private readonly db: Db) {}

  async findTargetBySlug(slug: string) {
    const p = await this.db.profile.findUnique({
      where: { publicSlug: slug },
      select: { userId: true, publicSlug: true, displayName: true, slugEnabled: true, user: { select: { status: true, deletedAt: true, primaryPet: { select: { name: true, species: true, stage: true } } } } },
    });
    if (!p || !p.publicSlug || p.user.deletedAt) return null;
    return {
      userId: p.userId,
      slug: p.publicSlug,
      displayName: p.displayName,
      enabled: p.slugEnabled,
      status: p.user.status,
      pet: p.user.primaryPet ? { name: p.user.primaryPet.name, species: p.user.primaryPet.species as Species, stage: p.user.primaryPet.stage } : null,
    };
  }

  async consumeNonce(scope: TxScope, targetUserId: string, nonce: string) {
    const n = await txOf(scope).$executeRaw`INSERT INTO "CommandRecord" (id, "actorId", operation, "commandId", "payloadHash", status, "createdAt", "completedAt")
      VALUES (${uuidv7(scope.now.getTime())}::uuid, ${targetUserId}::uuid, 'social.anon_form_nonce', ${uuidFromKey(`anon-nonce:${nonce}`)}::uuid, 'nonce', 'COMPLETED', ${scope.now}, ${scope.now})
      ON CONFLICT ("actorId", operation, "commandId") DO NOTHING`;
    return n === 1;
  }

  async insert(scope: TxScope, r: { id: string; targetUserId: string; words: string[]; visitorTokenHash: string }) {
    const n = await txOf(scope).$executeRaw`INSERT INTO "AnonymousResponse" (id, "targetUserId", words, "visitorTokenHash", "createdAt")
      VALUES (${r.id}::uuid, ${r.targetUserId}::uuid, ${r.words}::text[], ${r.visitorTokenHash}, ${scope.now})
      ON CONFLICT ("targetUserId", "visitorTokenHash") DO NOTHING`;
    return n === 1 ? ('CREATED' as const) : ('DUPLICATE' as const);
  }

  countForTargetSince(scope: TxScope, targetUserId: string, since: Date): Promise<number> {
    return txOf(scope).anonymousResponse.count({ where: { targetUserId, createdAt: { gte: since } } });
  }

  async recomputeReputation(scope: TxScope, targetUserId: string, scoreMilli: (words: number) => number) {
    const tx = txOf(scope);
    const visible = await tx.anonymousResponse.findMany({ where: { targetUserId, hiddenAt: null, reportedAt: null }, select: { words: true } });
    const agg = aggregateWords(visible);
    const data = { wordCounts: agg.wordCounts, respondents: agg.respondents, scoreMilli: scoreMilli(agg.totalWords) };
    await tx.reputationAggregate.upsert({ where: { userId: targetUserId }, create: { userId: targetUserId, ...data }, update: data });
  }

  async listOwn(userId: string, cursor: string | undefined, limit: number) {
    const c = decodeCursor(cursor);
    const rows = await this.db.anonymousResponse.findMany({
      where: { targetUserId: userId, ...(c ? { id: { lt: String(c[0]) } } : {}) },
      orderBy: { id: 'desc' },
      take: limit + 1,
      // Jamais l'empreinte visiteur.
      select: { id: true, words: true, createdAt: true, hiddenAt: true, reportedAt: true },
    });
    return pageFrom(rows, limit, (r) => [r.id]);
  }

  async ownPage(userId: string) {
    const p = await this.db.profile.findUnique({ where: { userId }, select: { publicSlug: true, slugEnabled: true } });
    return { slug: p?.publicSlug ?? null, enabled: p?.slugEnabled ?? false };
  }

  async pageOwner(scope: TxScope, userId: string) {
    const p = await txOf(scope).profile.findUnique({ where: { userId }, select: { displayName: true, publicSlug: true } });
    return p ? { displayName: p.displayName, slug: p.publicSlug } : null;
  }

  async assignSlug(scope: TxScope, userId: string, slug: string) {
    const tx = txOf(scope);
    if (await tx.profile.findUnique({ where: { publicSlug: slug }, select: { userId: true } })) return false;
    const r = await tx.profile.updateMany({ where: { userId, publicSlug: null }, data: { publicSlug: slug } });
    return r.count === 1;
  }

  async setPageEnabled(scope: TxScope, userId: string, enabled: boolean) {
    const p = await txOf(scope).profile.update({ where: { userId }, data: { slugEnabled: enabled }, select: { publicSlug: true } });
    return { slug: p.publicSlug };
  }

  async hideOwn(scope: TxScope, userId: string, responseId: string) {
    const r = await txOf(scope).anonymousResponse.updateMany({ where: { id: responseId, targetUserId: userId }, data: { hiddenAt: scope.now } });
    return r.count === 1;
  }

  async reportOwn(scope: TxScope, userId: string, responseId: string) {
    const r = await txOf(scope).anonymousResponse.updateMany({ where: { id: responseId, targetUserId: userId }, data: { reportedAt: scope.now, hiddenAt: scope.now } });
    return r.count === 1;
  }

  async hideAny(scope: TxScope, responseId: string) {
    const r = await txOf(scope).anonymousResponse.findUnique({ where: { id: responseId }, select: { targetUserId: true } });
    if (!r) return null;
    await txOf(scope).anonymousResponse.update({ where: { id: responseId }, data: { hiddenAt: scope.now } });
    return { targetUserId: r.targetUserId };
  }
}

export class PrismaReferralRepository implements ReferralRepository {
  constructor(private readonly db: Db) {}

  async activeLink(userId: string, now: Date) {
    // Marge de 24 h : un lien qui expire demain est renouvelé (le partage reste valide).
    const l = await this.db.referralLink.findFirst({ where: { userId, revokedAt: null, expiresAt: { gt: new Date(now.getTime() + 86_400_000) } }, orderBy: { createdAt: 'desc' } });
    return l ? { id: l.id, code: l.code, expiresAt: l.expiresAt } : null;
  }

  async createLink(scope: TxScope, l: { id: string; userId: string; code: string; expiresAt: Date }) {
    const n = await txOf(scope).$executeRaw`INSERT INTO "ReferralLink" (id, "userId", code, "expiresAt", "createdAt") VALUES (${l.id}::uuid, ${l.userId}::uuid, ${l.code}, ${l.expiresAt}, ${scope.now}) ON CONFLICT (code) DO NOTHING`;
    return n === 1;
  }

  async findLinkByCode(scope: TxScope | null, code: string) {
    return (scope ? txOf(scope) : this.db).referralLink.findUnique({ where: { code }, select: { id: true, userId: true, code: true, expiresAt: true, revokedAt: true, createdAt: true } });
  }

  async inviterPreview(userId: string) {
    const u = await this.db.user.findUnique({ where: { id: userId }, select: { status: true, profile: { select: { displayName: true } }, primaryPet: { select: { name: true, species: true } } } });
    if (!u || u.status !== 'ACTIVE' || !u.profile) return null;
    return { displayName: u.profile.displayName, petName: u.primaryPet?.name ?? null, species: (u.primaryPet?.species as Species | undefined) ?? null };
  }

  async userOnboardedAt(scope: TxScope, userId: string) {
    return (await txOf(scope).user.findUnique({ where: { id: userId }, select: { onboardedAt: true } }))?.onboardedAt ?? null;
  }

  async claimOf(scope: TxScope | null, refereeUserId: string) {
    const c = await (scope ? txOf(scope) : this.db).referralClaim.findUnique({ where: { refereeUserId } });
    return c ? { id: c.id, status: c.status, referrerUserId: c.referrerUserId, claimedAt: c.claimedAt, rewardedAt: c.rewardedAt } : null;
  }

  async createClaim(scope: TxScope, c: { id: string; linkId: string; referrerUserId: string; refereeUserId: string }) {
    const n = await txOf(scope).$executeRaw`INSERT INTO "ReferralClaim" (id, "linkId", "referrerUserId", "refereeUserId", status, "claimedAt") VALUES (${c.id}::uuid, ${c.linkId}::uuid, ${c.referrerUserId}::uuid, ${c.refereeUserId}::uuid, 'PENDING_ACTIVATION', ${scope.now}) ON CONFLICT ("refereeUserId") DO NOTHING`;
    return n === 1 ? ('CREATED' as const) : ('EXISTS' as const);
  }

  async pendingClaims(limit: number) {
    const rows = await this.db.referralClaim.findMany({ where: { status: 'PENDING_ACTIVATION' }, orderBy: { claimedAt: 'asc' }, take: limit, select: { refereeUserId: true } });
    return rows.map((r) => r.refereeUserId);
  }

  async activationFacts(scope: TxScope, userId: string, now: Date) {
    const tx = txOf(scope);
    const u = await tx.user.findUnique({ where: { id: userId }, select: { status: true, birthDate: true, primaryPet: { select: { id: true } }, verificationSessions: { select: { provenance: true, status: true } } } });
    if (!u) return { accountActive: false, adult: false, hasPrimaryPet: false, verifications: [], hasFirstAction: false };
    const adultBefore = new Date(Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate()));
    // Première action valide : un soin/jeu enregistré par le moteur, une contribution relationnelle ou un message publié.
    const [care, contrib, msg] = await Promise.all([
      tx.petCareEvent.count({ where: { actorUserId: userId }, take: 1 }),
      tx.contributionEvent.count({ where: { userId }, take: 1 }),
      tx.message.count({ where: { authorUserId: userId, status: 'PUBLISHED' }, take: 1 }),
    ]);
    return {
      accountActive: u.status === 'ACTIVE',
      adult: !!u.birthDate && u.birthDate <= adultBefore,
      hasPrimaryPet: !!u.primaryPet,
      verifications: u.verificationSessions.map((v) => ({ provenance: v.provenance, status: v.status })),
      hasFirstAction: care + contrib + msg > 0,
    };
  }

  async markRewarded(scope: TxScope, claimId: string, at: Date) {
    const r = await txOf(scope).referralClaim.updateMany({ where: { id: claimId, status: 'PENDING_ACTIVATION' }, data: { status: 'REWARDED', rewardedAt: at } });
    return r.count === 1;
  }

  async markRejected(scope: TxScope, claimId: string) {
    const r = await txOf(scope).referralClaim.updateMany({ where: { id: claimId, status: 'PENDING_ACTIVATION' }, data: { status: 'REJECTED' } });
    return r.count === 1;
  }

  async referrerActive(scope: TxScope, userId: string) {
    const u = await txOf(scope).user.findUnique({ where: { id: userId }, select: { status: true } });
    return !!u && u.status !== 'BANNED' && u.status !== 'DELETED';
  }
}

/** Compteur de quotas : délègue au limiteur partagé (Redis ou mémoire). */
export class RateLimiterQuota implements QuotaCounter {
  constructor(private readonly limiter: { hit(key: string, windowSec: number): Promise<number> }) {}
  hit(key: string, windowSec: number) {
    return this.limiter.hit(`social:${key}`, windowSec);
  }
}
