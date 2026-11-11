import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '../theme';

/**
 * Retour visuel d'appui : léger rétrécissement avec ressort, ou simple atténuation
 * quand « réduire les animations » est activé.
 */
export function usePressFeedback(to = 0.96, baseOpacity = 1) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const fade = useSharedValue(1);
  // `baseOpacity` : opacité demandée par le style (ex. bouton désactivé), que l'animation ne doit pas écraser.
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: fade.value * baseOpacity }), [baseOpacity]);
  return {
    animatedStyle,
    pressIn: () => {
      if (reduced) fade.value = 0.75;
      else scale.value = withSpring(to, motion.press);
    },
    pressOut: () => {
      if (reduced) fade.value = 1;
      else scale.value = withSpring(1, motion.press);
    },
  };
}

/** Boucle 0 → 1 → 0 sans fin (respiration, flottement, pulsation). Reste à 0 si animations réduites. */
export function useLoop(duration: number = motion.breath, enabled = true, delay = 0): SharedValue<number> {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!enabled || reduced) {
      t.value = 0;
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    const step = withSequence(withTiming(1, { duration, easing: ease }), withTiming(0, { duration, easing: ease }));
    t.value = delay > 0 ? withSequence(withTiming(0, { duration: delay }), withRepeat(step, -1)) : withRepeat(step, -1);
    return () => cancelAnimation(t);
  }, [duration, enabled, reduced, delay, t]);
  return t;
}

/** Valeur animée qui suit `target` (barres, indicateurs). Saut direct si animations réduites. */
export function useAnimatedNumber(target: number, duration: number = motion.base): SharedValue<number> {
  const reduced = useReducedMotion();
  const v = useSharedValue(target);
  useEffect(() => {
    v.value = reduced ? target : withTiming(target, { duration, easing: Easing.out(Easing.cubic) });
  }, [target, reduced, duration, v]);
  return v;
}
