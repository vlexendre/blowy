/**
 * Port de lecture (V5 T3, V5.2 H.25) : nombre de duos actifs simultanés autorisés.
 * 1 duo actif gratuit ; Blowy+ = duos illimités (`null`). Implémentation : economy (`DUO_ALLOWANCE`),
 * consommée par `connections` (C2) pour refuser `409 DUO_LIMIT_REACHED`.
 */
export interface DuoAllowanceReader {
  maxActiveDuos(userId: string, at: Date): Promise<number | null>;
}
export const DUO_ALLOWANCE = Symbol('DuoAllowanceReader');
