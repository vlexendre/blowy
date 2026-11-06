/**
 * @blowy/tuning — paramètres versionnés du jeu (schéma Zod + version par défaut).
 * Consommateurs : pet-engine, matching, content, backend (economy, notifications, jobs), admin.
 */
import { TuningSchema, type Tuning } from './schema.js';
import { deepFreeze } from './freeze.js';

export { TuningSchema, GaugesSchema, type Tuning, type NotificationCategory } from './schema.js';
export { DEFAULT_TUNING, DEFAULT_TUNING_VERSION } from './defaults.js';
export * from './schema-v5.js';
export * from './defaults-v5.js';
export { clamp, clamp01, mulDivFloor, PERMILLE } from './math.js';
export { coinRewards, catalogPrices, petXpWeekendMultiplier, type CoinRewards, type CatalogPrices } from './economy.js';

/** Valide un tuning (ex. publication admin) et renvoie une copie gelée ; lève une ZodError sinon. */
export function parseTuning(input: unknown): Readonly<Tuning> {
  return deepFreeze(TuningSchema.parse(input));
}

/** Variante sans exception, pour les formulaires admin. */
export function safeParseTuning(input: unknown) {
  return TuningSchema.safeParse(input);
}
