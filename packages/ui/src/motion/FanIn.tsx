import { type ReactNode, useEffect } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { fadeTo, springs, useReducedMotion } from '../lib/motion';
import { motion } from '../theme';
import { useFirstTime } from './once';

export interface FanInProps {
  children?: ReactNode;
  /** Rang de la carte dans le paquet (décalage et côté d'où elle pivote). */
  index: number;
  /** Clé unique : la carte ne s'anime qu'à sa toute première apparition dans la session. */
  once?: string;
  /** Attente avant la première carte (ms). */
  delay?: number;
  /** Décalage entre deux cartes (ms). Défaut 90. */
  step?: number;
  style?: StyleProp<ViewStyle>;
}

/** Au-delà de ce rang, les cartes arrivent d'un bloc. */
const MAX = 6;

/**
 * Cartes qui arrivent en éventail : chacune pivote autour d'un point sous elle (une fois à gauche, une fois à
 * droite), monte et se redresse en ressort, la suivante un peu après. Fondu décalé si animations réduites.
 */
export function FanIn({ children, index, once, delay = 0, step = 90, style }: FanInProps) {
  const reduced = useReducedMotion();
  const first = useFirstTime(once);
  const play = first;
  const p = useSharedValue(play ? 0 : 1);
  const o = useSharedValue(play ? 0 : 1);
  const side = index % 2 === 0 ? -1 : 1;
  useEffect(() => {
    if (!play) return;
    const at = delay + Math.min(index, MAX) * step;
    if (reduced) {
      p.value = 1;
      o.value = withDelay(Math.min(at, motion.base), fadeTo(1, motion.fast));
      return;
    }
    o.value = withDelay(at, withTiming(1, { duration: motion.fast }));
    p.value = withDelay(at, withSpring(1, springs.soft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animated = useAnimatedStyle(() => {
    const k = 1 - p.value;
    return { opacity: o.value, transform: [{ translateY: 46 * k }, { rotate: `${side * 9 * k}deg` }, { scale: 1 - 0.06 * k }] };
  });
  return <Animated.View style={[styles.pivot, style, animated]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  // Pivot sous la carte : elle balaie comme une carte qu'on étale.
  pivot: { transformOrigin: '50% 140%' },
});
