import type { Db } from '@blowy/database';
import type { AiFeatureRepository } from '../application/ai-features.use-cases.js';

export class PrismaAiFeatureRepository implements AiFeatureRepository {
  constructor(private readonly db: Db) {}

  async conversationFacts(conversationId: string, at: Date) {
    const c = await this.db.conversation.findUnique({ where: { id: conversationId }, include: { members: true, context: { include: { pauses: { where: { endedAt: null, startsAt: { lte: at }, endsAt: { gt: at } } } } } } });
    if (!c) return null;
    const userIds = c.members.map((m) => m.userId);
    const global = await this.db.pausePeriod.count({ where: { userId: { in: userIds }, contextId: null, endedAt: null, startsAt: { lte: at }, endsAt: { gt: at } } });
    const last = await this.db.message.findFirst({ where: { conversationId, kind: { not: 'SYSTEM' }, status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, select: { publishedAt: true } });
    return {
      id: c.id,
      contextId: c.contextId,
      closed: !!c.closedAt,
      status: c.context?.status ?? null,
      branch: c.context?.branch ?? 'UNDECIDED',
      level: c.context?.reachedLevel ?? 1,
      members: c.members.map((m) => ({ userId: m.userId, revokedAt: m.revokedAt })),
      paused: (c.context?.pauses.length ?? 0) > 0 || global > 0 || c.context?.status === 'PAUSED',
      lastHumanMessageAt: last?.publishedAt ?? null,
      zoneDay: { zoneId: null, day: at.toISOString().slice(0, 10) },
    };
  }
  async blockedBetween(a: string, b: string) {
    return (await this.db.block.count({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } })) > 0;
  }
  async latestConsent(userId: string, purpose: string) {
    return this.db.processingConsent.findFirst({ where: { userId, purpose }, orderBy: { createdAt: 'desc' }, select: { granted: true, version: true } });
  }
  async recentPublished(conversationId: string, limit: number) {
    const rows = await this.db.message.findMany({ where: { conversationId, kind: 'TEXT', status: 'PUBLISHED' }, include: { content: true }, orderBy: { seq: 'desc' }, take: limit });
    return rows.reverse().map((m) => ({ id: m.id, authorUserId: m.authorUserId, body: m.content && !m.content.purgedAt ? m.content.body : null, createdAt: m.createdAt }));
  }
  async memories(contextId: string, limit: number) {
    // Souvenirs fondés sur des événements, non sensibles ; libellé = clé éditoriale.
    const rows = await this.db.memory.findMany({ where: { contextId, sensitive: false, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: limit });
    return rows.map((m) => ({ id: m.id, label: m.kind }));
  }
  async publicVisionKeys(userId: string) {
    const p = await this.db.pet.findUnique({ where: { primaryOwnerId: userId }, include: { vision: true } });
    return p?.vision ? [`school.${p.vision.school}`, `sunday.${p.vision.sunday}`, ...p.vision.passions.map((x) => `passion.${x}`)] : [];
  }
  async findSuggestion(conversationId: string, userId: string, windowKey: string) {
    return this.db.suggestion.findUnique({ where: { conversationId_userId_windowKey: { conversationId, userId, windowKey } }, select: { items: true, source: true, createdAt: true, invalidatedAt: true } });
  }
  async saveSuggestion(s: Parameters<AiFeatureRepository['saveSuggestion']>[0]) {
    await this.db.suggestion.upsert({
      where: { conversationId_userId_windowKey: { conversationId: s.conversationId, userId: s.userId, windowKey: s.windowKey } },
      create: { id: s.id, conversationId: s.conversationId, userId: s.userId, items: s.items as object, source: s.source, windowKey: s.windowKey, createdAt: s.createdAt },
      update: { items: s.items as object, source: s.source, invalidatedAt: null },
    });
  }
  async countAutoSuggestions(conversationId: string, userId: string, since: Date) {
    return this.db.suggestion.count({ where: { conversationId, userId, windowKey: { startsWith: 'AUTO:' }, createdAt: { gte: since } } });
  }
  async saveSignal(s: Parameters<AiFeatureRepository['saveSignal']>[0]) {
    await this.db.conversationSignal.create({ data: s });
  }
  async activeSignal(conversationId: string, at: Date) {
    return this.db.conversationSignal.findFirst({ where: { conversationId, expiresAt: { gt: at } }, orderBy: { createdAt: 'desc' }, select: { tone: true, proposedReaction: true, expiresAt: true } });
  }
}
