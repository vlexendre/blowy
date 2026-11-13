import { useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { useAnimatedNumber } from '../lib/motion';
import { layout } from '../lib/styles';
import { PillSpan } from '../motion/PillSpan';
import { color, motion, radius } from '../theme';

export interface ProgressLineProps {
  /** Avancement de 0 à 1. */
  value: number;
  /** D'où part la barre à l'apparition (l'étape d'avant). Défaut `value − 0,2`. */
  from?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const LINE = 6;

/**
 * Barre d'avancement continue de l'inscription (6 pt, piste `card`, remplissage jaune). À l'arrivée, elle avance depuis
 * l'étape d'avant avec un léger dépassement ; quand `value` change sur place (quiz), elle glisse jusqu'à la nouvelle
 * valeur (transformations seulement, voir `PillSpan`). Animations réduites : saut direct.
 */
export function ProgressLine({ value, from, accessibilityLabel, style }: ProgressLineProps) {
  const v = Math.max(0, Math.min(1, value));
  const [width, setWidth] = useState(0);
  const p = useAnimatedNumber(v, { from: Math.max(0, Math.min(1, from ?? v - 0.2)), duration: motion.slow, overshoot: 0.08 });
  const start = useSharedValue(0);
  const to = useDerivedValue(() => Math.max(LINE, Math.min(1, p.value) * width));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[layout.grow, styles.line, style]}
    >
      {width ? <PillSpan from={start} to={to} height={LINE} color={color.accent} span={width} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: LINE, borderRadius: radius.pill, backgroundColor: color.card },
});
