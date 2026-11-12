import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { Chip } from '../atoms/Chip';
import { Pressable } from '../atoms/Pressable';
import { hitSlopFor } from '../lib/styles';

export interface LevelPillProps {
  /** Texte affiché (« niveau 3 › », « niv. 2 »). */
  label: string;
  /** `accent` (lien actif) ou `glass` (discret). */
  tone?: 'accent' | 'glass';
  size?: 'sm' | 'md';
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Pastille du niveau d'un lien. */
export function LevelPill({ label, tone = 'accent', size = 'md', onPress, accessibilityLabel, style }: LevelPillProps) {
  const chip = <Chip label={label} tone={tone} size={size} style={[size === 'sm' && styles.sm, onPress ? undefined : style]} />;
  if (!onPress) return chip;
  return (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel ?? label} hitSlop={hitSlopFor(30)} style={[styles.self, style]}>
      {chip}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  self: { alignSelf: 'flex-start' },
  // `.chip` des lignes de chat : padding 3px 9px, 11px → 21 pt de haut.
  sm: { height: 21, paddingHorizontal: 9 },
});
