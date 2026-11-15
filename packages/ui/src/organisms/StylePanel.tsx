import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { AxisBar } from '../molecules/AxisBar';
import { space } from '../theme';

export interface StylePanelProps {
  /** « Son style ». */
  title: string;
  /** « ne filtre personne ». */
  hint?: string;
  /** Les quatre jauges : nom, valeur de −100 à 100, libellé lu. */
  gauges: readonly { name: string; value: number; accessibilityLabel: string }[];
  /** Phrase sous les jauges (ex. quand elles sont encore au centre : comment il prend forme). */
  footer?: string | null;
}

/** Son style, en petit (V6-GCaractere) : quatre jauges côte à côte. Il donne sa personnalité au minimoa, sans filtrer. */
export function StylePanel({ title, hint, gauges, footer }: StylePanelProps) {
  return (
    <Card padding="none" style={styles.card}>
      <View style={[layout.rowBetween, styles.head]}>
        <Text variant="bodyHeavy" size={18} accessibilityRole="header">
          {title}
        </Text>
        {hint ? (
          <Text size={13} muted style={styles.hint}>
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={[layout.row, styles.row]}>
        {gauges.map((g, i) => (
          <View key={g.name} accessible accessibilityLabel={g.accessibilityLabel} style={styles.gauge}>
            <Text variant="bodyBold" size={14} numberOfLines={1}>
              {g.name}
            </Text>
            <AxisBar value={g.value} height={6} delay={200 + i * 60} />
          </View>
        ))}
      </View>
      {footer ? (
        <Text size={15} muted>
          {footer}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: space.lg, gap: space.md },
  head: { gap: space.sm, alignItems: 'baseline' },
  hint: { flexShrink: 1, textAlign: 'right' },
  row: { gap: space.md, alignItems: 'flex-start' },
  gauge: { flex: 1, gap: space.sm },
});
