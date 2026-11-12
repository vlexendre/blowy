import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface ScrollLock {
  locked: boolean;
  /** Bloque (vrai) ou libère (faux) le défilement ; plusieurs demandeurs se cumulent. */
  setLocked: (locked: boolean) => void;
}

const ScrollLockContext = createContext<ScrollLock>({ locked: false, setLocked: () => undefined });

/**
 * Fourni par `ScreenTemplate` : un pet qu'on attrape bloque le défilement de l'écran le temps du geste,
 * pour que le doigt déplace le pet et pas la page.
 */
export function ScrollLockProvider({ children }: { children?: ReactNode }) {
  const [locked, set] = useState(false);
  const count = useRef(0);
  const setLocked = useCallback((on: boolean) => {
    count.current = Math.max(0, count.current + (on ? 1 : -1));
    set(count.current > 0);
  }, []);
  const value = useMemo(() => ({ locked, setLocked }), [locked, setLocked]);
  return <ScrollLockContext.Provider value={value}>{children}</ScrollLockContext.Provider>;
}

export function useScrollLock(): ScrollLock {
  return useContext(ScrollLockContext);
}
