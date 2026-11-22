import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { alpha, color, radius, space } from '../theme';

export interface AnswerTileProps {
  label: string;
  /** Grand dessin de la réponse : un emoji, ou une icône. */
  emoji?: string | null;
  icon?: ReactNode;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/**
 * Réponse en grande tuile (grille 2 × 2, façon Duolingo) : le dessin en grand au centre, le libellé dessous, un bord
 * épais en bas comme une touche. Choisie : bord et fond jaunes.
 */
export function AnswerTile({ label, emoji, icon, selected = false, onPress, accessibilityLabel }: AnswerTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      scaleTo={0.96}
      style={[styles.tile, selected && styles.selected]}
    >
      <View style={styles.art}>
        {emoji ? (
          <Text size={52} style={styles.emoji} accessible={false}>
            {emoji}
          </Text>
        ) : (
          icon
        )}
      </View>
      <Text variant="bodyBold" size={15} center numberOfLines={3} color={selected ? color.accentSoft : color.white}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 150,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    borderRadius: radius.lg,
    backgroundColor: color.card,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  selected: { borderColor: color.accent, backgroundColor: alpha(color.accent, 0.14) },
  art: { minHeight: 64, alignItems: 'center', justifyContent: 'center' },
  emoji: { lineHeight: 64 },
});
