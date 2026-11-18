import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { CountUp } from '../motion/CountUp';
import { space, veil } from '../theme';

export interface StatLineItem {
  key: string;
  value: number;
  /** Ce que compte le nombre, déjà accordé (« liens », « jours, meilleure série »). */
  label: string;
  color?: string;
}

export interface StatLineProps {
  items: readonly StatLineItem[];
}

/**
 * Quelques chiffres sur une seule rangée basse : le nombre (titre, qui défile depuis 0 à la première apparition) et
 * ce qu'il compte, à côté. Filet fin entre deux chiffres. Rien n'est rendu sans chiffre.
 */
export function StatLine({ items }: StatLineProps) {
  if (!items.length) return null;
  return (
    <Card padding="none" style={styles.card}>
      {items.map((it, i) => (
        <View key={it.key} style={[styles.item, i > 0 && styles.sep]} accessible accessibilityLabel={`${it.value} ${it.label}`}>
          <CountUp value={it.value} from={0} variant="h2" size={24} color={it.color} />
          <Text variant="bodyBold" size={13} muted numberOfLines={2} style={styles.label}>
            {it.label}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 22, paddingVertical: space.sm + 2, paddingHorizontal: space.md + 2 },
  item: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 36 },
  sep: { borderLeftWidth: StyleSheet.hairlineWidth * 2, borderLeftColor: veil.line, paddingLeft: space.md, marginLeft: space.md },
  label: { flexShrink: 1, lineHeight: 16 },
});
