/**
 * Horloge d'animation partagée. Trois modes, décidés une fois pour tout le sous-arbre :
 * - `live`   : chaque animation échantillonne ses keyframes CSS à chaque frame (Reanimated, UI thread) ;
 * - `rest`   : « Réduire les animations » actif → pose de repos fixe (fin des entrées, début des boucles) ;
 * - `frozen` : `<MotionClockProvider frozenAtMs={t}>` → pose exacte à l'instant t (captures, preuves
 *   pixel contre une maquette rendue à t, tests visuels déterministes).
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { useA11yPrefs } from './accessibility';
import { restValues, sampleKeyframes, toTransform, type KeyframeName, type KeyframeValues, type PlayOptions } from './keyframes';

interface MotionClock {
  frozenAtMs: number | null;
}
const MotionClockContext = createContext<MotionClock>({ frozenAtMs: null });

export function MotionClockProvider({ frozenAtMs = null, children }: { frozenAtMs?: number | null; children: ReactNode }) {
  const value = useMemo(() => ({ frozenAtMs }), [frozenAtMs]);
  return <MotionClockContext.Provider value={value}>{children}</MotionClockContext.Provider>;
}

export type MotionMode = 'live' | 'rest' | 'frozen';

export function useMotionMode(): { mode: MotionMode; frozenAtMs: number } {
  const { frozenAtMs } = useContext(MotionClockContext);
  const { reduceMotion } = useA11yPrefs();
  if (frozenAtMs != null) return { mode: 'frozen', frozenAtMs };
  return { mode: reduceMotion ? 'rest' : 'live', frozenAtMs: 0 };
}

/** Valeurs statiques (modes `rest` / `frozen`). */
export function staticKeyframeValues(name: KeyframeName, mode: MotionMode, frozenAtMs: number, opts: PlayOptions): KeyframeValues {
  return mode === 'frozen' ? sampleKeyframes(name, frozenAtMs, opts) : restValues(name);
}

export interface KeyframeStyleOptions extends PlayOptions {
  /** Désactive l'animation (pose de repos), ex. composant non visible. */
  disabled?: boolean;
  /** Applique aussi l'opacité de l'animation (entrées `pop`, `bounce`). */
  withOpacity?: boolean;
}

const styleOf = (v: KeyframeValues, withOpacity: boolean): ViewStyle => {
  'worklet';
  return withOpacity ? { transform: toTransform(v), opacity: v.o } : { transform: toTransform(v) };
};

/**
 * Style animé d'une animation de maquette (`pop`, `sq`, `drift`, `orbit`, `peek`, `beat`…).
 * Exemple : `<Animated.View style={[{ transformOrigin: '50% 100%' }, useKeyframeStyle('sq', { delayMs: -600 })]} />`.
 */
export function useKeyframeStyle(name: KeyframeName, opts: KeyframeStyleOptions = {}) {
  const { mode, frozenAtMs } = useMotionMode();
  const live = mode === 'live' && !opts.disabled;
  const withOpacity = !!opts.withOpacity;
  const { delayMs, reverse, durationMs } = opts;
  const t = useSharedValue(0);
  useFrameCallback((f) => {
    t.value = f.timeSinceFirstFrame;
  }, live);
  const still = live ? null : styleOf(opts.disabled ? restValues(name) : staticKeyframeValues(name, mode, frozenAtMs, { delayMs, reverse, durationMs }), withOpacity);
  const animated = useAnimatedStyle(() => {
    if (!live) return {};
    return styleOf(sampleKeyframes(name, t.value, { delayMs, reverse, durationMs }), withOpacity);
  }, [live, name, delayMs, reverse, durationMs, withOpacity]);
  return still ?? animated;
}

/** Valeur brute (ex. anneau `pulse` dont on anime l'étalement et l'alpha). */
export function useKeyframeValues(name: KeyframeName, opts: PlayOptions = {}) {
  const { mode, frozenAtMs } = useMotionMode();
  const live = mode === 'live';
  const t = useSharedValue(0);
  useFrameCallback((f) => {
    t.value = f.timeSinceFirstFrame;
  }, live);
  return { live, t, still: live ? null : staticKeyframeValues(name, mode, frozenAtMs, opts) };
}
