import { forwardRef, type ReactNode, useEffect, useImperativeHandle, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { type HapticMoment, hapticFor } from '../lib/haptics';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { motion } from '../theme';

export interface PopInProps {
  children?: ReactNode;
  delay?: number;
  /** Échelle de départ. Défaut 0,4. */
  from?: number;
  /** Changer cette valeur rejoue le « pop » (ex. le nombre d'une pastille). */
  trigger?: string | number;
  /** Anime aussi la toute première apparition. Défaut vrai. */
  onMount?: boolean;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

/** Apparition en « pop » (ressort `pop`, un rebond) : pastilles, tuiles, bulles. Fondu court si animations réduites. */
export function PopIn({ children, delay = 0, from = 0.4, trigger, onMount = true, style, pointerEvents }: PopInProps) {
  const reduced = useReducedMotion();
  const s = useSharedValue(onMount ? from : 1);
  const o = useSharedValue(onMount ? 0 : 1);
  const first = useRef(true);
  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    if (isFirst && !onMount) return;
    if (reduced) {
      s.value = 1;
      if (isFirst) o.value = withDelay(delay, fadeTo(1, motion.fast));
      return;
    }
    if (isFirst) {
      s.value = withDelay(delay, withSpring(1, springs.pop));
      o.value = withDelay(delay, withTiming(1, { duration: motion.instant }));
    } else {
      // Re-pop : gonfle puis revient en rebondissant.
      s.value = withDelay(delay, withSequence(withTiming(1.25, { duration: motion.instant, easing: ease.out }), withSpring(1, springs.pop)));
      o.value = 1;
    }
  }, [trigger, reduced, delay, onMount, s, o]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[style, animated]} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  );
}

export interface ShakeHandle {
  /** Secoue (erreur, refus). */
  shake: () => void;
}

export interface ShakeProps {
  children?: ReactNode;
  /** À incrémenter pour secouer (alternative à la ref). 0 = rien. */
  trigger?: number;
  /** Amplitude (pt). Défaut 8. */
  distance?: number;
  /** Vibration jouée avec la secousse. Défaut `error` ; `false` pour aucune. */
  haptic?: HapticMoment | false;
  style?: StyleProp<ViewStyle>;
}

/** Secousse horizontale amortie (code faux, cadenas, refus). Avec animations réduites : bref clignement. */
export const Shake = forwardRef<ShakeHandle, ShakeProps>(function Shake({ children, trigger = 0, distance = 8, haptic = 'error', style }, ref) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const o = useSharedValue(1);
  const run = () => {
    if (haptic) hapticFor(haptic);
    if (reduced) {
      o.value = withSequence(fadeTo(0.45, motion.instant), fadeTo(1, motion.fast));
      return;
    }
    const d = distance;
    const step = (to: number, duration = 55) => withTiming(to, { duration, easing: ease.standard });
    x.value = withSequence(step(d, 45), step(-d), step(d * 0.6), step(-d * 0.6), step(d * 0.25), step(0, 70));
  };
  useImperativeHandle(ref, () => ({ shake: run }));
  const last = useRef(trigger);
  useEffect(() => {
    if (trigger !== last.current && trigger > 0) run();
    last.current = trigger;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateX: x.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
});

export interface PulseProps {
  children?: ReactNode;
  /** Pulse quand vrai (ex. le soin conseillé) ; repart à chaque passage à vrai. */
  active?: boolean;
  /** Nombre de battements avant de se reposer. Défaut 2. */
  beats?: number;
  /** Échelle au sommet d'un battement. Défaut 1,07. */
  scale?: number;
  /** Attente avant le premier battement (ms). Défaut 500. */
  delay?: number;
  /** Changer cette valeur relance les battements. */
  trigger?: string | number;
  style?: StyleProp<ViewStyle>;
}

/** Attire l'œil : `beats` battements puis repos (jamais en boucle). Rien si animations réduites. */
export function Pulse({ children, active = true, beats = 2, scale = 1.07, delay = 500, trigger, style }: PulseProps) {
  const reduced = useReducedMotion();
  const s = useSharedValue(1);
  useEffect(() => {
    if (!active || reduced) {
      s.value = withTiming(1, { duration: motion.fast });
      return;
    }
    const beat = () => withSequence(withTiming(scale, { duration: motion.fast, easing: ease.out }), withSpring(1, springs.pop));
    const seq = Array.from({ length: Math.max(1, beats) }, beat);
    const [head, ...tail] = seq;
    if (!head) return;
    s.value = withDelay(delay, tail.length ? withSequence(head, ...tail) : head);
  }, [active, reduced, beats, scale, delay, trigger, s]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
