import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { Text } from '../atoms/Text';

/** Paire libellé/valeur (fiche du pet, abonnement, carte de vision). */
export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}, ${value}`}>
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <Text variant="bodyStrong" style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.md, paddingVertical: space.xxs },
  value: { flexShrink: 1, textAlign: 'right' },
});
