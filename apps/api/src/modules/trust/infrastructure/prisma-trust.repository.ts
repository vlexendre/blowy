import { isUniqueViolation, uuidv7, type Db } from '@blowy/database';
import type { Clock } from '../../../shared/application/clock.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { AiInvalidation, CaseRow, DecisionRow, TrustRepository, VerificationRow } from '../application/ports/trust.repository.js';

type C = Db | ReturnType<typeof txOf>;
const page = (after: { createdAt: Date; id: string } | null | undefined) => (after ? { OR: [{ createdAt: { lt: after.createdAt } }, { createdAt: after.createdAt, id: { lt: after.id } }] } : {});

export class PrismaTrustRepository implements TrustRepository {
  constructor(private readonly db: Db) {}
  private c(scope: TxScope | null): C {
    return scope ? txOf(scope) : this.db;
  }

  async targetFromRelationship(actorId: string, contextId: string) {
    const sides = await this.db.relationshipSide.findMany({ where: { contextId }, select: { userId: true } });
    if (!sides.some((s) => s.userId === actorId)) return null;
    return sides.find((s) => s.userId !== actorId)?.userId ?? null;
  }
  /**
   * Personne propriétaire d'un pet que l'acteur a PU VOIR (signaler/bloquer partout, §19, B4) :
   * relation partagée (même terminée), proposition de matching qui lui a été faite (quel que soit
   * son statut), ou conversation commune (chat de groupe). Sinon null → 404 neutre (anti-IDOR).
   */
  async targetFromPet(actorId: string, petId: string) {
    const side = await this.db.relationshipSide.findFirst({ where: { petId, context: { sides: { some: { userId: actorId } } } }, select: { userId: true } });
    if (side) return side.userId !== actorId ? side.userId : null;
    const proposal = await this.db.matchProposal.findFirst({
      where: { OR: [{ petLowId: petId, userHighId: actorId }, { petHighId: petId, userLowId: actorId }] },
      select: { userLowId: true, userHighId: true, petLowId: true },
    });
    if (proposal) return proposal.petLowId === petId ? proposal.userLowId : proposal.userHighId;
    const ownerId = (await this.db.pet.findUnique({ where: { id: petId }, select: { primaryOwnerId: true } }))?.primaryOwnerId;
    if (!ownerId || ownerId === actorId) return null;
    const shared = await this.db.conversationMember.findFirst({
      where: { userId: ownerId, conversation: { members: { some: { userId: actorId } } } },
      select: { id: true },
    });
    return shared ? ownerId : null;
  }
  async targetFromMessage(actorId: string, messageId: string) {
    const m = await this.db.message.findUnique({ where: { id: messageId }, select: { authorUserId: true, status: true, conversation: { select: { members: { select: { userId: true } } } } } });
    if (!m || !m.authorUserId || m.authorUserId === actorId) return null;
    if (!m.conversation.members.some((x) => x.userId === actorId)) return null;
    // Un destinataire ne peut désigner qu'un message qu'il a pu voir.
    if (m.status !== 'PUBLISHED' && m.status !== 'WARNED' && m.status !== 'WITHDRAWN') return null;
    return m.authorUserId;
  }
  async contextsBetween(scope: TxScope | null, a: string, b: string) {
    const rows = await this.c(scope).relationshipContext.findMany({ where: { AND: [{ sides: { some: { userId: a } } }, { sides: { some: { userId: b } } }] }, select: { id: true, status: true, sides: { select: { petId: true } } } });
    return rows.map((r) => ({ id: r.id, status: r.status, petIds: r.sides.map((s) => s.petId) }));
  }

  async insertBlock(scope: TxScope, blockerId: string, blockedId: string) {
    const tx = txOf(scope);
    const existing = await tx.block.findUnique({ where: { blockerId_blockedId: { blockerId, blockedId } } });
    if (existing) return { id: existing.id, created: false };
    const id = uuidv7(scope.now.getTime());
    await tx.block.create({ data: { id, blockerId, blockedId, createdAt: scope.now } });
    return { id, created: true };
  }
  async listBlocks(blockerId: string) {
    const rows = await this.db.block.findMany({ where: { blockerId }, orderBy: { createdAt: 'desc' }, include: { blocked: { select: { primaryPet: { select: { name: true } } } } } });
    return rows.map((r) => ({ id: r.id, blockedId: r.blockedId, petName: r.blocked.primaryPet?.name ?? null, createdAt: r.createdAt }));
  }

  /** Blocage atomique : propositions, amitiés, consentements, gardiens, partages de position, droits dérivés, coparentalité, jetons médias. */
  async applyBlockSideEffects(scope: TxScope, a: string, b: string, contextIds: string[]) {
    const tx = txOf(scope);
    const now = scope.now;
    const pair = { OR: [{ userLowId: a, userHighId: b }, { userLowId: b, userHighId: a }] };
    await tx.matchProposal.updateMany({ where: { status: 'OPEN', ...pair }, data: { status: 'INVALIDATED', resolvedAt: now } });
    await tx.friendship.updateMany({ where: { status: { not: 'WITHDRAWN' }, ...pair }, data: { status: 'WITHDRAWN', endedAt: now } });
    if (contextIds.length) {
      await tx.consentSession.updateMany({ where: { contextId: { in: contextIds }, status: 'OPEN' }, data: { status: 'CANCELLED', resolvedAt: now } });
      await tx.entitlementGrant.updateMany({ where: { relationshipId: { in: contextIds }, revokedAt: null }, data: { revokedAt: now, revokeReason: 'BLOCK' } });
      const dates = await tx.safetyDate.findMany({ where: { contextId: { in: contextIds } }, select: { id: true } });
      const invs = await tx.guardianInvitation.findMany({ where: { safetyDateId: { in: dates.map((d) => d.id) }, status: { in: ['PENDING', 'ACCEPTED'] } }, select: { id: true } });
      await tx.guardianInvitation.updateMany({ where: { id: { in: invs.map((i) => i.id) } }, data: { status: 'REVOKED' } });
      await tx.locationShare.updateMany({ where: { invitationId: { in: invs.map((i) => i.id) }, revokedAt: null }, data: { revokedAt: now } });
      await tx.safetyDate.updateMany({ where: { id: { in: dates.map((d) => d.id) }, status: { in: ['PROPOSED', 'CONFIRMED'] } }, data: { status: 'CANCELLED' } });
      await tx.mediaAsset.updateMany({ where: { contextId: { in: contextIds }, visibility: 'SHARED_WITH_CONTEXT' }, data: { visibility: 'PRIVATE' } });
    }
    // Gardiens réciproques hors relation (l'un gardien de l'autre).
    await tx.guardianInvitation.updateMany({ where: { OR: [{ sharerUserId: a, guardianUserId: b }, { sharerUserId: b, guardianUserId: a }], status: { in: ['PENDING', 'ACCEPTED'] } }, data: { status: 'REVOKED' } });
    // Droits dérivés premium entre eux.
    await tx.entitlementGrant.updateMany({ where: { OR: [{ beneficiaryUserId: a, derivedFromUserId: b }, { beneficiaryUserId: b, derivedFromUserId: a }], revokedAt: null }, data: { revokedAt: now, revokeReason: 'BLOCK' } });
    // Coparentalité : projection indépendante figée depuis le dernier état partagé (P-5.15).
    const childLinks = await tx.coparentLink.findMany({ where: { userId: { in: [a, b] }, status: 'ACTIVE' }, select: { childPetId: true } });
    const shared = [...new Set(childLinks.map((l) => l.childPetId))];
    for (const childPetId of shared) {
      const links = await tx.coparentLink.findMany({ where: { childPetId, userId: { in: [a, b] } } });
      if (links.length < 2) continue;
      const st = await tx.petState.findUnique({ where: { petId: childPetId } });
      const snapshot = { frozenAt: now.toISOString(), state: st ? { satiety: st.satiety, energy: st.energy, mood: st.mood, health: st.health, advancedTo: st.advancedTo.toISOString(), engineVersion: st.engineVersion, engineState: st.engineState } : null };
      await tx.coparentLink.updateMany({ where: { childPetId, userId: { in: [a, b] }, status: 'ACTIVE' }, data: { status: 'BLOCKED_INDEPENDENT', independentProjection: snapshot } });
    }
    // Jetons médias émis entre eux : révoqués immédiatement.
    await tx.mediaAccessToken.updateMany({ where: { revokedAt: null, OR: [{ viewerId: a, asset: { ownerUserId: b } }, { viewerId: b, asset: { ownerUserId: a } }] }, data: { revokedAt: now } });
  }

  async insertReport(scope: TxScope, r: Parameters<TrustRepository['insertReport']>[1]) {
    await txOf(scope).report.create({ data: { id: r.id, reporterId: r.reporterId, reportedUserId: r.reportedUserId, contextId: r.contextId, category: r.category as never, safetyExit: r.safetyExit, subjectRef: r.subjectRef, note: r.note, createdAt: scope.now } });
  }

  async openCase(scope: TxScope, c: Parameters<TrustRepository['openCase']>[1]) {
    const tx = txOf(scope);
    const existing = await tx.moderationCase.findFirst({ where: { subjectType: c.subjectType, subjectId: c.subjectId, status: { in: ['OPEN', 'ASSIGNED', 'ESCALATED'] } }, select: { id: true, priority: true } });
    if (existing) {
      if (c.priority < existing.priority) await tx.moderationCase.update({ where: { id: existing.id }, data: { priority: c.priority, dueAt: c.dueAt } });
      if (c.restricted) await tx.moderationCase.update({ where: { id: existing.id }, data: { restricted: true } });
      return existing.id;
    }
    const id = uuidv7(scope.now.getTime());
    await tx.moderationCase.create({ data: { id, subjectType: c.subjectType, subjectId: c.subjectId, subjectUserId: c.subjectUserId, reasonCode: c.reasonCode, priority: c.priority, restricted: c.restricted, reportId: c.reportId ?? null, dueAt: c.dueAt, createdAt: scope.now } });
    return id;
  }

  private toCase(r: { id: string; subjectType: string; subjectId: string; subjectUserId: string | null; status: string; priority: number; reasonCode: string; reportId: string | null; assignedToId: string | null; dueAt: Date; restricted: boolean; createdAt: Date; report?: { category: string } | null }): CaseRow {
    return { ...(r as Omit<CaseRow, 'reportCategory'>), reportCategory: r.report?.category ?? null } as CaseRow;
  }
  async findOpenCase(scope: TxScope | null, subjectType: CaseRow['subjectType'], subjectId: string) {
    const r = await this.c(scope).moderationCase.findFirst({ where: { subjectType, subjectId, status: { in: ['OPEN', 'ASSIGNED', 'ESCALATED'] } }, include: { report: { select: { category: true } } } });
    return r ? this.toCase(r) : null;
  }
  async loadCase(scope: TxScope | null, id: string) {
    const r = await this.c(scope).moderationCase.findUnique({ where: { id }, include: { report: { select: { category: true } } } });
    return r ? this.toCase(r) : null;
  }
  async listCases(q: Parameters<TrustRepository['listCases']>[0]) {
    const rows = await this.db.moderationCase.findMany({
      where: { ...(q.status ? { status: q.status as never } : {}), ...(q.subjectType ? { subjectType: q.subjectType as never } : {}), ...(q.priority ? { priority: q.priority } : {}), ...(q.includeRestricted ? {} : { restricted: false }), ...page(q.after) },
      include: { report: { select: { category: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: q.limit,
    });
    return rows.map((r) => this.toCase(r));
  }
  async updateCase(scope: TxScope, id: string, patch: Parameters<TrustRepository['updateCase']>[2]) {
    await txOf(scope).moderationCase.update({ where: { id }, data: patch as never });
  }
  async decisionsFor(subjectType: string, subjectId: string): Promise<DecisionRow[]> {
    const rows = await this.db.moderationDecision.findMany({ where: { subjectType: subjectType as never, subjectId }, orderBy: { createdAt: 'asc' } });
    return rows.map((d) => ({ id: d.id, action: d.action, source: d.source, policyVersion: d.policyVersion, provider: d.provider, reasonCode: d.reasonCode, supersedesId: d.supersedesId, signals: (d.signals as Record<string, number> | null) ?? null, createdAt: d.createdAt }));
  }
  async recordDecision(scope: TxScope, d: Parameters<TrustRepository['recordDecision']>[1]) {
    const id = uuidv7(scope.now.getTime());
    await txOf(scope).moderationDecision.create({ data: { id, subjectType: d.subjectType, subjectId: d.subjectId, messageId: d.subjectType === 'MESSAGE' ? d.subjectId : null, action: d.action, source: 'HUMAN', policyVersion: d.policyVersion, provider: 'staff', reasonCode: d.reasonCode, decidedById: d.decidedById, supersedesId: d.supersedesId, createdAt: scope.now } });
    return id;
  }
  async caseStats(now: Date) {
    const open = await this.db.moderationCase.groupBy({ by: ['priority'], where: { status: { in: ['OPEN', 'ASSIGNED', 'ESCALATED'] } }, _count: { _all: true } });
    const overdue = await this.db.moderationCase.count({ where: { status: { in: ['OPEN', 'ASSIGNED', 'ESCALATED'] }, dueAt: { lt: now } } });
    const providerErrors24h = await this.db.aIJob.count({ where: { status: { in: ['FAILED', 'DEAD_LETTER'] }, createdAt: { gte: new Date(now.getTime() - 86_400_000) } } });
    const byPriority: Record<string, number> = {};
    for (const g of open) byPriority[String(g.priority)] = g._count._all;
    return { open: open.reduce((a, g) => a + g._count._all, 0), overdue, byPriority, providerErrors24h };
  }

  async createAppeal(scope: TxScope, caseId: string, userId: string) {
    const tx = txOf(scope);
    const ex = await tx.appeal.findUnique({ where: { caseId_userId: { caseId, userId } } });
    if (ex) return { id: ex.id, created: false };
    const id = uuidv7(scope.now.getTime());
    await tx.appeal.create({ data: { id, caseId, userId, createdAt: scope.now } });
    return { id, created: true };
  }
  async loadAppeal(scope: TxScope | null, id: string) {
    return this.c(scope).appeal.findUnique({ where: { id }, select: { id: true, caseId: true, userId: true, status: true, createdAt: true } });
  }
  async listAppeals(q: Parameters<TrustRepository['listAppeals']>[0]) {
    return this.db.appeal.findMany({ where: { ...(q.status ? { status: q.status as never } : {}), ...page(q.after) }, select: { id: true, caseId: true, status: true, createdAt: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: q.limit });
  }
  async resolveAppeal(scope: TxScope, id: string, status: 'UPHELD' | 'OVERTURNED') {
    await txOf(scope).appeal.update({ where: { id }, data: { status, resolvedAt: scope.now } });
  }

  async messageAuthor(messageId: string) {
    return this.db.message.findUnique({ where: { id: messageId }, select: { authorUserId: true, conversationId: true } });
  }
  async mediaOwner(mediaId: string) {
    return (await this.db.mediaAsset.findUnique({ where: { id: mediaId }, select: { ownerUserId: true } }))?.ownerUserId ?? null;
  }
  async proofOwner(id: string) {
    return (await this.db.missionProofAssessment.findUnique({ where: { id }, select: { userId: true } }))?.userId ?? null;
  }

  async caseContext(c: CaseRow) {
    if (c.subjectType === 'MESSAGE') {
      const m = await this.db.message.findUnique({ where: { id: c.subjectId }, include: { content: true } });
      if (!m) return { subject: null, neighbours: [] };
      const near = await this.db.message.findMany({ where: { conversationId: m.conversationId, id: { not: m.id }, status: { in: ['PUBLISHED', 'WARNED'] }, createdAt: { lte: m.createdAt } }, include: { content: true }, orderBy: { createdAt: 'desc' }, take: 5 });
      const label = (uid: string | null): 'A' | 'B' | 'SYSTEM' => (!uid ? 'SYSTEM' : uid === m.authorUserId ? 'A' : 'B');
      return {
        subject: { kind: m.kind, text: m.content && !m.content.purgedAt ? m.content.body : null, mediaVariant: m.kind === 'VOICE' ? 'audio' : null, createdAt: m.createdAt },
        neighbours: near.reverse().map((x) => ({ author: label(x.authorUserId), text: x.content && !x.content.purgedAt ? x.content.body : null, createdAt: x.createdAt })),
      };
    }
    if (c.subjectType === 'MEDIA') {
      const a = await this.db.mediaAsset.findUnique({ where: { id: c.subjectId } });
      return { subject: a ? { kind: a.purpose, text: null, mediaVariant: a.purpose === 'VOICE_MESSAGE' ? 'audio' : 'thumbnail', createdAt: a.createdAt } : null, neighbours: [] };
    }
    if (c.subjectType === 'MISSION_SUBMISSION') {
      const p = await this.db.missionProofAssessment.findUnique({ where: { id: c.subjectId } });
      return { subject: p ? { kind: `MISSION:${p.missionKey}`, text: null, mediaVariant: 'thumbnail', createdAt: p.createdAt } : null, neighbours: [] };
    }
    if (c.subjectType === 'ANONYMOUS_RESPONSE') {
      const r = await this.db.anonymousResponse.findUnique({ where: { id: c.subjectId } });
      // Mots prédéfinis seulement ; l'identité du répondant n'est jamais exposée.
      return { subject: r ? { kind: 'ANONYMOUS_RESPONSE', text: r.words.join(', '), mediaVariant: null, createdAt: r.createdAt } : null, neighbours: [] };
    }
    return { subject: null, neighbours: [] };
  }

  async setUserStatus(scope: TxScope, userId: string, status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED') {
    await txOf(scope).user.update({ where: { id: userId }, data: { status } });
  }
  async revokeSessions(scope: TxScope, userId: string) {
    return (await txOf(scope).deviceSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: scope.now, pushToken: null } })).count;
  }

  private toVer(v: { id: string; userId: string; kind: string; provenance: string; status: string; providerRef: string | null; decisionCode: number | null; reasonCode: string | null; createdAt: Date; updatedAt: Date; expiresAt: Date | null }): VerificationRow {
    return v as VerificationRow;
  }
  async createVerification(scope: TxScope, v: Parameters<TrustRepository['createVerification']>[1]) {
    await txOf(scope).verificationSession.create({ data: { id: v.id, userId: v.userId, kind: v.kind, provenance: v.provenance, status: v.status, providerRef: v.providerRef, providerSessionUrl: v.providerSessionUrl ?? null, expiresAt: v.expiresAt, reasonCode: v.reasonCode ?? null, createdAt: scope.now } });
  }
  async verificationByProviderRef(scope: TxScope | null, providerRef: string) {
    const v = await this.c(scope).verificationSession.findFirst({ where: { provenance: 'PROVIDER', providerRef } });
    return v ? this.toVer(v) : null;
  }
  async loadVerification(scope: TxScope | null, id: string) {
    const v = await this.c(scope).verificationSession.findUnique({ where: { id } });
    return v ? this.toVer(v) : null;
  }
  async updateVerification(scope: TxScope, id: string, p: Parameters<TrustRepository['updateVerification']>[2]) {
    await txOf(scope).verificationSession.update({
      where: { id },
      data: {
        status: p.status,
        ...(p.decisionCode !== undefined ? { decisionCode: p.decisionCode } : {}),
        ...(p.reasonCode !== undefined ? { reasonCode: p.reasonCode } : {}),
        ...(p.verifiedAt !== undefined ? { verifiedAt: p.verifiedAt } : {}),
        ...(p.expiresAt !== undefined ? { expiresAt: p.expiresAt } : {}),
        ...(p.lastProviderEventAt ? { lastProviderEventAt: p.lastProviderEventAt } : {}),
        ...(p.clearSessionUrl ? { providerSessionUrl: null } : {}),
      },
    });
  }
  async listVerifications(q: Parameters<TrustRepository['listVerifications']>[0]) {
    const rows = await this.db.verificationSession.findMany({ where: { ...(q.status ? { status: q.status as never } : {}), ...page(q.after) }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: q.limit });
    return rows.map((v) => this.toVer(v));
  }
  async recordWebhook(scope: TxScope, w: Parameters<TrustRepository['recordWebhook']>[1]) {
    try {
      await txOf(scope).providerWebhookEvent.create({ data: { id: uuidv7(scope.now.getTime()), provider: w.provider, providerEventId: w.providerEventId, environment: w.environment, eventType: w.eventType, eventTimestamp: w.eventTimestamp, payload: w.payload as object, receivedAt: scope.now, status: 'PROCESSED', processedAt: scope.now } });
      return true;
    } catch (e) {
      if (isUniqueViolation(e)) return false;
      throw e;
    }
  }

  async audit(scope: TxScope | null, a: Parameters<TrustRepository['audit']>[1]) {
    await this.c(scope).auditLog.create({ data: { id: uuidv7(a.at.getTime()), actorUserId: a.actorUserId, actorRole: a.actorRole, action: a.action, targetType: a.targetType, targetId: a.targetId, reason: a.reason, data: (a.data ?? undefined) as object | undefined, requestId: a.requestId ?? null, createdAt: a.at } });
  }

  async listReports(q: Parameters<TrustRepository['listReports']>[0]) {
    return this.db.report.findMany({ where: { ...(q.status ? { status: q.status as never } : {}), ...(q.category ? { category: q.category as never } : {}), ...page(q.after) }, select: { id: true, reportedUserId: true, category: true, safetyExit: true, status: true, createdAt: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: q.limit });
  }
  async listExports(q: Parameters<TrustRepository['listExports']>[0]) {
    const rows = await this.db.dataExport.findMany({ where: { ...(q.status ? { status: q.status as never } : {}), ...(q.after ? { OR: [{ requestedAt: { lt: q.after.createdAt } }, { requestedAt: q.after.createdAt, id: { lt: q.after.id } }] } : {}) }, orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }], take: q.limit });
    return rows.map((r) => ({ id: r.id, userId: r.userId, status: r.status, requestedAt: r.requestedAt, readyAt: r.readyAt, expiresAt: r.expiresAt }));
  }
  async listDeletions(q: Parameters<TrustRepository['listDeletions']>[0]) {
    const rows = await this.db.deletionRequest.findMany({ where: { ...(q.status ? { status: q.status as never } : {}), ...(q.after ? { OR: [{ requestedAt: { lt: q.after.createdAt } }, { requestedAt: q.after.createdAt, id: { lt: q.after.id } }] } : {}) }, orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }], take: q.limit });
    return rows.map((r) => ({ id: r.id, userId: r.userId, status: r.status, requestedAt: r.requestedAt, completedAt: r.completedAt, purgeAfter: r.purgeAfter }));
  }
}

export class PrismaAiInvalidation implements AiInvalidation {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}
  private c(scope: TxScope | null): C {
    return scope ? txOf(scope) : this.db;
  }
  /** Heure de la commande si transactionnelle, sinon horloge injectée (jamais l'heure système). */
  private at(scope: TxScope | null): Date {
    return scope?.now ?? this.clock.now();
  }
  async cancelForUser(scope: TxScope | null, userId: string, reason: string, kinds?: readonly string[]) {
    const c = this.c(scope);
    const where = { userId, ...(kinds ? { kind: { in: [...kinds] } } : {}) };
    const n = await c.aIJob.updateMany({ where: { ...where, status: { in: ['QUEUED', 'RUNNING', 'FAILED'] } }, data: { status: 'CANCELLED', cancelledAt: this.at(scope), cancelReason: reason } });
    const jobs = await c.aIJob.findMany({ where, select: { id: true } });
    await c.aIResult.updateMany({ where: { jobId: { in: jobs.map((j) => j.id) }, invalidatedAt: null }, data: { invalidatedAt: this.at(scope) } });
    return n.count;
  }
  async cancelForContexts(scope: TxScope | null, contextIds: readonly string[], reason: string) {
    if (!contextIds.length) return 0;
    const c = this.c(scope);
    const n = await c.aIJob.updateMany({ where: { contextId: { in: [...contextIds] }, status: { in: ['QUEUED', 'RUNNING', 'FAILED'] } }, data: { status: 'CANCELLED', cancelledAt: this.at(scope), cancelReason: reason } });
    const jobs = await c.aIJob.findMany({ where: { contextId: { in: [...contextIds] } }, select: { id: true } });
    await c.aIResult.updateMany({ where: { jobId: { in: jobs.map((j) => j.id) }, invalidatedAt: null }, data: { invalidatedAt: this.at(scope) } });
    const convs = await c.conversation.findMany({ where: { contextId: { in: [...contextIds] } }, select: { id: true } });
    await c.suggestion.updateMany({ where: { conversationId: { in: convs.map((x) => x.id) }, invalidatedAt: null }, data: { invalidatedAt: this.at(scope) } });
    await c.conversationSignal.deleteMany({ where: { conversationId: { in: convs.map((x) => x.id) } } });
    return n.count;
  }
  async invalidateSuggestionsForUser(scope: TxScope | null, userId: string) {
    await this.c(scope).suggestion.updateMany({ where: { userId, invalidatedAt: null }, data: { invalidatedAt: this.at(scope) } });
  }
  async deleteSignalsForUser(scope: TxScope | null, userId: string) {
    const convs = await this.c(scope).conversationMember.findMany({ where: { userId }, select: { conversationId: true } });
    await this.c(scope).conversationSignal.deleteMany({ where: { conversationId: { in: convs.map((c) => c.conversationId) } } });
  }
  async listJobs(q: Parameters<AiInvalidation['listJobs']>[0]) {
    return this.db.aIJob.findMany({ where: { ...(q.status ? { status: q.status as never } : {}), ...(q.kind ? { kind: q.kind } : {}), ...page(q.after) }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: q.limit });
  }
  async setJobStatus(id: string, status: 'QUEUED' | 'CANCELLED', reason: string | null) {
    await this.db.aIJob.update({ where: { id }, data: { status, ...(status === 'CANCELLED' ? { cancelledAt: this.clock.now(), cancelReason: reason } : { cancelledAt: null, cancelReason: null, attempts: 0 }) } });
  }
}
