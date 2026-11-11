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

/** Tuile chiffre + légende (profil, souvenirs). */
export function StatTile({ value, label, color, onPress, style }: StatTileProps) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${value} ${label}`} padding="md" style={[styles.base, style]}>
      <Text variant="h2" size={30} color={color} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="small" muted numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, minHeight: 92, gap: space.xs },
});
