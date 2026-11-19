import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Glyph } from '../atoms/Glyph';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { AxisBar } from '../molecules/AxisBar';
import { color, radius, space, veil } from '../theme';

export interface MinimoaTypeCardProps {
  /** « Ton type Minimoa ». */
  kicker: string;
  /** « Le phare » ; null tant que le minimoa n'en sait pas assez. */
  name: string | null;
  /** La phrase du type, ou ce qu'il faut pour le découvrir (`typeHint`). */
  line: string;
  species: Species;
}

/** Le type de minimoa en tête de Moi (V6-Moi) : un panneau jaune, le nom du type, sa phrase, le minimoa qui dépasse. */
export function MinimoaTypeCard({ kicker, name, line, species }: MinimoaTypeCardProps) {
  return (
    <Panel gradient="accent" radius={28} padding="lg" overflow style={styles.type}>
      <View style={styles.typeText}>
        <Text variant="label" color={color.dark}>
          {kicker}
        </Text>
        {name ? (
          <Text variant="h2" size={34} color={color.dark}>
            {name}
          </Text>
        ) : null}
        <Text variant="bodyBold" size={14} color={color.dark}>
          {line}
        </Text>
      </View>
      <View pointerEvents="none" style={styles.typePet}>
        <PetImage species={species} mood="joie" size={120} />
      </View>
    </Panel>
  );
}

export interface KnowsGauge {
  key: string;
  name: string;
  low: string;
  high: string;
  value: number;
  confidence: number;
  /** Encore floue : grisée, sans repère. */
  foggy: boolean;
  /** « Énergie sociale · encore flou ». */
  label: string;
  accessibilityLabel: string;
}

export interface KnowsPanelProps {
  /** « Ce que Nino sait de toi ». */
  title: string;
  /** « Il te connaît bien · 2 sur 3 ». */
  level: string;
  gauges: readonly KnowsGauge[];
  /** Ligne cliquable sous les jauges (« Tes valeurs se précisent bientôt · Ton chemin »). */
  more?: { title: string; text: string; onPress: () => void } | null;
}

/**
 * « Ce que Nino sait de toi » (V6-Moi) : le niveau (« il te connaît bien »), puis une jauge par axe entre ses deux
 * pôles ; celles qu'il ne connaît pas encore sont grisées (« encore flou »). Jamais un chiffre.
 */
export function KnowsPanel({ title, level, gauges, more }: KnowsPanelProps) {
  return (
    <View style={styles.card}>
      <View>
        <Text variant="label">{title}</Text>
        <Text variant="bodyHeavy" size={13} color={color.lime}>
          {level}
        </Text>
      </View>
      {gauges.map((g) => (
        <View key={g.key} accessible accessibilityLabel={g.accessibilityLabel} style={[styles.gauge, g.foggy ? styles.fog : null]}>
          <View style={layout.rowBetween}>
            <Text size={13} muted style={styles.pole}>
              {g.low}
            </Text>
            <Text variant="bodyHeavy" size={13} center style={layout.shrink}>
              {g.label}
            </Text>
            <Text size={13} muted style={[styles.pole, styles.right]}>
              {g.high}
            </Text>
          </View>
          <AxisBar value={g.foggy ? 0 : g.value} confidence={g.foggy ? 0 : g.confidence} />
        </View>
      ))}
      {more ? (
        <Pressable onPress={more.onPress} accessibilityRole="button" accessibilityLabel={`${more.title}, ${more.text}`} style={[layout.row, styles.more]}>
          <View style={layout.grow}>
            <Text variant="bodyHeavy" size={16}>
              {more.title}
            </Text>
            <Text size={13} muted>
              {more.text}
            </Text>
          </View>
          <Glyph name="chevron" size={16} color={color.mute} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  type: { minHeight: 140 },
  typeText: { maxWidth: '66%', gap: space.xs },
  typePet: { position: 'absolute', right: -4, bottom: -10 },
  card: { borderRadius: radius.card, backgroundColor: color.panel, borderWidth: 1, borderColor: veil.line, padding: space.lg, gap: space.md + 2 },
  gauge: { gap: space.sm },
  fog: { opacity: 0.55 },
  pole: { width: '28%' },
  right: { textAlign: 'right' },
  more: { gap: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: veil.line },
});
