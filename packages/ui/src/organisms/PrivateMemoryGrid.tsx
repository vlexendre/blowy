import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { Appear, staggerDelay } from '../motion/Appear';
import { alpha, color, radius, space } from '../theme';

export interface PrivateMemoryLook {
  id: string;
  url: string;
  /** Libellé de l'habitude ou du défi. */
  caption: string;
  /** « 12 nov. ». */
  dayLabel: string;
}

export interface PrivateMemoryGridProps {
  items: readonly PrivateMemoryLook[];
  /** Clé de la cascade (première visite). */
  onceKey?: string;
}

/** Souvenirs privés : les photos gardées, deux par ligne, qui se posent en cascade à la première visite. */
export function PrivateMemoryGrid({ items, onceKey = 'private-memories' }: PrivateMemoryGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((m, i) => (
        <Appear key={m.id} once={`${onceKey}:${m.id}`} delay={staggerDelay(i)} style={styles.cell}>
          <View style={styles.tile} accessible accessibilityRole="image" accessibilityLabel={`${m.caption}, ${m.dayLabel}`}>
            <Image source={{ uri: m.url }} contentFit="cover" style={StyleSheet.absoluteFill} transition={160} />
            <View style={styles.caption}>
              <Text variant="bodyHeavy" size={13} color={color.white} numberOfLines={1}>
                {m.caption}
              </Text>
              <Text size={13} color={alpha(color.white, 0.8)}>
                {m.dayLabel}
              </Text>
            </View>
          </View>
        </Appear>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm + 2 },
  cell: { width: '48.5%' },
  tile: { aspectRatio: 4 / 5, borderRadius: radius.md + 2, overflow: 'hidden', backgroundColor: color.card, justifyContent: 'flex-end' },
  caption: { padding: space.sm + 2, backgroundColor: alpha(color.night, 0.55) },
});
