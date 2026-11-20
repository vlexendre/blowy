/** Progression (maquette V7) : lecture des compteurs déjà en base (rien n'est stocké en plus). */
import type { LifetimeStats, WeekActivity } from '@blowy/domain';

export const PROGRESSION_READER = Symbol('PROGRESSION_READER');

export interface ProgressionReader {
  /** Ce qu'une personne a fait depuis le début (sans la série, lue dans `ritual_states`). */
  lifetime(userId: string): Promise<Omit<LifetimeStats, 'bestStreak'>>;
  /** Ce que chacune de ces personnes a fait de `since` (compris) à `until` (exclu, null : maintenant), instants ISO. */
  week(userIds: readonly string[], since: string, until?: string | null): Promise<Map<string, WeekActivity>>;
  /** Personnes de la même zone que `userId` (sa zone de domicile), elle comprise, au plus `limit` ; vide quand elle n'a pas de position. */
  neighbours(userId: string, limit: number): Promise<string[]>;
}
