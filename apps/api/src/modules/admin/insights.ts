import type { Day, Shape } from '@blowy/domain';
import type { DailyMetrics } from './ports';

/**
 * Ce que les autres chantiers apportent aux statistiques quotidiennes. Chaque méthode peut rendre null
 * (« pas encore branché ») ; l'administration l'affiche comme tel, sans inventer de chiffre.
 * - « rituels » : série moyenne des comptes actifs, forme et série d'un minimoa ;
 * - « vision » : rencontres proposées, compatibilité moyenne, répartition des visions.
 */
export interface AdminInsights {
  averageStreak(day: Day): Promise<number | null>;
  encountersProposed(day: Day): Promise<number | null>;
  averageCompatibility(day: Day): Promise<number | null>;
  shapes(day: Day): Promise<Record<Shape, number> | null>;
  visions(day: Day): Promise<DailyMetrics['visions']>;
  /** Forme et série des minimoas de ces personnes (classement « ceux qui vont le mieux »). */
  minimoaDetails(userIds: readonly string[]): Promise<DailyMetrics['topDetails']>;
}

/** Valeur par défaut : rien n'est encore fourni. */
export const NO_INSIGHTS: AdminInsights = {
  averageStreak: async () => null,
  encountersProposed: async () => null,
  averageCompatibility: async () => null,
  shapes: async () => null,
  visions: async () => null,
  minimoaDetails: async () => ({}),
};
