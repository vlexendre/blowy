import { MAX_LIVES } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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

/** `clip-path` des cœurs de la maquette (`.hearts i`, 14 × 13). */
const HEART = 'M7 13 C2 9 0 6.5 0 4 A3.6 3.6 0 0 1 7 2.6 A3.6 3.6 0 0 1 14 4 C14 6.5 12 9 7 13 Z';

/** Les vies d'un lien : n cœurs pleins sur 7, les perdus estompés. */
export function Hearts({ lives, max = MAX_LIVES, size = sizes.heart, ghost, accessibilityLabel, style }: HeartsProps) {
  const ink = useInk();
  const on = Math.max(0, Math.min(max, ghost ? 0 : lives));
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? `${on}/${max}`} style={[styles.row, { gap: Math.max(2, Math.round(size / 5)) }, style]}>
      {Array.from({ length: max }, (_, i) => (
        <Svg key={i} width={size} height={(size * 13) / 14} viewBox="0 0 14 13" style={i < on ? null : styles.off}>
          <Path d={HEART} fill={i < on ? extra.heart : ink} />
        </Svg>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  off: { opacity: 0.2 },
});
