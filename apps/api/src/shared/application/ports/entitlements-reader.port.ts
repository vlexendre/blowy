/**
 * Port de lecture des droits actifs (implémentation : agent G, module economy).
 * Consommé par pets (espèces premium) et matching/relations (capacité de rendez-vous).
 */
import type { EntitlementKey } from '@blowy/domain';

export interface EntitlementsReader {
  activeKeys(userId: string, at: Date): Promise<ReadonlySet<EntitlementKey>>;
  /** Nombre de rendez-vous simultanés autorisés (1 gratuit, 3 Blowy+). */
  dateSlots(userId: string, at: Date): Promise<number>;
}
export const ENTITLEMENTS_READER = Symbol('EntitlementsReader');
