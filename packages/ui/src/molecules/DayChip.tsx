import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { radius, space, veil } from '../theme';

export interface DayChipProps {
  label: string;
}

/** Séparateur de jour centré dans un fil (« aujourd'hui · mardi »). */
export function DayChip({ label }: DayChipProps) {
  return (
    <View accessible accessibilityRole="header" style={styles.base}>
      <Text variant="label" size={11} muted style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // `.daychip` : 11 px, 800, letter-spacing .12em, fond blanc à 7 %, padding 4 × 10.
  base: { alignSelf: 'center', paddingHorizontal: space.md - 2, paddingVertical: space.xs, borderRadius: radius.pill, backgroundColor: veil.hairline },
  text: { letterSpacing: 1.32 },
});
