import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Chip, type ChipTone } from '../atoms/Chip';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { color, type GradientName, gradient as gradients, space, veil } from '../theme';

export interface TodoRowProps {
  title: string;
  subtitle?: string;
  /** Contenu de la tuile de gauche (visage de pet, œuf…). */
  tile: ReactNode;
  /** Dégradé de la tuile. Défaut `violet`. */
  tileGradient?: GradientName;
  /** Puce à droite (« ce soir », « encore 12 xp »). */
  chip?: string;
  chipTone?: ChipTone | 'faint';
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Ligne « à faire » d'un lien (`.todo` de V6-Aujourdhui) : tuile en dégradé, titre, sous-titre, puce. */
export function TodoRow({ title, subtitle, tile, tileGradient = 'violet', chip, chipTone = 'faint', onPress, accessibilityLabel, style }: TodoRowProps) {
  const body = (
    <>
      <View style={styles.tile}>
        <LinearGradient colors={gradients[tileGradient]} style={StyleSheet.absoluteFill} />
        {tile}
      </View>
      <View style={styles.text}>
        <Text variant="bodyBold" size={15} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" size={13} muted numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {chip ? <Chip label={chip} tone={chipTone === 'faint' ? 'glass' : chipTone} style={chipTone === 'faint' ? styles.faint : undefined} /> : null}
    </>
  );
  const a11y = accessibilityLabel ?? [title, subtitle, chip].filter(Boolean).join(', ');
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityLabel={a11y} scaleTo={0.98} style={[styles.row, style]}>
        {body}
      </Pressable>
    );
  }
  return (
    <View accessible accessibilityLabel={a11y} style={[styles.row, style]}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    paddingVertical: space.md - 2,
    paddingHorizontal: space.md,
    borderRadius: 22,
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: veil.line,
  },
  tile: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  faint: { backgroundColor: veil.line },
});
