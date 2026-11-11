import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useAnimatedNumber } from '../lib/motion';
import { color, motion, radius, veil } from '../theme';

export interface ProgressBarProps {
  /** Avancement de 0 à 1. */
  value: number;
  color?: string;
  trackColor?: string;
  /** Épaisseur. Défaut 10. */
  height?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Barre d'avancement animée (xp avant le niveau suivant). */
export function ProgressBar({ value, color: fill = color.accent, trackColor = veil.track, height = 10, accessibilityLabel, style }: ProgressBarProps) {
  const ratio = Math.max(0, Math.min(1, value));
  const v = useAnimatedNumber(ratio, motion.slow);
  const bar = useAnimatedStyle(() => ({ width: `${v.value * 100}%` }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      style={[styles.track, { height, backgroundColor: trackColor }, style]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: fill }, bar]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden', alignSelf: 'stretch' },
  fill: { height: '100%', borderRadius: radius.pill },
});
