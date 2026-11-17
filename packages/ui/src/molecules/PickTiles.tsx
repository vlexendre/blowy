import { Text as RNText, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { alpha, color, opacity, radius, space } from '../theme';

export interface PickTilesProps<K extends string> {
  items: readonly { key: K; label: string; emoji?: string }[];
  /** Clés choisies. */
  selected: readonly K[];
  onToggle: (key: K) => void;
  /** Choix au plus : une fois atteint, les autres tuiles s'estompent (toujours touchables : rien ne se passe). */
  max?: number;
  /** Libellé lu d'une tuile choisie (« choisi »). */
  selectedLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Tuiles à choix multiple sur deux colonnes (habitudes de l'inscription, membres d'un groupe sans visage) : emoji,
 * libellé sur trois lignes au plus, la choisie en jaune avec une coche. 52 pt de haut au moins.
 */
export function PickTiles<K extends string>({ items, selected, onToggle, max, selectedLabel, style }: PickTilesProps<K>) {
  const full = max !== undefined && selected.length >= max;
  return (
    <View style={[styles.grid, style]}>
      {items.map((it) => {
        const on = selected.includes(it.key);
        const dim = full && !on;
        return (
          <Pressable
            key={it.key}
            onPress={() => onToggle(it.key)}
            haptic="selection"
            bounceKey={on}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on, disabled: dim }}
            accessibilityLabel={on && selectedLabel ? `${it.label}, ${selectedLabel}` : it.label}
            style={[styles.tile, on && styles.on, dim && styles.dim]}
          >
            {it.emoji ? (
              <RNText style={styles.emoji} accessible={false}>
                {it.emoji}
              </RNText>
            ) : null}
            <Text variant="bodyHeavy" size={14} numberOfLines={3} color={on ? color.dark : color.white} style={styles.label}>
              {it.label}
            </Text>
            {on ? <Glyph name="check" size={16} color={color.dark} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md - 2,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: alpha(color.white, 0.1),
  },
  on: { backgroundColor: color.accent, borderColor: color.accent },
  dim: { opacity: opacity.disabled },
  emoji: { fontSize: 22, lineHeight: 28 },
  label: { flex: 1, lineHeight: 18 },
});
