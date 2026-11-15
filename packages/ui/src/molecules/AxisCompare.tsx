import type { AxisSide } from '@blowy/domain';
import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { Text } from '../atoms/Text';
import { fadeTo, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { color, motion, space, veil } from '../theme';

export interface AxisCompareProps {
  /** Nom de l'axe (« Foyer »). */
  name: string;
  /** La phrase de l'API (« Un foyer, un jour. Tous les deux. »). */
  text: string;
  /** Ton côté de l'axe (pôle −, entre les deux, pôle +). Absent : pas de repère. */
  mine?: AxisSide | null;
  /** Le côté de l'autre. Absent : pas de repère (l'API ne l'a pas dit). */
  theirs?: AxisSide | null;
  /** Couleur de ton repère (plein). Défaut : jaune d'accent. */
  mineColor?: string;
  /** Libellé lu de la piste (« Toi et Sasha, du même côté »). */
  trackLabel?: string;
  /** Rang dans la liste : les repères se posent l'un après l'autre. */
  index?: number;
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TRACK = 96;
const DOT = 14;
/** Position d'un côté sur la piste (un tiers, jamais une valeur chiffrée). */
const AT: Record<AxisSide, number> = { low: 0.12, mid: 0.5, high: 0.88 };

/**
 * Un axe de vision comparé (maquette V6-GRencontre) : le nom, la phrase, et une piste avec deux repères, toi (plein)
 * et l'autre (cerclé). Les repères se placent par tiers (pôle −, entre les deux, pôle +) : jamais un chiffre.
 * Ils glissent du centre vers leur place à l'apparition (fondu seul si animations réduites).
 */
export function AxisCompare({ name, text, mine, theirs, mineColor = color.accent, trackLabel, index = 0, divider = true, style }: AxisCompareProps) {
  // Deux repères au même endroit : légèrement décalés pour qu'on voie les deux (comme dans la maquette).
  const same = !!mine && mine === theirs;
  return (
    <View style={[layout.row, styles.row, divider ? styles.divider : null, style]}>
      <View style={[layout.grow, styles.text]}>
        <Text variant="bodyHeavy" size={17}>
          {name}
        </Text>
        <Text size={15} muted>
          {text}
        </Text>
      </View>
      {mine || theirs ? (
        <View style={styles.track} accessible accessibilityLabel={trackLabel} accessibilityRole="image">
          <View style={styles.line} />
          {theirs ? <Marker side={theirs} nudge={same ? 5 : 0} hollow index={index} /> : null}
          {mine ? <Marker side={mine} nudge={same ? -5 : 0} fill={mineColor} index={index} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function Marker({ side, nudge, hollow, fill, index }: { side: AxisSide; nudge: number; hollow?: boolean; fill?: string; index: number }) {
  const reduced = useReducedMotion();
  const target = AT[side] * TRACK - DOT / 2 + nudge;
  const start = TRACK / 2 - DOT / 2;
  const x = useSharedValue(reduced ? target : start);
  const o = useSharedValue(reduced ? 0 : 1);
  useEffect(() => {
    if (reduced) {
      x.value = target;
      o.value = fadeTo(1, motion.fast);
      return;
    }
    x.value = withDelay(120 + index * motion.stagger * 2, withSpring(target, springs.pop));
  }, [reduced, target, index, x, o]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateX: x.value }] }));
  return <Animated.View style={[styles.dot, hollow ? styles.hollow : { backgroundColor: fill }, animated]} />;
}

const styles = StyleSheet.create({
  row: { gap: space.md, paddingVertical: space.md },
  divider: { borderTopWidth: 1, borderTopColor: veil.line },
  text: { gap: 2 },
  track: { width: TRACK, height: DOT + 8, justifyContent: 'center' },
  line: { height: 2, borderRadius: 1, backgroundColor: veil.off },
  dot: { position: 'absolute', left: 0, top: 4, width: DOT, height: DOT, borderRadius: DOT / 2 },
  hollow: { borderWidth: 3, borderColor: color.white, backgroundColor: color.night },
});
