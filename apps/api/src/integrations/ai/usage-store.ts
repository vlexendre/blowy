/** Compteur de l'IA : agrégats par jour, fonction et palier, et appels par personne et par jour (budgets). */
import type { AiFeatureKey, AiTier, AiTokenUsage, Day } from '@blowy/domain';

export const AI_USAGE_STORE = Symbol('AI_USAGE_STORE');

export type AiOutcome = 'ok' | 'declined' | 'error';

export interface AiUsageEntry {
  day: Day;
  feature: AiFeatureKey;
  tier: AiTier;
  outcome: AiOutcome;
  usage: AiTokenUsage;
  costMicros: number;
}

export interface AiUsageRecord {
  day: Day;
  feature: string;
  tier: AiTier;
  calls: number;
  declined: number;
  errors: number;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  costMicros: number;
}

export interface AiUsageStore {
  /** Dépense estimée du jour, tous comptes confondus (µ$). */
  spentMicros(day: Day): Promise<number>;
  userCalls(userId: string, day: Day, feature: AiFeatureKey): Promise<number>;
  /** Compte un appel de la personne si elle est sous `max` (atomique) ; faux sinon. */
  takeUserCall(userId: string, day: Day, feature: AiFeatureKey, max: number): Promise<boolean>;
  record(entry: AiUsageEntry): Promise<void>;
  /** Agrégats de `from` à `to` inclus, du plus récent au plus ancien. */
  list(from: Day, to: Day): Promise<AiUsageRecord[]>;
  /** Oublie les compteurs par personne avant `before` (ménage du minuteur). */
  purgeUserCalls(before: Day): Promise<number>;
}
