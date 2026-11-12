import { useEffect } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

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

/** Interrupteur des maquettes (`.sw`) : piste 52 × 32, jaune allumé, pastille blanche. */
export function Toggle({ value, onValueChange, accessibilityLabel, offColor = extra.switchOff, disabled, style }: ToggleProps) {
  const reduced = useReducedMotion();
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    x.value = reduced ? (value ? 1 : 0) : withTiming(value ? 1 : 0, { duration: motion.fast });
  }, [value, reduced, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * (W - KNOB - INSET * 2) }] }));
  return (
    <Pressable
      onPress={onValueChange ? () => onValueChange(!value) : undefined}
      disabled={disabled}
      haptic="selection"
      scaleTo={1}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={[styles.track, { backgroundColor: value ? color.accent : offColor }, disabled && styles.disabled, style]}
    >
      <Animated.View style={[styles.knob, knob]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: radius.pill, flexShrink: 0 },
  knob: { position: 'absolute', top: INSET, left: INSET, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: color.white },
  disabled: { opacity: 0.5 },
});
