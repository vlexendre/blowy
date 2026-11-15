import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { AxisBar } from '../molecules/AxisBar';
import { space } from '../theme';

export interface VisionAxisLook {
  /** « Foyer ». */
  name: string;
  /** De −100 à +100. */
  value: number;
  confidence: number;
  /** Le pôle vers lequel il penche, ou « entre les deux » (à droite du nom). */
  lean: string;
  /** Libellé lu (« Foyer : plutôt fonder un foyer »). */
  accessibilityLabel: string;
}

export interface VisionPanelProps {
  /** « Sa vision ». */
  title: string;
  /** « pour l’instant · indicatif ». */
  hint?: string;
  axes: readonly VisionAxisLook[];
  /** Phrase sous les barres (« C’est elle qui choisit qui il te présente. »). */
  footer?: string;
}

/** Sa vision, pour l'instant (V6-GCaractere) : cinq barres simples, remplies depuis le centre, l'une après l'autre. */
export function VisionPanel({ title, hint, axes, footer }: VisionPanelProps) {
  return (
    <Card padding="none" style={styles.card}>
      <View style={[layout.rowBetween, styles.head]}>
        <Text variant="bodyHeavy" size={20} accessibilityRole="header">
          {title}
        </Text>
        {hint ? (
          <Text size={13} muted style={styles.hint}>
            {hint}
          </Text>
        ) : null}
      </View>
      {axes.map((a, i) => (
        <View key={a.name} accessible accessibilityLabel={a.accessibilityLabel} style={styles.axis}>
          <View style={layout.rowBetween}>
            <Text variant="bodyHeavy" size={16}>
              {a.name}
            </Text>
            <Text size={14} muted numberOfLines={1} style={styles.lean}>
              {a.lean}
            </Text>
          </View>
          <AxisBar value={a.value} confidence={a.confidence} delay={120 + i * 70} />
        </View>
      ))}
      {footer ? (
        <Text size={15} muted style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: space.lg, gap: space.md + 2 },
  head: { gap: space.sm, alignItems: 'baseline' },
  hint: { flexShrink: 1, textAlign: 'right' },
  axis: { gap: space.sm },
  lean: { flexShrink: 1, marginLeft: space.md, textAlign: 'right' },
  footer: { marginTop: space.xs },
});
