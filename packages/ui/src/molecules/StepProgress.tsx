import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color, radius, space, veil } from '../theme';

export interface StepProgressProps {
  /** Étape courante, à partir de 1. */
  step: number;
  total: number;
  /** Affiche « 1 / 4 » à droite. Défaut vrai. */
  showCount?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Avancement de l'inscription : segments jaunes + compteur. */
export function StepProgress({ step, total, showCount = true, accessibilityLabel, style }: StepProgressProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `${step} / ${total}`}
      accessibilityValue={{ min: 1, max: total, now: step }}
      style={[layout.row, styles.base, style]}
    >
      <View style={[layout.row, layout.grow, styles.segments]}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.seg, { backgroundColor: i < step ? color.accent : veil.glassStrong }]} />
        ))}
      </View>
      {showCount ? (
        <View style={styles.count}>
          <Text variant="bodyBold" size={12}>{`${step} / ${total}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: space.md },
  segments: { gap: space.xs + 2 },
  seg: { flex: 1, height: 5, borderRadius: radius.pill },
  count: { paddingHorizontal: space.md - 2, paddingVertical: space.xs + 1, borderRadius: radius.pill, backgroundColor: veil.glass },
});
