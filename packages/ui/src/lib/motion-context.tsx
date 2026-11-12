import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useReducedMotion as useSystemReducedMotion } from 'react-native-reanimated';

interface MotionState {
  /** Forçage de « réduire les animations » (dév, tests) ; `null` = réglage du système. */
  reducedOverride: boolean | null;
  /** L'app est au premier plan. */
  appActive: boolean;
  /** S'incrémente à chaque retour de l'app au premier plan (après un passage en arrière-plan). */
  foreground: number;
}

const MotionContext = createContext<MotionState>({ reducedOverride: null, appActive: true, foreground: 0 });
const FocusContext = createContext<boolean>(true);

export interface MotionProviderProps {
  children?: ReactNode;
  /** Force « réduire les animations » (`true` / `false`) ; défaut : le réglage du système. */
  reduced?: boolean | null;
}

/**
 * À poser une fois à la racine de l'app (dans `MotionHost` ou au-dessus) : suit l'état de l'app
 * (premier plan / arrière-plan) pour mettre en pause les boucles, et annonce les retours au premier plan.
 */
export function MotionProvider({ children, reduced = null }: MotionProviderProps) {
  const [appActive, setAppActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [foreground, setForeground] = useState(0);
  const wasBackground = useRef(false);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'background') wasBackground.current = true;
      const active = s === 'active';
      setAppActive(active);
      if (active && wasBackground.current) {
        wasBackground.current = false;
        setForeground((n) => n + 1);
      }
    });
    return () => sub.remove();
  }, []);
  const parent = useContext(MotionContext);
  const value = useMemo(
    () => ({ reducedOverride: reduced ?? parent.reducedOverride, appActive: appActive && parent.appActive, foreground: foreground + parent.foreground }),
    [reduced, parent.reducedOverride, parent.appActive, parent.foreground, appActive, foreground],
  );
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export interface MotionFocusProps {
  /** L'écran est au premier plan (ex. `useIsFocused()` d'expo-router). */
  active: boolean;
  children?: ReactNode;
}

/** Délimite un écran : ses boucles s'arrêtent quand `active` est faux (onglet quitté, écran recouvert). */
export function MotionFocus({ active, children }: MotionFocusProps) {
  const parent = useContext(FocusContext);
  return <FocusContext.Provider value={parent && active}>{children}</FocusContext.Provider>;
}

/** Vrai quand les boucles doivent s'arrêter : écran pas au premier plan ou app en arrière-plan. */
export function useFocusPause(): boolean {
  const { appActive } = useContext(MotionContext);
  const focused = useContext(FocusContext);
  return !appActive || !focused;
}

/** Inverse de `useFocusPause` : les boucles peuvent tourner. */
export function useMotionActive(): boolean {
  return !useFocusPause();
}

/**
 * « Réduire les animations » : réglage du système, ou forçage de `MotionProvider`.
 * Quand c'est vrai : plus de déplacements ni de boucles, seulement des fondus courts et les changements d'état.
 */
export function useReducedMotion(): boolean {
  const system = useSystemReducedMotion();
  const { reducedOverride } = useContext(MotionContext);
  return reducedOverride ?? system;
}

/** Appelle `onReturn` à chaque retour de l'app au premier plan (pas au premier rendu). */
export function useForeground(onReturn: () => void): void {
  const { foreground } = useContext(MotionContext);
  const cb = useRef(onReturn);
  cb.current = onReturn;
  const first = useRef(foreground);
  useEffect(() => {
    if (foreground !== first.current) cb.current();
  }, [foreground]);
}
