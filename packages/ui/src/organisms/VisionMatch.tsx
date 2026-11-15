import type { AxisSide } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { AxisCompare } from '../molecules/AxisCompare';
import { DotNote } from '../molecules/DotNote';
import { Appear } from '../motion/Appear';
import { color, space } from '../theme';

/** Un axe expliqué (forme de `MatchExplanation.common[n]` / `.explore` du contrat, plus les côtés quand on les connaît). */
export interface VisionMatchAxis {
  axis: string;
  name: string;
  text: string;
  mine?: AxisSide | null;
  theirs?: AxisSide | null;
  /** Libellé lu de la piste. */
  trackLabel?: string;
}

export interface VisionMatchProps {
  /** « 3 points communs ». */
  commonTitle: string;
  common: readonly VisionMatchAxis[];
  /** « 1 différence à explorer ». */
  exploreTitle: string;
  explore: VisionMatchAxis;
  /** Légende des repères : « toi » et le prénom de l'autre. Absente si aucun repère n'est dessiné. */
  legend?: { mine: string; theirs: string };
  /** Ligne d'en-tête facultative (« Vous cherchez la même chose »). */
  kicker?: string;
  /** Ligne discrète sous la liste (« Ton minimoa ne présente que… »). */
  note?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pourquoi ce minimoa te présente cette personne (maquette V6-GRencontre) : 3 points communs et 1 différence à
 * explorer, axe par axe, avec toi et l'autre sur chaque piste. Jamais un pourcentage seul.
 */
export function VisionMatch({ commonTitle, common, exploreTitle, explore, legend, kicker, note, style }: VisionMatchProps) {
  return (
    <View style={[styles.root, style]}>
      {kicker ? (
        <Appear once={`vm:k:${kicker}`}>
          <View style={styles.kicker}>
            <Text variant="bodyHeavy" size={15}>
              {kicker}
            </Text>
          </View>
        </Appear>
      ) : null}
      <View style={[layout.rowBetween, styles.head]}>
        <Text variant="bodyHeavy" size={22} accessibilityRole="header" style={layout.shrink}>
          {commonTitle}
        </Text>
        {legend ? <Legend {...legend} /> : null}
      </View>
      {common.map((a, i) => (
        <AxisCompare key={a.axis} name={a.name} text={a.text} mine={a.mine} theirs={a.theirs} trackLabel={a.trackLabel} index={i} />
      ))}
      <Text variant="bodyHeavy" size={22} accessibilityRole="header" style={styles.second}>
        {exploreTitle}
      </Text>
      <AxisCompare name={explore.name} text={explore.text} mine={explore.mine} theirs={explore.theirs} trackLabel={explore.trackLabel} index={common.length} />
      {note ? <DotNote text={note} /> : null}
    </View>
  );
}

function Legend({ mine, theirs }: { mine: string; theirs: string }) {
  return (
    <View style={[layout.row, styles.legend]} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={[styles.dot, styles.mine]} />
      <Text size={13} muted>
        {mine}
      </Text>
      <View style={[styles.dot, styles.theirs]} />
      <Text size={13} muted numberOfLines={1} style={layout.shrink}>
        {theirs}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 0 },
  kicker: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.md,
    borderRadius: 999,
    backgroundColor: color.card,
    transform: [{ rotate: '-1.5deg' }],
  },
  head: { gap: space.sm, paddingBottom: space.xs },
  second: { paddingTop: space.lg, paddingBottom: space.xs },
  legend: { gap: 5, flexShrink: 1, minWidth: 0 },
  dot: { width: 10, height: 10, borderRadius: 5, marginLeft: 4 },
  mine: { backgroundColor: color.accent },
  theirs: { borderWidth: 2, borderColor: color.white },
});
