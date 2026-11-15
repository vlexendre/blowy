/**
 * Lecture de l'usage de l'IA (service interne, injectable partout : l'administration l'affiche).
 * Montants en dollars (facturation du fournisseur) ; `eurPerUsd` sert à l'affichage en euros.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { AiUsageSummary } from '@blowy/contract';
import { addDays, dayOf, microsToDollars } from '@blowy/domain';
import type { Env } from '../../config/env';
import type { Clock } from '../../shared/clock';
import { CLOCK, ENV } from '../../shared/tokens';
import { AI_USAGE_STORE, type AiUsageStore } from './usage-store';

@Injectable()
export class AiUsage {
  constructor(
    @Inject(AI_USAGE_STORE) private readonly store: AiUsageStore,
    @Inject(ENV) private readonly env: Env,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Les `days` derniers jours (aujourd'hui compris, Europe/Paris), par jour, fonction et palier. */
  async summary(days = 30): Promise<AiUsageSummary> {
    const ai = this.env.plateforme.ai;
    const today = dayOf(this.clock.now());
    const rows = await this.store.list(addDays(today, -(Math.max(1, Math.min(days, 90)) - 1)), today);
    const todayMicros = rows.filter((r) => r.day === today).reduce((s, r) => s + r.costMicros, 0);
    return {
      provider: ai.provider,
      killSwitch: ai.killSwitch,
      dailyCeilingUsd: microsToDollars(ai.dailyCeilingMicros),
      todaySpendUsd: microsToDollars(todayMicros),
      eurPerUsd: ai.eurPerUsd,
      rows: rows.map((r) => ({
        day: r.day,
        feature: r.feature,
        tier: r.tier,
        calls: r.calls,
        declined: r.declined,
        errors: r.errors,
        inputTokens: r.inputTokens + r.cacheWriteTokens + r.cacheReadTokens,
        outputTokens: r.outputTokens,
        costUsd: microsToDollars(r.costMicros),
      })),
    };
  }
}
