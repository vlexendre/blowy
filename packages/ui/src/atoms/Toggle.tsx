import { useEffect, useRef } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { ease, fadeTo, useReducedMotion } from '../lib/motion';
import { color, extra, motion, radius } from '../theme';
import { Pressable } from './Pressable';

export interface ToggleProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  /** Libellé lu (obligatoire : l'interrupteur n'a pas de texte). */
  accessibilityLabel: string;
  /** Piste éteinte ; défaut `.sw.off` des réglages. */
  offColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const W = 52;
const H = 32;
const KNOB = 26;
const INSET = 3;
const TRAVEL = W - KNOB - INSET * 2;
/** Ressort de la pastille : arrive vite, dépasse un peu, se pose. */
const KNOB_SPRING = { damping: 13, stiffness: 260, mass: 0.7 } as const;

/**
 * Interrupteur des maquettes (`.sw`) : piste 52 × 32, jaune allumé, pastille blanche. La pastille file en ressort
 * et s'étire dans sa course ; le jaune arrive en fondu. Animations réduites : fondu de la piste, pastille posée.
 */
export function Toggle({ value, onValueChange, accessibilityLabel, offColor = extra.switchOff, disabled, style }: ToggleProps) {
  const reduced = useReducedMotion();
  const x = useSharedValue(value ? 1 : 0);
  const on = useSharedValue(value ? 1 : 0);
  const stretch = useSharedValue(0);
  const dir = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const to = value ? 1 : 0;
    if (reduced) {
      x.value = to;
      on.value = fadeTo(to, motion.fast);
      return;
    }
    dir.value = value ? 1 : -1;
    x.value = withSpring(to, KNOB_SPRING);
    on.value = withTiming(to, { duration: motion.fast, easing: ease.standard });
    stretch.value = withSequence(withTiming(1, { duration: motion.instant, easing: ease.out }), withSpring(0, { damping: 14, stiffness: 300 }));
  }, [value, reduced, x, on, stretch, dir]);
  const knob = useAnimatedStyle(() => {
    // Étirement dans le sens de la course, ancré du côté d'où elle part.
    const s = 1 + stretch.value * 0.28;
    const shift = (s - 1) * KNOB * 0.5 * dir.value;
    return { transform: [{ translateX: x.value * TRAVEL + shift }, { scaleX: s }, { scaleY: 1 - stretch.value * 0.08 }] };
  });
  const lit = useAnimatedStyle(() => ({ opacity: on.value }));
  return (
    <Pressable
      onPress={onValueChange ? () => onValueChange(!value) : undefined}
      disabled={disabled}
      haptic="selection"
      scaleTo={0.94}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={[styles.track, { backgroundColor: offColor }, disabled && styles.disabled, style]}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.lit, lit]} />
      <Animated.View style={[styles.knob, knob]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: radius.pill, flexShrink: 0 },
  lit: { borderRadius: radius.pill, backgroundColor: color.accent },
  knob: { position: 'absolute', top: INSET, left: INSET, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: color.white },
  disabled: { opacity: 0.5 },
});
