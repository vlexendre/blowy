/**
 * Journal IA Prisma (AIJob / AIResult / AIUsageCounter) : statut, modèle, version de prompt,
 * durée, tokens, coût estimé daté — JAMAIS le texte traité. Cache = AIResult validé non
 * invalidé et non expiré. Plafonds = compteurs atomiques (INSERT … ON CONFLICT).
 */
import { isUniqueViolation, uuidv7, type Db } from '@blowy/database';
import type { AiJournal, AiUsage, JournalEntry } from '@blowy/ai';

export class PrismaAiJournal implements AiJournal {
  constructor(private readonly db: Db) {}

  async cached(jobKey: string, now: Date): Promise<unknown | null> {
    const j = await this.db.aIJob.findUnique({ where: { dedupKey: jobKey }, include: { result: true } });
    if (!j || j.status !== 'SUCCEEDED' || !j.result || !j.result.validated || j.result.invalidatedAt) return null;
    if (j.result.expiresAt && j.result.expiresAt <= now) return null;
    return j.result.output;
  }

  async start(e: JournalEntry, now: Date): Promise<boolean> {
    // Une nouvelle exécution n'est lancée qu'après revérification de l'autorisation ACTUELLE
    // par l'appelant ; une annulation antérieure (retrait puis nouveau consentement) ne bloque pas.
    const existing = await this.db.aIJob.findUnique({ where: { dedupKey: e.jobKey }, select: { status: true } });
    const data = { kind: e.kind, subjectType: e.subjectType, subjectId: e.subjectId, provider: e.provider, promptVersion: e.promptVersion, userId: e.userId, contextId: e.contextId, status: 'RUNNING' as const };
    if (existing) {
      await this.db.aIJob.update({ where: { dedupKey: e.jobKey }, data: { status: 'RUNNING', lastErrorCode: null, cancelledAt: null, cancelReason: null, userId: e.userId, contextId: e.contextId } });
      return true;
    }
    try {
      await this.db.aIJob.create({ data: { id: uuidv7(now.getTime()), dedupKey: e.jobKey, createdAt: now, ...data } });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
    return true;
  }

  async succeed(jobKey: string, u: AiUsage, attempts: number, output: unknown, expiresAt: Date | null, now: Date): Promise<void> {
    const j = await this.db.aIJob.update({
      where: { dedupKey: jobKey },
      data: { status: 'SUCCEEDED', provider: u.provider, model: u.model, promptVersion: u.promptVersion, attempts, durationMs: u.durationMs, inputTokens: u.inputTokens, outputTokens: u.outputTokens, costMicros: u.costMicros, finishedAt: now, lastErrorCode: null },
    });
    await this.db.aIResult.upsert({
      where: { jobId: j.id },
      create: { id: uuidv7(now.getTime()), jobId: j.id, output: output as object, validated: true, expiresAt, createdAt: now },
      update: { output: output as object, validated: true, expiresAt, invalidatedAt: null },
    });
  }

  async fail(jobKey: string, code: string, attempts: number, _u: Partial<AiUsage>, now: Date): Promise<void> {
    await this.db.aIJob.updateMany({
      where: { dedupKey: jobKey, status: { not: 'CANCELLED' } },
      data: { status: code === 'CANCELLED' ? 'CANCELLED' : 'FAILED', lastErrorCode: code, attempts, finishedAt: now },
    });
  }

  async reserve(keys: { key: string; limit: number }[], cost: { key: string; limitMicros: number }, day: string): Promise<boolean> {
    const c = await this.db.aIUsageCounter.findUnique({ where: { key: cost.key } });
    if ((c?.costMicros ?? 0) >= cost.limitMicros) return false;
    let ok = true;
    for (const k of keys) {
      const rows = await this.db.$queryRaw<{ count: number }[]>`
        INSERT INTO "AIUsageCounter" (key, day, count, "costMicros", "updatedAt") VALUES (${k.key}, ${day}, 1, 0, now())
        ON CONFLICT (key) DO UPDATE SET count = "AIUsageCounter".count + 1, "updatedAt" = now()
        RETURNING count`;
      if ((rows[0]?.count ?? 0) > k.limit) ok = false;
    }
    return ok;
  }

  async addCost(key: string, day: string, costMicros: number): Promise<void> {
    if (costMicros <= 0) return;
    await this.db.$executeRaw`
      INSERT INTO "AIUsageCounter" (key, day, count, "costMicros", "updatedAt") VALUES (${key}, ${day}, 0, ${costMicros}, now())
      ON CONFLICT (key) DO UPDATE SET "costMicros" = "AIUsageCounter"."costMicros" + ${costMicros}, "updatedAt" = now()`;
  }

  async isCancelled(jobKey: string): Promise<boolean> {
    const j = await this.db.aIJob.findUnique({ where: { dedupKey: jobKey }, select: { status: true } });
    return j?.status === 'CANCELLED';
  }
}
