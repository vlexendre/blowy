/** Préférences V5 (intentions secrètes, préférences de sortie) — tables du module `users`. */
import type { IntentionsV5Dto, OutingPreferencesV5Dto } from '@blowy/api-contract';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';

export interface PreferencesV5Repository {
  intentions(userId: string): Promise<IntentionsV5Dto | null>;
  saveIntentions(scope: TxScope, userId: string, i: IntentionsV5Dto): Promise<void>;
  /** Retrait du consentement SENSITIVE_PREFERENCES : genres romance effacés, « une histoire » retirée. */
  clearSensitive(scope: TxScope, userId: string): Promise<void>;
  outingPreferences(userId: string): Promise<OutingPreferencesV5Dto | null>;
  saveOutingPreferences(scope: TxScope, userId: string, p: OutingPreferencesV5Dto): Promise<void>;
  /** Quartiers existants (non fermés) parmi `ids`. */
  existingNeighborhoods(ids: string[]): Promise<string[]>;
  /** Créneaux types actifs appartenant aux quartiers donnés, parmi `ids`. */
  slotTemplatesIn(ids: string[], neighborhoodIds: string[]): Promise<string[]>;
  ageOf(userId: string, at: Date): Promise<number | null>;
  /** V5.6 : quartier de la personne (défaut des préférences de sortie). */
  homeNeighborhood(userId: string): Promise<string | null>;
}
export const PREFERENCES_V5_REPOSITORY = Symbol('PreferencesV5Repository');
