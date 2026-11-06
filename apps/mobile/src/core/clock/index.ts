/**
 * Port d'horloge : toutes les présentations relatives (« dans 2 jours », phase d'une sortie,
 * compte des créneaux) lisent `clock.now()`. Système par défaut ; figée uniquement par le mode
 * démo local (banc visuel) pour reproduire l'instant de chaque maquette.
 */
import { useEffect, useState } from 'react';

export interface ClockPort {
  now(): number;
}

let frozen: number | null = null;

export const clock: ClockPort = { now: () => frozen ?? Date.now() };

/** Fige l'horloge (mode démo local seulement — appelé par core/demo). */
export function freezeClock(ms: number | null): void {
  frozen = ms;
}

export const isClockFrozen = (): boolean => frozen !== null;

/** Instant courant, rafraîchi toutes les `refreshMs` (aucun rafraîchissement si l'horloge est figée). */
export function useNow(refreshMs = 60_000): number {
  const [now, setNow] = useState(() => clock.now());
  useEffect(() => {
    if (frozen !== null) return;
    const id = setInterval(() => setNow(clock.now()), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);
  return now;
}
