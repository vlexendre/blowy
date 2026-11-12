import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { alpha, color, radius, space, veil } from '../theme';

export interface StepProgressProps {
  /** Étape courante, à partir de 1. */
  step: number;
  total: number;
  /** Étape courante en cours : son segment est jaune à 45 % (quiz de V6-Caractere). */
  pending?: boolean;
  /** Affiche « 1 / 4 » à droite. Défaut vrai. */
  showCount?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Avancement de l'inscription : segments jaunes + compteur. */
export function StepProgress({ step, total, pending, showCount = true, accessibilityLabel, style }: StepProgressProps) {
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
          <View key={i} style={[styles.seg, { backgroundColor: i < step - 1 || (i === step - 1 && !pending) ? color.accent : i === step - 1 ? CURRENT : OFF }]} />
        ))}
      </View>
      {showCount ? (
        <View style={styles.count}>
          <Text variant="bodyHeavy" size={12} style={styles.countText}>{`${step} / ${total}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Segment à venir : blanc à 16 % (maquettes). */
const OFF = alpha(color.white, 0.16);
const CURRENT = alpha(color.accent, 0.45);

const styles = StyleSheet.create({
  base: { gap: space.md },
  segments: { gap: 5 },
  seg: { flex: 1, height: 6, borderRadius: radius.pill },
  count: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: veil.track },
  countText: { lineHeight: 16 },
});
