import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { AdminAiCosts, AdminFunnel, AdminMinimoas, AdminOverview, AiUsageSummary } from '@blowy/contract';
import { addDays } from '@blowy/domain';
import { AiUsage } from '../../../integrations/ai/ai-usage.service';
import type { DailyStatsRepository } from '../ports';
import { DAILY_STATS } from '../tokens';
import { STATS_WINDOW_DAYS, StatsWindow, funnelOf, minimoasOf, overviewOf } from './aggregates';

/** Écrans chiffrés : lus dans `admin_daily_stats` (60 lignes au plus), jamais dans les grandes tables. */
@Injectable()
export class Dashboards {
  constructor(@Inject(DAILY_STATS) private readonly stats: DailyStatsRepository) {}

  private async window(): Promise<{ w: StatsWindow | null; computedAt: string | null }> {
    const latest = await this.stats.latest();
    if (!latest) return { w: null, computedAt: null };
    const rows = await this.stats.range(addDays(latest.day, -(STATS_WINDOW_DAYS - 1)), latest.day);
    return { w: new StatsWindow(rows, latest.day), computedAt: latest.computedAt };
  }

  async overview(): Promise<AdminOverview> {
    const { w, computedAt } = await this.window();
    return overviewOf(w, computedAt);
  }

  async minimoas(): Promise<AdminMinimoas> {
    const { w, computedAt } = await this.window();
    return minimoasOf(w, computedAt);
  }

  async funnel(): Promise<AdminFunnel> {
    const { w, computedAt } = await this.window();
    return funnelOf(w, computedAt);
  }
}

/** Service d'usage de l'IA du chantier « plateforme » (`AiUsage.summary(days)`), lu s'il est fourni. */
interface AiUsageReader {
  summary(days?: number): Promise<AiUsageSummary>;
}

/**
 * Coûts de l'IA : lus dans le service d'usage du chantier « plateforme » (`integrations/ai/ai-usage.service.ts`).
 * Tant qu'il n'est fourni par aucun module, l'écran dit « pas encore branché » (`available: false`).
 */
@Injectable()
export class AiCosts {
  private readonly logger = new Logger('Administration');

  constructor(@Inject(ModuleRef) private readonly moduleRef: ModuleRef) {}

  private async reader(): Promise<AiUsageReader | null> {
    try {
      return this.moduleRef.get<AiUsageReader>(AiUsage, { strict: false });
    } catch {
      return null;
    }
  }

  async execute(days: number): Promise<AdminAiCosts> {
    const reader = await this.reader();
    if (!reader) return { available: false, killSwitch: null, dailyCeilingUsd: null, todaySpendUsd: null, days: [], byFeature: [] };
    let s: AiUsageSummary;
    try {
      s = await reader.summary(days);
    } catch (err) {
      this.logger.warn(`usage de l’IA illisible : ${err instanceof Error ? err.message : 'erreur'}`);
      return { available: false, killSwitch: null, dailyCeilingUsd: null, todaySpendUsd: null, days: [], byFeature: [] };
    }
    const byDayFeature = new Map<string, { day: string; feature: string; calls: number; costUsd: number }>();
    const byFeature = new Map<string, { feature: string; calls: number; costUsd: number }>();
    for (const r of s.rows) {
      const k = `${r.day}|${r.feature}`;
      const d = byDayFeature.get(k) ?? { day: r.day, feature: r.feature, calls: 0, costUsd: 0 };
      d.calls += r.calls;
      d.costUsd += r.costUsd;
      byDayFeature.set(k, d);
      const f = byFeature.get(r.feature) ?? { feature: r.feature, calls: 0, costUsd: 0 };
      f.calls += r.calls;
      f.costUsd += r.costUsd;
      byFeature.set(r.feature, f);
    }
    const round = (x: number): number => Math.round(x * 10_000) / 10_000;
    return {
      available: true,
      killSwitch: s.killSwitch ? 'on' : 'off',
      dailyCeilingUsd: s.dailyCeilingUsd,
      todaySpendUsd: round(s.todaySpendUsd),
      days: [...byDayFeature.values()].sort((a, b) => a.day.localeCompare(b.day) || a.feature.localeCompare(b.feature)).map((d) => ({ ...d, costUsd: round(d.costUsd) })),
      byFeature: [...byFeature.values()].sort((a, b) => b.costUsd - a.costUsd).map((f) => ({ ...f, costUsd: round(f.costUsd) })),
    };
  }
}
