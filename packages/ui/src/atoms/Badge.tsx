import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { PopIn } from '../motion/PopIn';
import { color, extra, radius, space } from '../theme';
import { Text } from './Text';

export interface BadgeProps {
  count: number;
  /** Au-delà, affiche « max+ ». Défaut 99. */
  max?: number;
  tone?: 'heart' | 'accent';
  /** `sm` : pastille de 16 pt de la barre d'onglets (`.gnav .bdg`). Défaut `md` (18 pt). */
  size?: 'sm' | 'md';
  /** « Pop » aussi à l'apparition (0 → 1). Défaut faux : dans une liste recyclée, seule une variation du nombre anime. */
  popOnMount?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Pastille de compteur (non lus, demandes). Rien n'est rendu à 0. Elle fait « pop » à l'arrivée et à chaque changement. */
export function Badge({ count, max = 99, tone = 'heart', size = 'md', popOnMount = false, accessibilityLabel, style }: BadgeProps) {
  if (count <= 0) return null;
  const isHeart = tone === 'heart';
  return (
    <PopIn trigger={count} onMount={popOnMount} style={style}>
      <View
        accessible
        accessibilityLabel={accessibilityLabel ?? String(count)}
        style={[styles.base, size === 'sm' && styles.sm, { backgroundColor: isHeart ? extra.heart : color.accent }]}
      >
        <Text variant="label" size={size === 'sm' ? 9 : 10} color={isHeart ? color.white : color.dark} style={styles.text}>
          {count > max ? `${max}+` : String(count)}
        </Text>
      </View>
    </PopIn>
  );
}

const styles = StyleSheet.create({
  base: { minWidth: 18, height: 18, paddingHorizontal: space.xs + 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  sm: { minWidth: 16, height: 16, paddingHorizontal: space.xs },
  text: { letterSpacing: 0 },
});
