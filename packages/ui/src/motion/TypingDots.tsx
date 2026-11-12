import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, type SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { useMotionActive, useReducedMotion } from '../lib/motion';
import { color } from '../theme';

export interface TypingDotsProps {
  /** Couleur des points. Défaut blanc. */
  color?: string;
  /** Diamètre d'un point. Défaut 7. */
  size?: number;
  /** Libellé lu (« Nino écrit… »). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const PERIOD = 1100;

function Dot({ t, index, size, tint }: { t: SharedValue<number>; index: number; size: number; tint: string }) {
  const style = useAnimatedStyle(() => {
    // Chaque point saute à son tour (décalage d'un sixième de période).
    const local = (t.value - index * 0.16 + 1) % 1;
    const up = local < 0.4 ? Math.sin((local / 0.4) * Math.PI) : 0;
    return { opacity: 0.4 + 0.6 * up, transform: [{ translateY: -size * 0.6 * up }] };
  });
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint }, style]} />;
}

/** « … » qui sautillent avant le message d'un pet. Fixes (estompés) si animations réduites ou hors écran. */
export function TypingDots({ color: tint = color.white, size = 7, accessibilityLabel, style }: TypingDotsProps) {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced || !active) {
      cancelAnimation(t);
      t.value = 0.9;
      return;
    }
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: PERIOD, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [reduced, active, t]);
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, { gap: size * 0.6, paddingVertical: size * 0.6 }, style]}
    >
      {[0, 1, 2].map((i) => (
        <Dot key={i} t={t} index={i} size={size} tint={tint} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
