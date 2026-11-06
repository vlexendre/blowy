import { isUniqueViolation, type Db } from '@blowy/database';
import type { Clock } from '../../../shared/application/clock.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { MediaRepository, MediaRow, ProofRow, RelationFacts } from '../application/ports/media.ports.js';

type C = Db | ReturnType<typeof txOf>;
const inc = { derivatives: { select: { kind: true, storageKey: true, width: true, height: true } } } as const;
const toRow = (a: Record<string, unknown>) => a as unknown as MediaRow;

export class PrismaMediaRepository implements MediaRepository {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}
  private c(scope: TxScope | null): C {
    return scope ? txOf(scope) : this.db;
  }

  async create(scope: TxScope, m: Parameters<MediaRepository['create']>[1]) {
    await txOf(scope).mediaAsset.create({ data: { id: m.id, ownerUserId: m.ownerUserId, purpose: m.purpose, storageKey: m.storageKey, declaredMime: m.declaredMime, maxBytes: m.maxBytes, contextId: m.contextId, retentionClass: m.retentionClass, retentionVersion: m.retentionVersion, uploadExpiresAt: m.uploadExpiresAt, createdAt: scope.now } });
  }
  async load(scope: TxScope | null, id: string) {
    const a = await this.c(scope).mediaAsset.findUnique({ where: { id }, include: inc });
    return a ? toRow(a) : null;
  }
  async update(scope: TxScope | null, id: string, patch: Parameters<MediaRepository['update']>[2]) {
    await this.c(scope).mediaAsset.update({ where: { id }, data: patch as never });
  }
  async addDerivative(id: string, d: Parameters<MediaRepository['addDerivative']>[1]) {
    await this.db.mediaDerivative.upsert({ where: { assetId_kind: { assetId: id, kind: d.kind } }, create: { assetId: id, ...d }, update: { storageKey: d.storageKey, width: d.width, height: d.height } });
  }
  async deleteDerivatives(id: string) {
    const ds = await this.db.mediaDerivative.findMany({ where: { assetId: id }, select: { storageKey: true } });
    await this.db.mediaDerivative.deleteMany({ where: { assetId: id } });
    return ds.map((d) => d.storageKey);
  }
  async currentProfilePhoto(userId: string) {
    const a = await this.db.mediaAsset.findFirst({ where: { ownerUserId: userId, purpose: 'PROFILE_PHOTO', status: 'READY' }, orderBy: { finalizedAt: 'desc' }, include: inc });
    return a ? toRow(a) : null;
  }
  async supersedeProfilePhotos(userId: string, keepId: string, purgeAfter: Date) {
    await this.db.mediaAsset.updateMany({ where: { ownerUserId: userId, purpose: 'PROFILE_PHOTO', id: { not: keepId }, purgeAfter: null, status: { not: 'PURGED' } }, data: { purgeAfter } });
    await this.db.mediaAccessToken.updateMany({ where: { revokedAt: null, asset: { ownerUserId: userId, purpose: 'PROFILE_PHOTO', id: { not: keepId } } }, data: { revokedAt: this.clock.now() } });
  }
  async sameHashCount(ownerUserId: string, sha256: string, excludeId: string) {
    return this.db.mediaAsset.count({ where: { ownerUserId, sha256, id: { not: excludeId }, purpose: 'MISSION_PROOF' } });
  }
  async duePurges(now: Date, limit: number) {
    const rows = await this.db.mediaAsset.findMany({ where: { purgeAfter: { lte: now }, status: { not: 'PURGED' } }, include: inc, take: limit });
    return rows.map(toRow);
  }
  async abandonedUploads(now: Date, limit: number) {
    const rows = await this.db.mediaAsset.findMany({ where: { status: 'UPLOAD_PENDING', uploadExpiresAt: { lt: new Date(now.getTime() - 86_400_000) } }, include: inc, take: limit });
    return rows.map(toRow);
  }

  async createToken(t: Parameters<MediaRepository['createToken']>[0]) {
    await this.db.mediaAccessToken.create({ data: t });
  }
  async findToken(tokenHash: string) {
    return this.db.mediaAccessToken.findUnique({ where: { tokenHash }, select: { id: true, assetId: true, viewerId: true, variant: true, expiresAt: true, revokedAt: true } });
  }
  async revokeTokensFor(assetId: string) {
    await this.db.mediaAccessToken.updateMany({ where: { assetId, revokedAt: null }, data: { revokedAt: this.clock.now() } });
  }

  async createProof(scope: TxScope, p: Parameters<MediaRepository['createProof']>[1]) {
    await txOf(scope).missionProofAssessment.create({ data: { ...p, status: 'PENDING', createdAt: scope.now } });
  }
  private toProof(p: Record<string, unknown> | null): ProofRow | null {
    return p as unknown as ProofRow | null;
  }
  async proofByMedia(scope: TxScope | null, mediaId: string) {
    return this.toProof(await this.c(scope).missionProofAssessment.findUnique({ where: { mediaId } }));
  }
  async loadProof(scope: TxScope | null, id: string) {
    return this.toProof(await this.c(scope).missionProofAssessment.findUnique({ where: { id } }));
  }
  async updateProof(scope: TxScope, id: string, patch: Parameters<MediaRepository['updateProof']>[2]) {
    await txOf(scope).missionProofAssessment.update({ where: { id }, data: patch as never });
  }
  async claimReward(scope: TxScope, proofId: string, rewardKey: string) {
    try {
      const n = await txOf(scope).missionProofAssessment.updateMany({ where: { id: proofId, rewardKey: null }, data: { rewardKey, rewardEmittedAt: scope.now } });
      return n.count === 1;
    } catch (e) {
      if (isUniqueViolation(e)) return false;
      throw e;
    }
  }

  async relationFacts(scope: TxScope | null, contextId: string, at: Date): Promise<RelationFacts | null> {
    const c = await this.c(scope).relationshipContext.findUnique({ where: { id: contextId }, include: { sides: true, conversation: { select: { id: true } }, pauses: { where: { endedAt: null, startsAt: { lte: at }, endsAt: { gt: at } } } } });
    if (!c) return null;
    const userIds = c.sides.map((s) => s.userId);
    const prefs = await this.c(scope).privacySettings.findMany({ where: { userId: { in: userIds } } });
    const globalPauses = await this.c(scope).pausePeriod.count({ where: { userId: { in: userIds }, contextId: null, endedAt: null, startsAt: { lte: at }, endsAt: { gt: at } } });
    const photoPrefs = new Map<string, 'FROM_LEVEL_4_WITH_CONSENT' | 'NEVER'>(userIds.map((u) => [u, prefs.find((p) => p.userId === u)?.photoPreference ?? 'FROM_LEVEL_4_WITH_CONSENT']));
    return {
      id: c.id,
      status: c.status,
      branch: c.branch,
      reachedLevel: c.reachedLevel,
      movedIn: !!c.movedInAt && c.status !== 'ENDED',
      paused: c.pauses.length > 0 || globalPauses > 0,
      participants: userIds,
      activeParticipants: c.sides.filter((s) => s.active).map((s) => s.userId),
      timezone: c.timezone,
      photoPrefs,
      conversationId: c.conversation?.id ?? null,
    };
  }
  async viewerFirstName(userId: string) {
    return (await this.db.profile.findUnique({ where: { userId }, select: { displayName: true } }))?.displayName ?? '';
  }
  async photoPreference(userId: string) {
    return (await this.db.privacySettings.findUnique({ where: { userId } }))?.photoPreference ?? 'FROM_LEVEL_4_WITH_CONSENT';
  }
  async acceptedConsent(contextId: string, scope: 'PHOTO_REVEAL' | 'PHOTO_ORIGINAL') {
    const s = await this.db.consentSession.findFirst({ where: { contextId, scope }, orderBy: { version: 'desc' }, select: { status: true } });
    return s?.status === 'ACCEPTED';
  }
  async isBlockedBetween(a: string, b: string) {
    return (await this.db.block.count({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } })) > 0;
  }
  async voiceDeliverableTo(mediaId: string, viewerId: string) {
    const m = await this.db.message.findFirst({ where: { mediaId, kind: 'VOICE' }, include: { conversation: { include: { members: true } }, receipts: { where: { userId: viewerId } } } });
    if (!m) return false;
    const member = m.conversation.members.find((x) => x.userId === viewerId);
    if (!member || member.revokedAt || m.conversation.closedAt) return false;
    if (m.status === 'PUBLISHED') return true;
    return m.status === 'WARNED' && m.receipts.some((r) => r.revealedAt);
  }
  async voiceAlreadyUsed(mediaId: string) {
    return (await this.db.message.count({ where: { mediaId } })) > 0;
  }
  async aiConsent(userId: string, purpose: string) {
    const c = await this.db.processingConsent.findFirst({ where: { userId, purpose }, orderBy: { createdAt: 'desc' } });
    return !!c?.granted;
  }

  async revealState(contextId: string, scope: 'PHOTO_REVEAL' | 'PHOTO_ORIGINAL', viewerId: string, at: Date) {
    const s = await this.db.consentSession.findFirst({ where: { contextId, scope }, orderBy: { version: 'desc' }, include: { responses: true } });
    if (!s) return null;
    const status = s.status === 'OPEN' && s.expiresAt <= at ? 'EXPIRED' : s.status;
    const responses = s.responses.map((r) => ({ userId: r.userId, decision: r.decision }));
    return { id: s.id, status, version: s.version, myDecision: responses.find((r) => r.userId === viewerId)?.decision ?? null, responses };
  }
  async openRevealOffer(scope: TxScope, o: Parameters<MediaRepository['openRevealOffer']>[1]) {
    const tx = txOf(scope);
    const agg = await tx.consentSession.aggregate({ where: { contextId: o.contextId, scope: o.scope }, _max: { version: true } });
    const version = (agg._max.version ?? 0) + 1;
    await tx.consentSession.updateMany({ where: { contextId: o.contextId, scope: o.scope, status: 'OPEN' }, data: { status: 'SUPERSEDED', resolvedAt: scope.now } });
    await tx.consentSession.create({ data: { id: o.id, contextId: o.contextId, scope: o.scope, version, proposedBy: o.proposedBy, expiresAt: o.expiresAt, createdAt: scope.now } });
    return { id: o.id, version };
  }
  async respondReveal(scope: TxScope, offerId: string, userId: string, decision: 'ACCEPT' | 'DECLINE') {
    await txOf(scope).consentResponse.upsert({ where: { sessionId_userId: { sessionId: offerId, userId } }, create: { sessionId: offerId, userId, decision, createdAt: scope.now }, update: { decision } });
  }
  async setOfferStatus(scope: TxScope, offerId: string, status: 'ACCEPTED' | 'DECLINED') {
    await txOf(scope).consentSession.update({ where: { id: offerId }, data: { status, resolvedAt: scope.now } });
  }
  async lockedOpenOffer(scope: TxScope, contextId: string, offerScope: 'PHOTO_REVEAL' | 'PHOTO_ORIGINAL', at: Date) {
    const tx = txOf(scope);
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "ConsentSession" WHERE "contextId" = ${contextId}::uuid AND scope = ${offerScope}::"ConsentScope" AND status = 'OPEN' AND "expiresAt" > ${at} ORDER BY version DESC LIMIT 1 FOR UPDATE`;
    if (!rows[0]) return null;
    const s = await tx.consentSession.findUniqueOrThrow({ where: { id: rows[0].id }, include: { responses: true } });
    return { id: s.id, version: s.version, responses: s.responses.map((r) => ({ userId: r.userId, decision: r.decision })) };
  }
}
