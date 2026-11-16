import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { AxisBar } from '../molecules/AxisBar';
import { radius, space } from '../theme';

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

const GAP = space.md;

/**
 * Son style, en petit (V6-GCaractere) : quatre jauges côte à côte. Il donne sa personnalité au minimoa, sans filtrer.
 * Un nom de jauge ne se coupe jamais (« Brincalhão », « Praatgraag ») : les noms sont mesurés tels quels, et si l'un
 * d'eux ne tient pas dans un quart de la carte, les jauges passent sur deux colonnes.
 */
export function StylePanel({ title, hint, gauges, footer }: StylePanelProps) {
  const [rowWidth, setRowWidth] = useState(0);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const widest = Math.max(0, ...gauges.map((g) => widths[g.name] ?? 0));
  const columns = rowWidth > 0 && widest > (rowWidth - GAP * 3) / 4 ? 2 : 4;
  const cell = rowWidth > 0 ? { width: (rowWidth - GAP * (columns - 1)) / columns } : styles.flexCell;
  const measured = (name: string) => (e: LayoutChangeEvent) => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    setWidths((prev) => (prev[name] === w ? prev : { ...prev, [name]: w }));
  };
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
      <View style={[layout.row, styles.row]} onLayout={(e) => setRowWidth(Math.floor(e.nativeEvent.layout.width))}>
        {gauges.map((g, i) => (
          <View key={g.name} accessible accessibilityLabel={g.accessibilityLabel} style={[styles.gauge, cell]}>
            <Text variant="bodyBold" size={14} numberOfLines={1}>
              {g.name}
            </Text>
            <AxisBar value={g.value} height={6} delay={200 + i * 60} />
          </View>
        ))}
        {/* Mesure des noms à leur largeur naturelle (invisible, hors mise en page). */}
        <View style={styles.measure} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {gauges.map((g) => (
            <Text key={g.name} variant="bodyBold" size={14} numberOfLines={1} onLayout={measured(g.name)} style={styles.natural}>
              {g.name}
            </Text>
          ))}
        </View>
      </View>
      {footer ? (
        <Text size={13} muted>
          {footer}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: space.md + 2, gap: space.sm + 2 },
  head: { gap: space.sm, alignItems: 'baseline' },
  hint: { flexShrink: 1, textAlign: 'right' },
  row: { columnGap: GAP, rowGap: space.md, alignItems: 'flex-start', flexWrap: 'wrap' },
  gauge: { gap: space.sm },
  flexCell: { flex: 1 },
  measure: { position: 'absolute', left: 0, right: 0, top: 0, height: 0, overflow: 'hidden', opacity: 0, alignItems: 'flex-start' },
  natural: { flexShrink: 0, alignSelf: 'flex-start' },
});
