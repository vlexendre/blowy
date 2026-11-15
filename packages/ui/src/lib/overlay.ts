import { useEffect, useSyncExternalStore } from 'react';

/**
 * Feuilles et modales ouvertes (`SheetTemplate`, `UnlockSheet`) : un pet décoratif (salut, tête au-dessus des
 * onglets) ne doit jamais passer par-dessus une feuille. Compteur global, lu par `useOverlayOpen`.
 */
let open = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const snapshot = () => open > 0;

/** Vrai tant qu'une feuille est ouverte. */
export function isOverlayOpen(): boolean {
  return open > 0;
}

/** Vrai tant qu'une feuille est ouverte (se met à jour). */
export function useOverlayOpen(): boolean {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** À appeler dans une feuille : la déclare ouverte tant que `shown` est vrai. */
export function useOverlay(shown: boolean): void {
  useEffect(() => {
    if (!shown) return;
    open += 1;
    emit();
    return () => {
      open = Math.max(0, open - 1);
      emit();
    };
  }, [shown]);
}
