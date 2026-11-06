/**
 * Préférences d'accessibilité système observées en continu : réduire les animations et
 * réduire la transparence. Les composants qui animent en boucle les consultent ; les
 * confirmations (pop de validation) restent, sans boucle.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export interface A11yPrefs {
  reduceMotion: boolean;
  reduceTransparency: boolean;
  /** Verre dépoli autorisé : iOS et web (backdrop-filter) sans réduction de transparence. Android = fond opaque. */
  allowBlur: boolean;
}

const DEFAULT: A11yPrefs = {
  reduceMotion: false,
  reduceTransparency: false,
  allowBlur: Platform.OS === 'ios' || Platform.OS === 'web',
};
const A11yContext = createContext<A11yPrefs>(DEFAULT);

export function A11yPrefsProvider({
  children,
  override,
}: {
  children: ReactNode;
  override?: Partial<A11yPrefs>;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduceMotion(v));
    void AccessibilityInfo.isReduceTransparencyEnabled().then(
      (v) => alive && setReduceTransparency(v),
    );
    const a = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const b = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
    return () => {
      alive = false;
      a.remove();
      b.remove();
    };
  }, []);

  const value = useMemo<A11yPrefs>(() => {
    const base = {
      reduceMotion,
      reduceTransparency,
      allowBlur: (Platform.OS === 'ios' || Platform.OS === 'web') && !reduceTransparency,
    };
    return { ...base, ...override };
  }, [reduceMotion, reduceTransparency, override]);

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export const useA11yPrefs = (): A11yPrefs => useContext(A11yContext);
