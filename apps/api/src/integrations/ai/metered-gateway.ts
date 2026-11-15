/**
 * Implémentation de `AiGateway` : interrupteur → modèle disponible → plafond global du jour → budget de la personne
 * pour cette fonction, tout cela AVANT l'appel ; puis l'appel, puis le compteur (jetons et coût estimé).
 * Un refus est compté (`declined`) sans jeton. `complete` ne lève jamais.
 */
import { Logger } from '@nestjs/common';
import { NO_TOKENS, aiCostMicros, aiGate, dayOf } from '@blowy/domain';
import type { PlateformeEnv } from '../../config/plateforme.env';
import type { Cache } from '../../shared/cache';
import type { Clock } from '../../shared/clock';
import type { AiGateway, AiRequest, AiResult } from './ai-gateway';
import type { ModelClient } from './model-client';
import type { AiUsageStore } from './usage-store';

/** La dépense du jour est relue au plus toutes les 15 s (plafond global : approximatif à quelques appels près). */
const SPENT_TTL_MS = 15_000;
/** Bornes de sécurité, quel que soit l'appelant. */
const MAX_TOKENS_CAP = { small: 400, medium: 800 } as const;
const MAX_PROMPT_CHARS = 8_000;

export class MeteredAiGateway implements AiGateway {
  private readonly logger = new Logger('IA');

  constructor(
    private readonly model: ModelClient | null,
    private readonly config: PlateformeEnv['ai'],
    private readonly store: AiUsageStore,
    private readonly cache: Cache,
    private readonly clock: Clock,
  ) {}

  async complete(req: AiRequest): Promise<AiResult> {
    const day = dayOf(this.clock.now());
    try {
      const spent = await this.cache.wrap(`ai:spent:${day}`, SPENT_TTL_MS, () => this.store.spentMicros(day));
      const userCalls = await this.store.userCalls(req.userId, day, req.feature);
      const gate = aiGate({
        killSwitch: this.config.killSwitch,
        available: this.model !== null,
        spentTodayMicros: spent,
        ceilingMicros: this.config.dailyCeilingMicros,
        userCallsToday: userCalls,
        userBudget: this.config.userBudgets[req.feature],
      });
      if (gate !== 'ok') return await this.decline(day, req, gate);
      // Deuxième contrôle, atomique : deux requêtes simultanées ne dépassent pas le budget.
      if (!(await this.store.takeUserCall(req.userId, day, req.feature, this.config.userBudgets[req.feature]))) return await this.decline(day, req, 'budget');
    } catch (err) {
      this.logger.warn(`compteur IA indisponible : ${err instanceof Error ? err.message : 'erreur'}`);
      return { ok: false, reason: 'error' };
    }

    const model = this.model;
    if (!model) return { ok: false, reason: 'disabled' };
    try {
      const reply = await model.complete({
        model: this.config.models[req.tier],
        system: req.system,
        prompt: req.prompt.slice(0, MAX_PROMPT_CHARS),
        image: req.image,
        maxTokens: Math.max(1, Math.min(req.maxTokens, MAX_TOKENS_CAP[req.tier])),
      });
      const costMicros = aiCostMicros(reply.usage, this.config.prices[req.tier]);
      await this.meter({ day, feature: req.feature, tier: req.tier, outcome: 'ok', usage: reply.usage, costMicros });
      return { ok: true, text: reply.text };
    } catch (err) {
      this.logger.warn(`appel IA échoué (${req.feature}) : ${err instanceof Error ? err.message : 'erreur'}`);
      await this.meter({ day, feature: req.feature, tier: req.tier, outcome: 'error', usage: NO_TOKENS, costMicros: 0 });
      return { ok: false, reason: 'error' };
    }
  }

  private async decline(day: string, req: AiRequest, reason: 'disabled' | 'budget'): Promise<AiResult> {
    await this.meter({ day, feature: req.feature, tier: req.tier, outcome: 'declined', usage: NO_TOKENS, costMicros: 0 });
    return { ok: false, reason };
  }

  private async meter(entry: Parameters<AiUsageStore['record']>[0]): Promise<void> {
    try {
      await this.store.record(entry);
      if (entry.costMicros > 0) {
        const key = `ai:spent:${entry.day}`;
        const cached = await this.cache.get<number>(key);
        if (cached !== undefined) await this.cache.set(key, cached + entry.costMicros, SPENT_TTL_MS);
      }
    } catch (err) {
      this.logger.warn(`compteur IA non écrit : ${err instanceof Error ? err.message : 'erreur'}`);
    }
  }
}
