import type { AiFeatureKey, Day } from '@blowy/domain';
import type { MemoryDb } from '../../persistence/memory-db';
import type { AiUsageEntry, AiUsageRecord, AiUsageStore } from './usage-store';

const userKey = (userId: string, day: Day, feature: string): string => `${userId}|${day}|${feature}`;
const rowKey = (day: Day, feature: string, tier: string): string => `${day}|${feature}|${tier}`;

export class MemoryAiUsageStore implements AiUsageStore {
  constructor(private readonly db: MemoryDb) {}

  async spentMicros(day: Day): Promise<number> {
    let sum = 0;
    for (const r of this.db.aiUsageDaily.values()) if (r.day === day) sum += r.costMicros;
    return sum;
  }

  async userCalls(userId: string, day: Day, feature: AiFeatureKey): Promise<number> {
    return this.db.aiUserCalls.get(userKey(userId, day, feature)) ?? 0;
  }

  async takeUserCall(userId: string, day: Day, feature: AiFeatureKey, max: number): Promise<boolean> {
    const key = userKey(userId, day, feature);
    const calls = this.db.aiUserCalls.get(key) ?? 0;
    if (calls >= max) return false;
    this.db.aiUserCalls.set(key, calls + 1);
    return true;
  }

  async record(e: AiUsageEntry): Promise<void> {
    const key = rowKey(e.day, e.feature, e.tier);
    const r: AiUsageRecord = this.db.aiUsageDaily.get(key) ?? {
      day: e.day,
      feature: e.feature,
      tier: e.tier,
      calls: 0,
      declined: 0,
      errors: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheWriteTokens: 0,
      cacheReadTokens: 0,
      costMicros: 0,
    };
    this.db.aiUsageDaily.set(key, {
      ...r,
      calls: r.calls + (e.outcome === 'declined' ? 0 : 1),
      declined: r.declined + (e.outcome === 'declined' ? 1 : 0),
      errors: r.errors + (e.outcome === 'error' ? 1 : 0),
      inputTokens: r.inputTokens + e.usage.input,
      outputTokens: r.outputTokens + e.usage.output,
      cacheWriteTokens: r.cacheWriteTokens + e.usage.cacheWrite,
      cacheReadTokens: r.cacheReadTokens + e.usage.cacheRead,
      costMicros: r.costMicros + e.costMicros,
    });
  }

  async list(from: Day, to: Day): Promise<AiUsageRecord[]> {
    return [...this.db.aiUsageDaily.values()]
      .filter((r) => r.day >= from && r.day <= to)
      .sort((a, b) => b.day.localeCompare(a.day) || a.feature.localeCompare(b.feature) || a.tier.localeCompare(b.tier))
      .map((r) => ({ ...r }));
  }

  async purgeUserCalls(before: Day): Promise<number> {
    let n = 0;
    for (const key of [...this.db.aiUserCalls.keys()]) {
      const day = key.split('|')[1] ?? '';
      if (day < before) {
        this.db.aiUserCalls.delete(key);
        n += 1;
      }
    }
    return n;
  }
}
