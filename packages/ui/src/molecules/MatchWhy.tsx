import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { alpha, color, space, veil } from '../theme';

export interface MatchWhyProps {
  /** « 3 points communs ». */
  commonTitle: string;
  /** Noms des axes communs (« Foyer », « Rythme », « Cap »). */
  common: readonly string[];
  /** « 1 différence à explorer ». */
  exploreTitle: string;
  /** Nom de l'axe à explorer. */
  explore: string;
  /** Libellé lu de l'ensemble (la phrase entière). */
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pourquoi en une ligne, sur la carte d'une rencontre : les points communs en puces pleines, la différence en puce
 * cerclée. Le détail (phrases et repères) est sur l'écran de la rencontre.
 */
export function MatchWhy({ commonTitle, common, exploreTitle, explore, accessibilityLabel, style }: MatchWhyProps) {
  return (
    <View style={[styles.root, style]} accessible accessibilityLabel={accessibilityLabel}>
      {/* Une ligne qui dit tout (« 3 points communs · 1 différence à explorer »), puis les axes : pleins en commun, cerclé à explorer. */}
      <Text variant="bodyHeavy" size={13}>
        {commonTitle}
        <Text variant="bodyHeavy" size={13} muted>
          {` · ${exploreTitle}`}
        </Text>
      </Text>
      <View style={[layout.row, styles.line]}>
        {common.map((name) => (
          <View key={name} style={[styles.pill, styles.common]}>
            <Text variant="bodyHeavy" size={14} color={color.accent}>
              {name}
            </Text>
          </View>
        ))}
        <View style={[styles.pill, styles.explore]}>
          <Text variant="bodyHeavy" size={14}>
            {explore}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  line: { flexWrap: 'wrap', gap: 6 },
  pill: { height: 26, paddingHorizontal: 10, borderRadius: 999, justifyContent: 'center' },
  common: { backgroundColor: alpha(color.accent, 0.14) },
  explore: { borderWidth: 1.5, borderColor: veil.off, marginLeft: 4 },
});
