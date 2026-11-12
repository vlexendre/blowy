import { useEffect } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '../theme';
import { useMotionActive, useReducedMotion } from './motion-context';

export { MotionFocus, MotionProvider, useFocusPause, useForeground, useMotionActive, useReducedMotion } from './motion-context';
export type { MotionFocusProps, MotionProviderProps } from './motion-context';

const bezier = (c: readonly [number, number, number, number]) => Easing.bezier(c[0], c[1], c[2], c[3]);

/** Courbes des jetons `motion.curve`, prêtes pour `withTiming({ easing })`. */
export const ease = {
  standard: bezier(motion.curve.standard),
  out: bezier(motion.curve.out),
  in: bezier(motion.curve.in),
  inOut: bezier(motion.curve.inOut),
} as const;

/** Ressorts des jetons `motion.spring`. */
export const springs = motion.spring;

/**
 * Fondu qui joue même avec « réduire les animations » (Reanimated saute sinon directement à la fin) :
 * c'est le remplacement autorisé des déplacements.
 */
export function fadeTo(to: number, duration: number = motion.fast) {
  'worklet';
  return withTiming(to, { duration, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.Never });
}

/** Échelle d'appui selon la taille : un petit bouton s'enfonce plus qu'une grande carte (≈ 7 pt d'écrasement). */
export function pressScaleFor(width: number, height: number): number {
  const d = Math.max(width, height);
  if (!d) return 0.96;
  return Math.min(0.985, Math.max(0.9, 1 - 7 / d));
}

/** Relâchement : ressort raide avec un soupçon de dépassement (le bouton « rebondit » en revenant). */
const RELEASE = { damping: 14, stiffness: 420, mass: 0.6 } as const;

/**
 * Retour visuel d'appui : rétrécit vite (90 ms), revient en ressort ; atténuation seule si « réduire les animations ».
 * `to` : échelle visée, ou `'auto'` pour l'adapter à la taille mesurée (brancher `onLayout`).
 * `dimTo` : opacité pendant l'appui (1 = aucune atténuation).
 */
export function usePressFeedback(to: number | 'auto' = 0.96, baseOpacity = 1, dimTo = 1) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const fade = useSharedValue(1);
  const target = useSharedValue(to === 'auto' ? 0.96 : to);
  useEffect(() => {
    if (to !== 'auto') target.value = to;
  }, [to, target]);
  // `baseOpacity` : opacité demandée par le style (ex. bouton désactivé), que l'animation ne doit pas écraser.
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: fade.value * baseOpacity }), [baseOpacity]);
  return {
    animatedStyle,
    onLayout:
      to === 'auto'
        ? (e: LayoutChangeEvent) => {
            target.value = pressScaleFor(e.nativeEvent.layout.width, e.nativeEvent.layout.height);
          }
        : undefined,
    pressIn: () => {
      if (reduced) {
        fade.value = fadeTo(Math.min(dimTo, 0.75), motion.instant);
        return;
      }
      scale.value = withTiming(target.value, { duration: motion.instant, easing: ease.out });
      if (dimTo < 1) fade.value = withTiming(dimTo, { duration: motion.instant });
    },
    pressOut: () => {
      if (reduced) {
        fade.value = fadeTo(1, motion.fast);
        return;
      }
      scale.value = withSpring(1, RELEASE);
      if (dimTo < 1) fade.value = withTiming(1, { duration: motion.fast });
    },
    /** Petit rebond de confirmation (un état qui change : choisi, porté…). */
    bounce: (peak = 1.06) => {
      if (reduced) return;
      scale.value = withSequence(withTiming(peak, { duration: motion.instant, easing: ease.out }), withSpring(1, springs.pop));
    },
  };
}

/**
 * Boucle 0 → 1 → 0 sans fin (respiration, flottement, pulsation). Reste à 0 si animations réduites,
 * et s'arrête quand l'écran n'est plus au premier plan ou que l'app passe en arrière-plan.
 */
export function useLoop(duration: number = motion.breath, enabled = true, delay = 0): SharedValue<number> {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const t = useSharedValue(0);
  const run = enabled && !reduced && active;
  useEffect(() => {
    if (!run) {
      cancelAnimation(t);
      t.value = enabled && !reduced ? withTiming(0, { duration: motion.fast }) : 0;
      return;
    }
    const step = withSequence(withTiming(1, { duration, easing: ease.inOut }), withTiming(0, { duration, easing: ease.inOut }));
    t.value = delay > 0 ? withSequence(withTiming(0, { duration: delay }), withRepeat(step, -1)) : withRepeat(step, -1);
    return () => cancelAnimation(t);
  }, [duration, run, enabled, reduced, delay, t]);
  return t;
}

export interface AnimatedNumberOptions {
  duration?: number;
  /** Dépassement avant de se poser, en fraction de l'écart parcouru (0,08 = 8 %). Défaut 0. */
  overshoot?: number;
  /** Première valeur affichée (ex. 0 pour qu'une barre se remplisse à l'apparition). Défaut : `target`. */
  from?: number;
}

/**
 * Valeur animée qui suit `target` (barres, indicateurs, compteurs). Avec `overshoot`, elle dépasse un peu
 * puis revient en ressort. Saut direct si animations réduites.
 */
export function useAnimatedNumber(target: number, options: number | AnimatedNumberOptions = {}): SharedValue<number> {
  const { duration = motion.base, overshoot = 0, from } = typeof options === 'number' ? { duration: options } : options;
  const reduced = useReducedMotion();
  const v = useSharedValue(from ?? target);
  useEffect(() => {
    if (reduced) {
      v.value = target;
      return;
    }
    const delta = target - v.value;
    if (overshoot > 0 && Math.abs(delta) > 0.0001) {
      v.value = withSequence(withTiming(target + delta * overshoot, { duration: duration * 0.8, easing: ease.out }), withSpring(target, springs.pop));
    } else {
      v.value = withTiming(target, { duration, easing: ease.out });
    }
  }, [target, reduced, duration, overshoot, v]);
  return v;
}
