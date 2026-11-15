import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Avatar } from '../atoms/Avatar';
import { Text } from '../atoms/Text';
import { useLoop } from '../lib/motion';
import { PopIn } from '../motion/PopIn';
import { alpha, color, extra, radius, speciesColor } from '../theme';

export interface ZonePreviewProps {
  /** Ton minimoa, au centre. */
  species: Species;
  /** Les minimoas compatibles autour (illustration). */
  others: readonly Species[];
  /** « 1,5 km autour de toi ». */
  radiusLabel: string;
  accessibilityLabel: string;
  /** Diamètre. Défaut 250. */
  size?: number;
}

/** Positions des voisins sur l'anneau (angle en degrés, distance relative au rayon). */
const SPOTS = [
  { a: -140, r: 0.78 },
  { a: -35, r: 0.82 },
  { a: 40, r: 0.9 },
];

/**
 * Ta zone, pas ton adresse (V6-GLocalisation) : un rond de plan nocturne, ton minimoa au centre, l'anneau pointillé
 * de la zone qui respire, et des minimoas compatibles qui apparaissent autour. Illustration : aucune vraie position.
 */
export function ZonePreview({ species, others, radiusLabel, accessibilityLabel, size = 250 }: ZonePreviewProps) {
  const t = useLoop(2400);
  const glow = useAnimatedStyle(() => ({ opacity: 0.35 + 0.35 * t.value, transform: [{ scale: 0.92 + 0.12 * t.value }] }));
  const r = size / 2;
  const ring = size * 0.66;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.map, { width: size, height: size, borderRadius: r }]}>
        <View style={[styles.street, { top: size * 0.3, transform: [{ rotate: '-18deg' }] }]} />
        <View style={[styles.street, styles.avenue, { top: size * 0.62, transform: [{ rotate: '12deg' }] }]} />
        <View style={[styles.street, { left: size * 0.3, top: 0, bottom: 0, width: 6, height: undefined, right: undefined, transform: [{ rotate: '8deg' }] }]} />
        <View style={[styles.park, { right: size * 0.1, bottom: size * 0.22, width: size * 0.18, height: size * 0.14 }]} />
      </View>
      <Animated.View pointerEvents="none" style={[styles.glow, { width: ring, height: ring, borderRadius: ring / 2, left: r - ring / 2, top: r - ring / 2 }, glow]} />
      <View pointerEvents="none" style={[styles.ring, { width: ring, height: ring, borderRadius: ring / 2, left: r - ring / 2, top: r - ring / 2 }]} />
      {others.slice(0, SPOTS.length).map((s, i) => {
        const spot = SPOTS[i] ?? { a: 0, r: 0.8 };
        const d = (spot.r * size) / 2;
        const x = r + d * Math.cos((spot.a * Math.PI) / 180) - 26;
        const y = r + d * Math.sin((spot.a * Math.PI) / 180) - 26;
        return (
          <PopIn key={s} delay={380 + i * 160} from={0.3} style={[styles.spot, { left: x, top: y }]}>
            <Avatar size={52} pet={{ name: s, species: s }} ring={color.white} />
          </PopIn>
        );
      })}
      <PopIn delay={120} from={0.5} style={[styles.spot, { left: r - 44, top: r - 44 }]}>
        <Avatar size={88} pet={{ name: species, species }} ring={speciesColor[species]} />
      </PopIn>
      <PopIn delay={700} from={0.6} style={[styles.chip, { top: r + ring / 2 - 18 }]}>
        <Text variant="bodyHeavy" size={13} color={color.dark}>
          {radiusLabel}
        </Text>
      </PopIn>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
  map: { position: 'absolute', overflow: 'hidden', backgroundColor: extra.map.ground, borderWidth: 1, borderColor: alpha(color.white, 0.08) },
  street: { position: 'absolute', left: -20, right: -20, height: 8, backgroundColor: extra.map.street },
  avenue: { height: 12, backgroundColor: extra.map.avenue },
  park: { position: 'absolute', borderRadius: 8, backgroundColor: extra.map.park },
  glow: { position: 'absolute', backgroundColor: alpha(color.accent, 0.12) },
  ring: { position: 'absolute', borderWidth: 2, borderStyle: 'dashed', borderColor: color.accent },
  spot: { position: 'absolute' },
  chip: { position: 'absolute', left: 14, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: color.accent, transform: [{ rotate: '-4deg' }] },
});
