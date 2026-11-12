import type { ItemSlot } from '@blowy/domain';
import { type ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { ItemTile } from '../molecules/ItemTile';
import { color, radius, space, veil } from '../theme';
import type { WardrobeItemLook } from '../types';

export interface WardrobeGridProps {
  /** Objets de la garde-robe (`Wardrobe.items` du contrat accepté tel quel). */
  items: readonly WardrobeItemLook[];
  /** N'affiche que cet emplacement. */
  slot?: ItemSlot;
  /** Objet porté dans cet emplacement (`outfit[slot]`). */
  worn?: string | null;
  /** Noms des objets (`itemLabel`). */
  itemLabels: Record<string, string>;
  /** Étapes à franchir (`statGoalLabel`) : appelées avec `goal.need`. */
  goalLabels: Record<string, (n: number) => string>;
  /** Autocollant premium (« bientôt »). */
  premiumLabel: string;
  /** Case « retirer » (« retirer »). Absente sans `onRemove`. */
  removeLabel?: string;
  onRemove?: () => void;
  onSelect?: (item: WardrobeItemLook) => void;
  /** Objets tout juste débloqués (autocollant). */
  newIds?: readonly string[];
  newLabel?: string;
  /** Colonnes. Défaut 3. */
  columns?: number;
}

/** Grille des objets d'un emplacement : porté, possédés, à gagner, premium ; et « retirer » en premier. */
export function WardrobeGrid({ items, slot, worn, itemLabels, goalLabels, premiumLabel, removeLabel, onRemove, onSelect, newIds, newLabel, columns = 3 }: WardrobeGridProps) {
  const list = useMemo(() => (slot ? items.filter((i) => i.slot === slot) : items), [items, slot]);
  const cells: ReactElement[] = [];
  if (onRemove && removeLabel) {
    const none = !worn;
    cells.push(
      <Pressable
        key="__remove"
        onPress={onRemove}
        haptic="selection"
        scaleTo={0.95}
        accessibilityLabel={removeLabel}
        accessibilityState={{ selected: none }}
        style={[styles.remove, none && styles.removeOn]}
      >
        <View style={[styles.removeIcon, none && styles.removeIconOn]}>
          <Glyph name="close" size={22} color={none ? color.dark : color.white} />
        </View>
        <Text variant="bodyBold" size={12} center muted={!none}>
          {removeLabel}
        </Text>
      </Pressable>,
    );
  }
  for (const it of list) {
    const state = it.state === 'owned' ? (it.id === worn ? 'worn' : 'owned') : it.state;
    const goal = it.goal;
    const goalFn = goal ? goalLabels[goal.stat] : undefined;
    cells.push(
      <ItemTile
        key={it.id}
        id={it.id}
        label={itemLabels[it.id] ?? it.id}
        state={state}
        goalText={goal && goalFn ? goalFn(goal.need) : undefined}
        progress={goal ? { have: goal.have, need: goal.need } : undefined}
        premiumLabel={premiumLabel}
        newLabel={newIds?.includes(it.id) ? newLabel : undefined}
        onPress={onSelect ? () => onSelect(it) : undefined}
      />,
    );
  }
  const rows: ReactElement[][] = [];
  for (let i = 0; i < cells.length; i += columns) rows.push(cells.slice(i, i + columns));
  return (
    <View style={styles.grid}>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row}
          {Array.from({ length: columns - row.length }, (_, i) => (
            <View key={`pad${i}`} style={styles.pad} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  pad: { flex: 1 },
  remove: {
    flex: 1,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: veil.off,
  },
  removeOn: { borderColor: color.accent, borderStyle: 'solid' },
  removeIconOn: { backgroundColor: color.accent },
  removeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: veil.glass },
});
