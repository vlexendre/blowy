import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Chip } from '../atoms/Chip';
import { space } from '../theme';

export interface ChoiceGridProps<K extends string | number> {
  items: readonly { key: K; label: string; accessibilityLabel?: string }[];
  selected: K | null;
  onSelect: (key: K) => void;
  style?: StyleProp<ViewStyle>;
}

/** Grille de puces à choix unique (heure du défi, ville) : 44 pt de haut, la choisie en jaune (petit rebond). */
export function ChoiceGrid<K extends string | number>({ items, selected, onSelect, style }: ChoiceGridProps<K>) {
  return (
    <View style={[styles.grid, style]} accessibilityRole="radiogroup">
      {items.map((it) => (
        <Chip
          key={String(it.key)}
          label={it.label}
          size="lg"
          selected={it.key === selected}
          onPress={() => onSelect(it.key)}
          accessibilityLabel={it.accessibilityLabel ?? it.label}
          style={styles.chip}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minWidth: 72, justifyContent: 'center' },
});
