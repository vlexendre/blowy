import { useEffect, useRef } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { type HapticMoment, hapticFor } from '../lib/haptics';
import { useInk } from '../lib/ink';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { motion } from '../theme';

export interface DrawnCheckProps {
  /** Côté de la boîte (pt). Défaut 20. */
  size?: number;
  /** Couleur du trait. Défaut : l'encre du contexte. */
  color?: string;
  /** Épaisseur du trait. Défaut ≈ 12 % de `size` (2 pt au moins). */
  strokeWidth?: number;
  /** Attente avant le tracé (ms). */
  delay?: number;
  /** Changer cette valeur retrace la coche. */
  trigger?: string | number;
  /** Vibration à la fin du tracé. Défaut aucune (`success` pour une réussite). */
  haptic?: HapticMoment | false;
  style?: StyleProp<ViewStyle>;
}

/** Points de la coche, en fraction de la boîte : départ, creux, pointe. */
const A = { x: 0.2, y: 0.53 };
const B = { x: 0.42, y: 0.74 };
const C = { x: 0.82, y: 0.3 };
/** Part du tracé consacrée au petit trait. */
const SHORT = 0.36;

function segment(from: { x: number; y: number }, to: { x: number; y: number }, s: number) {
  const dx = (to.x - from.x) * s;
  const dy = (to.y - from.y) * s;
  return { left: from.x * s, top: from.y * s, length: Math.hypot(dx, dy), angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

/**
 * Coche qui se dessine : le petit trait descend, puis le grand monte, et la coche rebondit une fois.
 * Transformations seulement (chaque trait s'allonge en `scaleX` depuis son départ). Animations réduites : fondu.
 * Décorative : à placer à côté d'un texte qui dit la même chose (« copié », « code bon »).
 */
export function DrawnCheck({ size = 20, color, strokeWidth, delay = 0, trigger, haptic = false, style }: DrawnCheckProps) {
  const ink = useInk();
  const tint = color ?? ink;
  const sw = strokeWidth ?? Math.max(2, Math.round(size * 0.12));
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  const o = useSharedValue(reduced ? 0 : 1);
  const pop = useSharedValue(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (reduced) {
      p.value = 1;
      o.value = 0;
      o.value = withDelay(Math.min(delay, motion.fast), fadeTo(1, motion.fast));
      if (haptic) timer.current = setTimeout(() => hapticFor(haptic), Math.min(delay, motion.fast));
      return;
    }
    const draw = motion.base + 60;
    o.value = 1;
    p.value = 0;
    p.value = withDelay(delay, withTiming(1, { duration: draw, easing: ease.inOut }));
    pop.value = 1;
    pop.value = withDelay(delay + draw - 40, withSequence(withTiming(1.18, { duration: motion.instant, easing: ease.out }), withSpring(1, springs.pop)));
    if (haptic) timer.current = setTimeout(() => hapticFor(haptic), delay + draw - 40);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, reduced, delay]);

  const a = segment(A, B, size);
  const b = segment(B, C, size);
  // Les traits débordent d'une demi-épaisseur à chaque bout pour que le creux soit bien fermé.
  const shortStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${a.angle}deg` }, { scaleX: Math.min(1, p.value / SHORT) }] }));
  const longStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${b.angle}deg` }, { scaleX: Math.max(0, (p.value - SHORT) / (1 - SHORT)) }] }));
  const whole = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: pop.value }] }));
  const bar = { position: 'absolute' as const, height: sw, borderRadius: sw / 2, backgroundColor: tint, transformOrigin: [sw / 2, sw / 2, 0] };
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, whole, style]}
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[bar, { left: a.left - sw / 2, top: a.top - sw / 2, width: a.length + sw }, shortStyle]} />
        <Animated.View style={[bar, { left: b.left - sw / 2, top: b.top - sw / 2, width: b.length + sw }, longStyle]} />
      </View>
    </Animated.View>
  );
}
