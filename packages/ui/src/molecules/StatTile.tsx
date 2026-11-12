import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { space } from '../theme';

export interface StatTileProps {
  /** Valeur en Anton (« 6 », « 12 J »). */
  value: string;
  label: string;
  /** Couleur de la valeur. Défaut blanc. */
  color?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const VALUE = 30;

/** Tuile chiffre + légende (`.card` 10 × 12 de Moi). */
export function StatTile({ value, label, color, onPress, style }: StatTileProps) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${value} ${label}`} padding="none" style={[styles.base, style]}>
      <Text variant="h2" size={VALUE} color={color} numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
        {value}
      </Text>
      <Text variant="small" size={12} muted numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, borderRadius: 24, paddingVertical: space.sm + 2, paddingHorizontal: space.md },
  value: { lineHeight: Math.round(VALUE * 0.96), letterSpacing: VALUE * 0.005 },
});
