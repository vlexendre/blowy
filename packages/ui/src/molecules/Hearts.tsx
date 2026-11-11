import { MAX_LIVES } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { useInk } from '../lib/ink';
import { extra, size as sizes } from '../theme';

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
  const on = Math.max(0, Math.min(max, ghost ? 0 : lives));
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? `${on}/${max}`} style={[styles.row, { gap: Math.max(2, Math.round(size / 5)) }, style]}>
      {Array.from({ length: max }, (_, i) => (
        <View key={i} needsOffscreenAlphaCompositing={i >= on} style={i < on ? null : styles.off}>
          <Glyph name="heart" size={size} color={i < on ? extra.heart : ink} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  off: { opacity: 0.2 },
});
