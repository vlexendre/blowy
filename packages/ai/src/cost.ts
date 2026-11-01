/**
 * Estimation de coût DATÉE et configurable. Les tarifs ne sont pas codés en dur depuis la
 * mémoire : ils sont fournis par configuration (`AI_PRICE_TABLE_JSON`) avec leur date de
 * relevé. Sans table, le coût est estimé à 0 et `priceTableVersion = 'unset'` (le plafond
 * global en nombre d'appels reste actif).
 */
import { z } from 'zod';

export const PriceTableSchema = z.object({
  /** ex. "openai-pricing-2026-11-01" — date de relevé sur la page tarifs officielle. */
  version: z.string().min(3),
  models: z.record(
    z.string(),
    z.object({
      /** micro-dollars par million de tokens d'entrée / sortie. */
      inputPerMTok: z.number().nonnegative().default(0),
      outputPerMTok: z.number().nonnegative().default(0),
      /** micro-dollars par appel (modération, transcription à la minute ramenée à l'appel…). */
      perCall: z.number().nonnegative().default(0),
      perAudioMinute: z.number().nonnegative().default(0),
    }),
  ),
});
export type PriceTable = z.infer<typeof PriceTableSchema>;

export const UNSET_PRICES: PriceTable = { version: 'unset', models: {} };

export function parsePriceTable(json: string | undefined): PriceTable {
  if (!json) return UNSET_PRICES;
  return PriceTableSchema.parse(JSON.parse(json));
}

export function estimateCostMicros(t: PriceTable, model: string, u: { inputTokens?: number | null; outputTokens?: number | null; audioMs?: number }): number {
  const p = t.models[model];
  if (!p) return 0;
  const tokens = ((u.inputTokens ?? 0) * p.inputPerMTok + (u.outputTokens ?? 0) * p.outputPerMTok) / 1_000_000;
  const audio = u.audioMs ? (u.audioMs / 60_000) * p.perAudioMinute : 0;
  return Math.ceil(tokens + audio + p.perCall);
}
