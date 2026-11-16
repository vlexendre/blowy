import { StyleSheet, View } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { Icon } from '../atoms/Icon';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { alpha, color, radius, size, space, veil } from '../theme';

export type StreakStripStatus = 'done' | 'joker' | 'missed' | 'today' | 'future' | 'not_yet';

export interface StreakStripProps {
  /** Jours d'affilée (le nombre à côté de la flamme). */
  count: number;
  /** Lundi → dimanche (`Streak.week` du contrat), avec l'initiale du jour. */
  days: readonly { letter: string; status: StreakStripStatus }[];
  onPress: () => void;
  /** Libellé lu complet (« Série de 4 jours »). */
  accessibilityLabel: string;
}

const DOT = 24;

/**
 * La série de la semaine en une barre fine (haut de l'accueil) : la flamme et son nombre, puis les sept jours,
 * remplis ou non. Un tap ouvre l'écran de la série.
 */
export function StreakStrip({ count, days, onPress, accessibilityLabel }: StreakStripProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={styles.bar}>
      <View style={styles.count}>
        <View style={count > 0 ? undefined : styles.cold}>
          <Icon name="flamme" size={22} />
        </View>
        <Text variant="bodyHeavy" size={17}>
          {String(count)}
        </Text>
      </View>
      <View style={styles.days}>
        {days.map((d, i) => (
          <View key={i} style={[styles.dot, styles[d.status]]}>
            {d.status === 'done' ? (
              <Glyph name="check" size={12} color={color.dark} />
            ) : d.status === 'joker' ? (
              <Icon name="etoiles" size={15} />
            ) : (
              <Text variant="bodyHeavy" size={11} muted={d.status !== 'today'}>
                {d.letter}
              </Text>
            )}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: space.md + 2,
    borderRadius: radius.pill,
    backgroundColor: color.panel,
    borderWidth: size.border,
    borderColor: veil.line,
  },
  count: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  cold: { opacity: 0.45 },
  days: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: color.accent },
  joker: { backgroundColor: color.violet },
  missed: { backgroundColor: veil.line },
  today: { borderWidth: 2, borderStyle: 'dashed', borderColor: color.accent },
  future: { borderWidth: 1.5, borderColor: alpha(color.white, 0.24) },
  not_yet: { opacity: 0.6, borderWidth: 1.5, borderStyle: 'dotted', borderColor: alpha(color.white, 0.24) },
});
