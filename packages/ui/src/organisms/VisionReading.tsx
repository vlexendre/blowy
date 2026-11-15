import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { AxisBar } from '../molecules/AxisBar';
import { Appear } from '../motion/Appear';
import { color, radius, space, veil } from '../theme';

export interface VisionReadingAxis {
  key: string;
  /** « Foyer ». */
  name: string;
  /** « assez sûr », « à affiner » : jamais un chiffre. */
  sureness: string;
  /** De −100 à +100. */
  value: number;
  confidence: number;
  low: string;
  high: string;
  /** Libellé lu (« Foyer : plutôt fonder un foyer, assez sûr »). */
  accessibilityLabel: string;
}

export interface VisionReadingProps {
  axes: readonly VisionReadingAxis[];
  /** « Indicatif. Il s’affine avec toi. » (toujours visible). */
  note: string;
}

/**
 * Ta vision, pour l'instant (V6-GTaVision) : les cinq axes en barres simples remplies depuis le centre, l'une après
 * l'autre ; sous chaque barre, ses deux pôles (celui vers lequel tu penches en gras). Une mention dit que c'est
 * indicatif. Aucun chiffre.
 */
export function VisionReading({ axes, note }: VisionReadingProps) {
  return (
    <View style={styles.card}>
      {axes.map((a, i) => (
        <Appear key={a.key} delay={120 + i * 80} distance={8}>
          <View accessible accessibilityLabel={a.accessibilityLabel} style={styles.axis}>
            <View style={layout.rowBetween}>
              <Text variant="bodyHeavy" size={17}>
                {a.name}
              </Text>
              <Text size={14} muted>
                {a.sureness}
              </Text>
            </View>
            <AxisBar value={a.value} confidence={a.confidence} delay={260 + i * 110} />
            <View style={[layout.rowBetween, styles.poles]}>
              <Text size={14} variant={a.value <= -20 ? 'bodyHeavy' : 'body'} muted={a.value > -20}>
                {a.low}
              </Text>
              <Text size={14} variant={a.value >= 20 ? 'bodyHeavy' : 'body'} muted={a.value < 20} style={styles.right}>
                {a.high}
              </Text>
            </View>
          </View>
        </Appear>
      ))}
      <View style={styles.rule} />
      <Text size={14} muted>
        {note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg - 4, borderWidth: 1, borderColor: veil.line, backgroundColor: color.panel, padding: 18, gap: space.md + 2 },
  axis: { gap: space.sm },
  poles: { gap: space.md },
  right: { textAlign: 'right' },
  rule: { height: 1, backgroundColor: veil.line },
});
