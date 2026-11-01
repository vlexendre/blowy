import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { Text } from '../atoms/Text';

export function SectionTitle({ label, trailing }: { label: string; trailing?: string }) {
  return (
    <View style={styles.row}>
      <Text variant="label" tone="muted" accessibilityRole="header">
        {label}
      </Text>
      {trailing ? (
        <Text variant="small" tone="muted">
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: space.md } });
