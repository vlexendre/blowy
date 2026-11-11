import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { InkProvider } from '../lib/ink';
import { hitSlopFor, layout } from '../lib/styles';
import { color, radius, space, veil } from '../theme';
import { Pressable } from './Pressable';
import { Text } from './Text';

export type ChipTone = 'glass' | 'accent' | 'dark' | 'light' | 'coral' | 'rose' | 'orange' | 'violet';

export interface ChipProps {
  label: string;
  /** Rend la puce sélectionnable (rôle `button`, état `selected`). */
  onPress?: () => void;
  selected?: boolean;
  tone?: ChipTone;
  /** Élément à gauche (point, mini avatar, icône). */
  left?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<ChipTone, { bg: string; ink: string }> = {
  glass: { bg: veil.track, ink: color.white },
  accent: { bg: color.accent, ink: color.dark },
  dark: { bg: color.dark, ink: color.white },
  light: { bg: color.white, ink: color.dark },
  coral: { bg: color.coral, ink: color.white },
  rose: { bg: color.rose, ink: color.dark },
  orange: { bg: color.orange, ink: color.dark },
  violet: { bg: color.violet, ink: color.white },
};

const HEIGHT = { sm: 24, md: 30, lg: 44 } as const;

/** Puce pilule (`.chip`) : étiquette, filtre ou mot à choisir. */
export function Chip({ label, onPress, selected, tone = 'glass', left, size = 'md', accessibilityLabel, style }: ChipProps) {
  const t = TONES[selected ? 'accent' : tone];
  const h = HEIGHT[size];
  const content = (
    <InkProvider value={t.ink}>
      {left}
      <Text variant="bodyBold" size={size === 'sm' ? 11 : size === 'lg' ? 15 : 12} numberOfLines={1}>
        {label}
      </Text>
    </InkProvider>
  );
  const s = [styles.base, layout.row, { height: h, backgroundColor: t.bg, paddingHorizontal: size === 'sm' ? space.sm + 1 : space.md }, style];
  if (!onPress) return <View style={s}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      haptic="selection"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      hitSlop={hitSlopFor(h)}
      style={s}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, gap: space.xs + 2, alignSelf: 'flex-start' },
});
