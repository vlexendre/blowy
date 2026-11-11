import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { color, extra, radius, space } from '../theme';
import { Text } from './Text';

export interface BadgeProps {
  count: number;
  /** Au-delà, affiche « max+ ». Défaut 99. */
  max?: number;
  tone?: 'heart' | 'accent';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Pastille de compteur (non lus, demandes). Rien n'est rendu à 0. */
export function Badge({ count, max = 99, tone = 'heart', accessibilityLabel, style }: BadgeProps) {
  if (count <= 0) return null;
  const isHeart = tone === 'heart';
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? String(count)}
      style={[styles.base, { backgroundColor: isHeart ? extra.heart : color.accent }, style]}
    >
      <Text variant="label" size={10} color={isHeart ? color.white : color.dark} style={styles.text}>
        {count > max ? `${max}+` : String(count)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { minWidth: 18, height: 18, paddingHorizontal: space.xs + 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  text: { letterSpacing: 0 },
});
