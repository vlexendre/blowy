import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon } from '../atoms/Icon';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { radius, space, veil } from '../theme';

export interface StreakPillProps {
  count: number;
  /** Unité (« jours », « série »). */
  label: string;
  /** `pill` : puce compacte ; `stack` : flamme, gros chiffre Anton et unité empilés (photo du jour). */
  variant?: 'pill' | 'stack';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Série de jours avec la flamme. */
export function StreakPill({ count, label, variant = 'pill', accessibilityLabel, style }: StreakPillProps) {
  const a11y = accessibilityLabel ?? `${count} ${label}`;
  if (variant === 'stack') {
    return (
      <View accessible accessibilityLabel={a11y} style={[styles.stack, style]}>
        <Icon name="flamme" size={50} />
        <Text variant="h2" size={30} style={styles.count}>
          {String(count)}
        </Text>
        <Text variant="bodyHeavy" size={11}>
          {label}
        </Text>
      </View>
    );
  }
  return (
    <View accessible accessibilityLabel={a11y} style={[styles.pill, layout.row, style]}>
      <Icon name="flamme" size={16} />
      <Text variant="bodyBold" size={12}>{`${count} ${label}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { alignItems: 'center' },
  count: { marginTop: -6 },
  pill: { alignSelf: 'flex-start', height: 30, gap: space.xs, paddingHorizontal: space.md - 2, borderRadius: radius.pill, backgroundColor: veil.darkGlass },
});
