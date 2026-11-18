import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { AxisBar } from '../molecules/AxisBar';
import { Appear } from '../motion/Appear';
import { color, radius, space, veil } from '../theme';

export interface VisionReadingAxis {
  key: string;
  /** « Ici ou ailleurs ». */
  name: string;
  /** « assez net », « encore flou » : jamais un chiffre. */
  sureness: string;
  /** De −100 à +100. */
  value: number;
  confidence: number;
  low: string;
  high: string;
  /** Libellé lu (« Ici ou ailleurs : plutôt rester ici, assez net »). */
  accessibilityLabel: string;
}

export interface VisionReadingProps {
  axes: readonly VisionReadingAxis[];
  /** « Indicatif : ça se précise avec tes réponses du jour. » (toujours visible). */
  note: string;
  /** La phrase de synthèse, en tête (« Tu es plutôt quelqu’un qui aime prévoir et a de grands projets. »). */
  summary?: string;
  /** Sous la synthèse (« Nino te présentera des gens qui vont avec. »). */
  summaryNote?: string;
  /** Sous la synthèse : une action (partager la carte du résultat). */
  action?: ReactNode;
  /** Intertitre des barres quand il y a une synthèse (« Le détail »). */
  detailLabel?: string;
}

/**
 * Ta vision, pour l'instant (V6-GTaVision) : les cinq axes en barres simples remplies depuis le centre, l'une après
 * l'autre ; sous chaque barre, ses deux pôles (celui vers lequel tu penches en gras). Une mention dit que c'est
 * indicatif. Aucun chiffre.
 */
export function VisionReading({ axes, note, summary, summaryNote, action, detailLabel }: VisionReadingProps) {
  return (
    <View style={styles.wrap}>
      {summary ? (
        <Appear distance={8}>
          <View style={styles.summary}>
            <Text variant="bodyHeavy" size={22} color={color.dark} style={styles.summaryText}>
              {summary}
            </Text>
            {summaryNote ? (
              <Text size={15} color={color.dark}>
                {summaryNote}
              </Text>
            ) : null}
          </View>
        </Appear>
      ) : null}
      {action}
      {summary && detailLabel ? (
        <Text variant="label" muted style={styles.detail}>
          {detailLabel}
        </Text>
      ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  summary: { borderRadius: radius.card, backgroundColor: color.accent, padding: space.lg, gap: space.sm },
  summaryText: { lineHeight: 27 },
  detail: { marginTop: space.xs, marginLeft: space.xs },
  card: { borderRadius: radius.card, borderWidth: 1, borderColor: veil.line, backgroundColor: color.panel, padding: 14, gap: space.md },
  axis: { gap: space.sm },
  poles: { gap: space.md },
  right: { textAlign: 'right' },
  rule: { height: 1, backgroundColor: veil.line },
});
