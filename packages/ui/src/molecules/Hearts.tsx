import { MAX_LIVES } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { useInk } from '../lib/ink';
import { alpha, extra, size as sizes } from '../theme';

export interface HeartsProps {
  /** Vies restantes. */
  lives: number;
  max?: number;
  /** Taille d'un cœur. Défaut 14. */
  size?: number;
  /** Lien fantôme : tous les cœurs éteints. */
  ghost?: boolean;
  /** Libellé lu (« 5 vies sur 7 ») ; défaut « 5/7 ». */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Les vies d'un lien : n cœurs pleins sur 7, les perdus estompés. */
export function Hearts({ lives, max = MAX_LIVES, size = sizes.heart, ghost, accessibilityLabel, style }: HeartsProps) {
  const ink = useInk();
  const off = alpha(ink, 0.2);
  const on = Math.max(0, Math.min(max, ghost ? 0 : lives));
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? `${on}/${max}`} style={[styles.row, { gap: Math.max(2, Math.round(size / 5)) }, style]}>
      {Array.from({ length: max }, (_, i) => (
        <Glyph key={i} name="heart" size={size} color={i < on ? extra.heart : off} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
