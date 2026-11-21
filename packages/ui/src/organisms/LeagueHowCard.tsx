import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { color } from '../theme';

/** « Gagner des étincelles » (V6-Ligue) : une ligne par geste et ce qu'il rapporte. */
export function LeagueHowCard({ title, rows }: { title: string; rows: readonly { key: string; label: string; value: string }[] }) {
  return (
    <Card padding="none" style={styles.card}>
      <Text variant="bodyHeavy" size={17} accessibilityRole="header">
        {title}
      </Text>
      {rows.map((r, i) => (
        <View key={r.key} style={[styles.row, i === 0 ? styles.first : null]} accessible accessibilityLabel={`${r.label}, ${r.value}`}>
          <Text size={15} muted style={styles.label}>
            {r.label}
          </Text>
          <Text variant="bodyHeavy" size={15} color={color.white}>
            {r.value}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 14, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 4 },
  first: { marginTop: 8 },
  label: { flex: 1 },
});
