import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Day, addDays, dayOf } from '@blowy/domain';
import type { AdminInsights } from '../insights';
import type { ActivityRepository, DailyMetrics, DailyStatsRepository, MetricsSource } from '../ports';
import { ACTIVITY, ADMIN_INSIGHTS, DAILY_STATS, METRICS_SOURCE } from '../tokens';

/** Jours rattrapés au plus par passage (après une panne du minuteur). */
export const STATS_BACKFILL_DAYS = 3;
/** Jours d'activité gardés (mois actif = 30 jours, rétention J30 = 31 jours). */
export const ACTIVITY_KEPT_DAYS = 40;

/**
 * Tâche quotidienne de l'administration (appelée par le minuteur) : calcule une fois les chiffres de chaque
 * jour terminé (Europe/Paris) et les range dans `admin_daily_stats`. Idempotente : un jour déjà calculé
 * n'est pas recalculé. Côté Supabase, un jour = une requête SQL (`admin_daily_metrics`).
 */
@Injectable()
export class AdminStatsJobs {
  private readonly logger = new Logger('Statistiques');

  constructor(
    @Inject(METRICS_SOURCE) private readonly source: MetricsSource,
    @Inject(DAILY_STATS) private readonly stats: DailyStatsRepository,
    @Inject(ACTIVITY) private readonly activity: ActivityRepository,
    @Inject(ADMIN_INSIGHTS) private readonly insights: AdminInsights,
  ) {}

  async runDue(now: Date, deadline?: number): Promise<number> {
    const today = dayOf(now);
    const yesterday = addDays(today, -1);
    const earliest = addDays(yesterday, -(STATS_BACKFILL_DAYS - 1));
    const latest = await this.stats.latest();
    let day = latest && latest.day >= earliest ? addDays(latest.day, 1) : earliest;
    let computed = 0;
    for (; day <= yesterday; day = addDays(day, 1)) {
      if (deadline !== undefined && Date.now() >= deadline) break;
      await this.computeDay(day, now);
      computed += 1;
    }
    if (computed > 0) {
      await this.activity.purgeBefore(addDays(today, -ACTIVITY_KEPT_DAYS));
      this.logger.log(`statistiques calculées : ${computed} jour(s), jusqu’au ${addDays(day, -1)}`);
    }
    return computed;
  }

  /** Calcule (ou recalcule) un jour. */
  async computeDay(day: Day, now: Date): Promise<DailyMetrics> {
    const base = await this.source.compute(day);
    const [averageStreak, encountersProposed, averageCompatibility, shapes, visions, topDetails] = await Promise.all([
      this.insights.averageStreak(day),
      this.insights.encountersProposed(day),
      this.insights.averageCompatibility(day),
      this.insights.shapes(day),
      this.insights.visions(day),
      this.insights.minimoaDetails(base.top.map((t) => t.userId)),
    ]);
    const metrics: DailyMetrics = { ...base, averageStreak, encountersProposed, averageCompatibility, shapes, visions, topDetails };
    await this.stats.put({ day, metrics, computedAt: now.toISOString() });
    return metrics;
  }
}
