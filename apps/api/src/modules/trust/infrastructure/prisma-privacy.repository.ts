/**
 * Persistance export / suppression. `collectOwnData` ne sélectionne QUE les données de
 * l'utilisateur ou visibles de lui-même : jamais les votes (BranchBallot) d'autrui, les
 * messages d'autrui, les répondants anonymes (visitorTokenHash exclu), ni les médias d'autrui.
 * `eraseUser` : anonymisation (User DELETED, identités et sessions supprimées), purge des
 * contenus privés (corps de messages, médias, IA, positions), conservation minimale justifiée
 * (ledger append-only, décisions de modération sans contenu, audit).
 */
import { uuidv7, type Db } from '@blowy/database';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { PrivacyRepository } from '../application/privacy.use-cases.js';

export class PrismaPrivacyRepository implements PrivacyRepository {
  constructor(private readonly db: Db) {}

  async createExport(scope: TxScope, id: string, userId: string) {
    await txOf(scope).dataExport.create({ data: { id, userId, requestedAt: scope.now } });
  }
  async openExport(userId: string) {
    return this.db.dataExport.findFirst({ where: { userId, status: { in: ['REQUESTED', 'RUNNING'] } }, select: { id: true } });
  }
  async loadExport(id: string) {
    return this.db.dataExport.findUnique({ where: { id } });
  }
  async listExports(userId: string) {
    return this.db.dataExport.findMany({ where: { userId }, orderBy: { requestedAt: 'desc' }, take: 10 });
  }
  async setExport(id: string, p: Parameters<PrivacyRepository['setExport']>[1]) {
    await this.db.dataExport.update({ where: { id }, data: p as never });
  }

  async collectOwnData(userId: string) {
    const u = await this.db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, email: true, birthDate: true, timezone: true, createdAt: true, onboardedAt: true, reliability: true,
        profile: { select: { displayName: true, gender: true, publicSlug: true } },
        matchPreferences: true,
        privacySettings: true,
        processingConsents: { select: { purpose: true, version: true, granted: true, createdAt: true } },
        pausePeriods: { select: { startsAt: true, endsAt: true, contextId: true } },
        verificationSessions: { select: { kind: true, provenance: true, status: true, createdAt: true, expiresAt: true } },
        primaryPet: { select: { id: true, name: true, species: true, stage: true, createdAt: true, vision: true } },
        wallet: { select: { balance: true, entries: { select: { amount: true, reason: true, createdAt: true }, orderBy: { createdAt: 'asc' } } } },
        reportsMade: { select: { category: true, safetyExit: true, status: true, createdAt: true } },
        blocksMade: { select: { createdAt: true, blocked: { select: { primaryPet: { select: { name: true } } } } } },
        // Mon propre vote seulement (jamais celui de l'autre).
        branchBallots: { select: { choice: true, createdAt: true } },
        mediaAssets: { where: { status: { not: 'PURGED' } }, select: { id: true, purpose: true, status: true, createdAt: true, purgeAfter: true } },
        // Mots reçus sans identité de répondant.
        anonymousResponses: { select: { words: true, createdAt: true } },
      },
    });
    // Seulement MES messages (corps compris) ; ceux d'autrui ne sont pas exportés.
    const messages = await this.db.message.findMany({ where: { authorUserId: userId, kind: { not: 'SYSTEM' } }, select: { conversationId: true, kind: true, status: true, createdAt: true, content: { select: { body: true, purgedAt: true } } }, orderBy: { createdAt: 'asc' } });
    const relationships = await this.db.relationshipSide.findMany({ where: { userId }, select: { context: { select: { id: true, type: true, status: true, branch: true, reachedLevel: true, startedAt: true, endedAt: true } } } });
    return {
      account: { id: u.id, email: u.email, birthDate: u.birthDate?.toISOString().slice(0, 10) ?? null, timezone: u.timezone, createdAt: u.createdAt, onboardedAt: u.onboardedAt, reliability: u.reliability },
      profile: u.profile,
      preferences: u.matchPreferences ? { ...u.matchPreferences, areaCellLat: undefined, areaCellLng: undefined } : null,
      privacy: u.privacySettings,
      consents: u.processingConsents,
      pauses: u.pausePeriods,
      verifications: u.verificationSessions,
      pet: u.primaryPet,
      wallet: u.wallet,
      reportsMade: u.reportsMade,
      blocks: u.blocksMade.map((b) => ({ createdAt: b.createdAt, petName: b.blocked.primaryPet?.name ?? null })),
      myBallots: u.branchBallots,
      media: u.mediaAssets,
      anonymousWordsReceived: u.anonymousResponses,
      myMessages: messages.map((m) => ({ conversationId: m.conversationId, kind: m.kind, status: m.status, createdAt: m.createdAt, body: m.content && !m.content.purgedAt ? m.content.body : null })),
      relationships: relationships.map((r) => r.context),
    };
  }

  async createDeletion(scope: TxScope, d: { id: string; userId: string; purgeAfter: Date; backupPurgeAfter: Date }) {
    await txOf(scope).deletionRequest.create({ data: { id: d.id, userId: d.userId, status: 'REVOKING', requestedAt: scope.now, purgeAfter: d.purgeAfter, backupPurgeAfter: d.backupPurgeAfter } });
  }
  async openDeletion(userId: string) {
    return this.db.deletionRequest.findFirst({ where: { userId }, orderBy: { requestedAt: 'desc' }, select: { id: true, status: true, requestedAt: true, purgeAfter: true, backupPurgeAfter: true } });
  }

  async revokeAccess(scope: TxScope, userId: string) {
    const tx = txOf(scope);
    await tx.deviceSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: scope.now, pushToken: null } });
    await tx.deviceSession.updateMany({ where: { userId }, data: { pushToken: null } });
    await tx.user.update({ where: { id: userId }, data: { status: 'DELETED', deletedAt: scope.now } });
    await tx.profile.updateMany({ where: { userId }, data: { slugEnabled: false } });
    await tx.referralLink.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: scope.now } });
    await tx.matchProposal.updateMany({ where: { status: 'OPEN', OR: [{ userLowId: userId }, { userHighId: userId }] }, data: { status: 'INVALIDATED', resolvedAt: scope.now } });
    await tx.pet.updateMany({ where: { primaryOwnerId: userId }, data: { matchable: false } });
    await tx.mediaAccessToken.updateMany({ where: { revokedAt: null, OR: [{ viewerId: userId }, { asset: { ownerUserId: userId } }] }, data: { revokedAt: scope.now } });
    await tx.dataExport.updateMany({ where: { userId }, data: { downloadNonce: null } });
    await tx.conversationMember.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: scope.now } });
    await tx.notification.updateMany({ where: { userId, status: 'QUEUED' }, data: { status: 'SUPPRESSED' } });
  }

  async liveContextIds(scope: TxScope, userId: string) {
    const rows = await txOf(scope).relationshipContext.findMany({ where: { status: { not: 'ENDED' }, sides: { some: { userId } } }, select: { id: true, sides: { select: { petId: true, userId: true } } } });
    return rows.map((r) => ({ id: r.id, petIds: r.sides.map((s) => s.petId), userIds: r.sides.map((s) => s.userId) }));
  }

  async dueDeletions(now: Date, limit: number) {
    return this.db.deletionRequest.findMany({ where: { status: { in: ['REVOKING', 'PURGING'] }, purgeAfter: { lte: now } }, select: { id: true, userId: true }, take: limit });
  }

  async eraseUser(userId: string, now: Date) {
    const db = this.db;
    await db.deletionRequest.updateMany({ where: { userId, status: 'REVOKING' }, data: { status: 'PURGING' } });
    const assets = await db.mediaAsset.findMany({ where: { ownerUserId: userId, status: { not: 'PURGED' } }, include: { derivatives: true } });
    const storageKeys = assets.flatMap((a) => [a.storageKey, ...a.derivatives.map((d) => d.storageKey)]);
    const stats: Record<string, number> = {};
    stats.media = (await db.mediaAsset.updateMany({ where: { ownerUserId: userId, status: { not: 'PURGED' } }, data: { status: 'PURGED', purgedAt: now } })).count;
    await db.mediaDerivative.deleteMany({ where: { asset: { ownerUserId: userId } } });
    await db.mediaAccessToken.deleteMany({ where: { OR: [{ viewerId: userId }, { asset: { ownerUserId: userId } }] } });
    const msgIds = (await db.message.findMany({ where: { authorUserId: userId }, select: { id: true } })).map((m) => m.id);
    stats.messageBodies = (await db.messageContent.updateMany({ where: { messageId: { in: msgIds }, purgedAt: null }, data: { body: '', purgedAt: now } })).count;
    // Messages non publiés de l'auteur : jamais livrés, retirés.
    await db.message.updateMany({ where: { id: { in: msgIds }, status: { in: ['PENDING_MODERATION', 'HUMAN_REVIEW', 'PROCESSING_FAILED'] } }, data: { status: 'WITHDRAWN', decidedAt: now } });
    const jobs = await db.aIJob.findMany({ where: { userId }, select: { id: true } });
    stats.aiResults = (await db.aIResult.deleteMany({ where: { jobId: { in: jobs.map((j) => j.id) } } })).count;
    await db.aIJob.updateMany({ where: { userId }, data: { userId: null, contextId: null } });
    stats.suggestions = (await db.suggestion.deleteMany({ where: { userId } })).count;
    await db.missionProofAssessment.updateMany({ where: { userId }, data: { assessment: undefined, status: 'REJECTED' } });
    await db.report.updateMany({ where: { reporterId: userId }, data: { note: null } });
    await db.authIdentity.deleteMany({ where: { userId } });
    await db.deviceSession.deleteMany({ where: { userId } });
    await db.processingConsent.deleteMany({ where: { userId } });
    await db.matchPreferences.deleteMany({ where: { userId } });
    await db.notification.deleteMany({ where: { userId } });
    await db.projectionEntry.deleteMany({ where: { recipientId: userId } });
    await db.profile.updateMany({ where: { userId }, data: { displayName: 'Compte supprimé', publicSlug: null, slugEnabled: false } });
    await db.verificationSession.updateMany({ where: { userId }, data: { providerRef: null, providerSessionUrl: null } });
    await db.user.update({ where: { id: userId }, data: { email: null, emailVerified: false, birthDate: null, status: 'DELETED', deletedAt: now, lastActiveAt: null } });
    void uuidv7;
    return { storageKeys, stats };
  }

  async completeDeletion(id: string, now: Date, stats: Record<string, number>) {
    await this.db.deletionRequest.update({ where: { id }, data: { status: 'COMPLETED', completedAt: now, stats } });
  }
  async expiredExports(now: Date) {
    return this.db.dataExport.findMany({ where: { status: 'READY', expiresAt: { lte: now } }, select: { id: true, storageKey: true } });
  }
}
