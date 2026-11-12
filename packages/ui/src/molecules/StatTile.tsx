import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { CountUp } from '../motion/CountUp';
import { space, type } from '../theme';

export interface StatTileProps {
  /** Valeur en Anton (« 6 », « 12 J »). */
  value: string;
  label: string;
  /** Couleur de la valeur. Défaut blanc. */
  color?: string;
  /**
   * Valeur numérique : elle défile depuis 0 à la première apparition (compteur), puis d'une valeur à l'autre.
   * `value` reste le libellé lu ; `suffix` suit le nombre (« J »).
   */
  count?: number;
  suffix?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const VALUE = 30;
const LINE = Math.round(VALUE * 0.96);
/** Interlignage du compteur (celui de `h2` à ce corps). */
const COUNT_LINE = Math.round(VALUE * (type.h2.lineHeight / type.h2.fontSize));

/** Tuile chiffre + légende (`.card` 10 × 12 de Moi). */
export function StatTile({ value, label, color, count, suffix, onPress, style }: StatTileProps) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${value} ${label}`} padding="none" style={[styles.base, style]}>
      {count !== undefined ? (
        // Même boîte que le texte fixe (interlignage .96) : le compteur, plus haut, est recentré dedans.
        <View style={styles.count}>
          <CountUp value={count} from={0} variant="h2" size={VALUE} color={color} suffix={suffix} accessibilityLabel={value} style={styles.countInner} />
        </View>
      ) : (
        <Text variant="h2" size={VALUE} color={color} numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
          {value}
        </Text>
      )}
      <Text variant="small" size={12} muted numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, borderRadius: 24, paddingVertical: space.sm + 2, paddingHorizontal: space.md },
  value: { lineHeight: Math.round(VALUE * 0.96), letterSpacing: VALUE * 0.005 },
  count: { height: LINE, overflow: 'hidden' },
  countInner: { marginTop: (LINE - COUNT_LINE) / 2 },
});
