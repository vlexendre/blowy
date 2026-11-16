/**
 * Règles de coût de l'IA (chantier « plateforme ») : prix, coût estimé d'un appel, budgets et plafond.
 * Pur : les montants sont en micro-dollars (1 µ$ = 0,000001 $) pour rester en entiers.
 */
export const AI_FEATURE_KEYS = ['habit_proof', 'chat_remark', 'weekly_review', 'moderation'] as const;
export type AiFeatureKey = (typeof AI_FEATURE_KEYS)[number];

export const AI_TIERS = ['small', 'medium'] as const;
export type AiTier = (typeof AI_TIERS)[number];

/** Prix en dollars par million de jetons. */
export interface AiPrice {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

/**
 * Prix publics au 15 novembre 2026 (https://platform.claude.com/docs/en/about-claude/pricing) :
 * small = Claude Haiku 5.5 (prompt ≤ 100 k jetons), medium = Claude Sonnet 5.5. Écrasables par la configuration.
 */
export const DEFAULT_AI_PRICES: Readonly<Record<AiTier, AiPrice>> = {
  small: { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
  medium: { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.1 },
};

export interface AiTokenUsage {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export const NO_TOKENS: AiTokenUsage = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };

/** Coût estimé en micro-dollars : jetons × ($ / million de jetons) = µ$. Arrondi au µ$ supérieur. */
export function aiCostMicros(usage: AiTokenUsage, price: AiPrice): number {
  const micros = usage.input * price.input + usage.output * price.output + usage.cacheWrite * price.cacheWrite + usage.cacheRead * price.cacheRead;
  return Math.ceil(micros);
}

export const dollarsToMicros = (usd: number): number => Math.round(usd * 1_000_000);
export const microsToDollars = (micros: number): number => micros / 1_000_000;

/**
 * Appels par personne et par jour, par fonction. Pensés pour que l'IA coûte presque rien :
 * - chat_remark : 4 (le chat est en plus plafonné à 3 interventions par lien et par jour, et seules les relances,
 *   remarques et garde-fous sur un lien où les deux ont dit oui appellent le modèle) ;
 * - habit_proof : 6 (2 habitudes gratuites, 6 avec Minimoa+, une preuve par jour au plus) ;
 * - weekly_review : 1 (le dimanche, comptes actifs seulement) ;
 * - moderation : 4 (confirmation d'un garde-fou déjà repéré par l'heuristique locale).
 */
export const DEFAULT_AI_USER_BUDGETS: Readonly<Record<AiFeatureKey, number>> = {
  habit_proof: 6,
  chat_remark: 4,
  weekly_review: 1,
  moderation: 4,
};

export type AiGate = 'ok' | 'disabled' | 'budget';

export interface AiGateInput {
  /** Interrupteur général (variable d'environnement) : tout est coupé. */
  killSwitch: boolean;
  /** Un modèle est configuré (clé présente ou adaptateur mémoire). */
  available: boolean;
  /** Dépense estimée du jour, tous comptes confondus, en µ$. */
  spentTodayMicros: number;
  /** Plafond global du jour, en µ$. */
  ceilingMicros: number;
  /** Appels déjà faits aujourd'hui par cette personne pour cette fonction. */
  userCallsToday: number;
  /** Budget de la personne pour cette fonction. */
  userBudget: number;
}

/** Décision prise avant tout appel : l'ordre compte (coupé → plafond global → budget personnel). */
export function aiGate(input: AiGateInput): AiGate {
  if (input.killSwitch || !input.available) return 'disabled';
  if (input.spentTodayMicros >= input.ceilingMicros) return 'budget';
  if (input.userCallsToday >= input.userBudget) return 'budget';
  return 'ok';
}

/** Lit « chat_remark=4,habit_proof=6 » ; les clés inconnues ou les valeurs invalides sont ignorées. */
export function parseAiBudgets(raw: string | undefined, base: Readonly<Record<AiFeatureKey, number>> = DEFAULT_AI_USER_BUDGETS): Record<AiFeatureKey, number> {
  const out: Record<AiFeatureKey, number> = { ...base };
  for (const part of (raw ?? '').split(',')) {
    const [key, value] = part.split('=').map((s) => s.trim());
    const n = Number(value);
    if (key && (AI_FEATURE_KEYS as readonly string[]).includes(key) && Number.isInteger(n) && n >= 0) out[key as AiFeatureKey] = n;
  }
  return out;
}
