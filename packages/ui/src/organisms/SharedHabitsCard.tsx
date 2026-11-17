import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { alpha, color, space, veil } from '../theme';

export interface SharedHabitSide {
  /** « Toi », « Malo ». */
  name: string;
  /** Série (jours ou semaines d'affilée). */
  streak: number;
  /** Rigueur de 0 à 100, ou null (trop tôt pour le dire). */
  rigour: number | null;
  /** « 85 % » ou « Trop tôt ». */
  rigourLabel: string;
  /** Lu en entier : « Malo : série de 5 jours, rigueur 85 % ». */
  accessibilityLabel: string;
}

export interface SharedHabitsCardProps {
  /** « Vous tenez tous les deux ». */
  title: string;
  /** Rigueur de l'autre sur toutes ses habitudes (« Rigueur de Malo : 85 % »), facultative. */
  subtitle?: string;
  habits: readonly { key: string; emoji?: string; label: string; sides: readonly [SharedHabitSide, SharedHabitSide] }[];
  style?: StyleProp<ViewStyle>;
}

/**
 * « Vous tenez tous les deux : Sport » (spéc. §25) : pour chaque habitude commune, les deux séries et les deux
 * rigueurs, une ligne par personne. Jamais de photo ni d'heure.
 */
export function SharedHabitsCard({ title, subtitle, habits, style }: SharedHabitsCardProps) {
  return (
    <Card padding="none" style={[styles.card, style]}>
      <View>
        <Text variant="bodyHeavy" size={16} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text size={13} muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {habits.map((h) => (
        <View key={h.key} style={styles.habit}>
          {h.label ? (
          <View style={[layout.row, layout.gapSm]}>
            {h.emoji ? (
              <Text size={17} importantForAccessibility="no" accessibilityElementsHidden>
                {h.emoji}
              </Text>
            ) : null}
            <Text variant="bodyBold" size={15} numberOfLines={1} style={layout.shrink}>
              {h.label}
            </Text>
          </View>
          ) : null}
          {h.sides.map((s, i) => (
            <View key={i} accessible accessibilityLabel={s.accessibilityLabel} style={[layout.row, styles.side]}>
              <Text size={13} muted numberOfLines={1} style={styles.name}>
                {s.name}
              </Text>
              <View style={[layout.row, styles.streak]}>
                <Icon name="flamme" size={15} />
                <Text variant="bodyHeavy" size={13}>
                  {s.streak}
                </Text>
              </View>
              <ProgressBar value={s.rigour === null ? 0 : s.rigour / 100} height={6} color={i === 0 ? color.accent : color.white} trackColor={alpha(color.white, 0.12)} style={layout.fill} />
              <Text variant="bodyHeavy" size={13} muted={s.rigour === null} numberOfLines={1} style={styles.value}>
                {s.rigourLabel}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: space.sm + 2 },
  habit: { gap: 6, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: veil.hairline },
  side: { gap: space.sm },
  name: { width: 64 },
  streak: { gap: 2, width: 40 },
  value: { width: 72, textAlign: 'right' },
});
