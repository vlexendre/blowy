import type { ItemSlot } from '@blowy/domain';
import { type ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ItemTile } from '../molecules/ItemTile';
import type { WardrobeItemLook } from '../types';

export interface WardrobeGridProps<T extends WardrobeItemLook = WardrobeItemLook> {
  /** Objets de la garde-robe (`Wardrobe.items` du contrat accepté tel quel). */
  items: readonly T[];
  /** N'affiche que cet emplacement. */
  slot?: ItemSlot;
  /** Objet porté dans cet emplacement (`outfit[slot]`). */
  worn?: string | null;
  /** Noms des objets (`itemLabel`). */
  itemLabels: Record<string, string>;
  /** Étapes courtes sous les objets à gagner (« 2 jours de soins »), appelées avec `goal.need`. */
  goalLabels: Record<string, (n: number) => string>;
  /** Étiquette premium (« bientôt »). */
  premiumLabel: string;
  /** Étiquette de l'objet porté (« porté »). */
  wornLabel?: string;
  onSelect?: (item: T) => void;
  /** Objets tout juste débloqués (étiquette). */
  newIds?: readonly string[];
  newLabel?: string;
  /** Aide lue sur chaque case selon son état (« toucher pour le porter »…). */
  hints?: Partial<Record<'owned' | 'worn' | 'locked' | 'premium', string>>;
  /** Colonnes. Défaut 3. */
  columns?: number;
}

/** Grille des objets d'un emplacement (`.grid` de V6-GardeRobe) : porté, possédés, à gagner, premium. */
export function WardrobeGrid<T extends WardrobeItemLook>({
  items,
  slot,
  worn,
  itemLabels,
  goalLabels,
  premiumLabel,
  wornLabel,
  onSelect,
  newIds,
  newLabel,
  hints,
  columns = 3,
}: WardrobeGridProps<T>) {
  const list = useMemo(() => (slot ? items.filter((i) => i.slot === slot) : items), [items, slot]);
  const cells: ReactElement[] = list.map((it) => {
    const state = it.state === 'owned' ? (it.id === worn ? 'worn' : 'owned') : it.state;
    const goal = it.goal;
    const goalFn = goal ? goalLabels[goal.stat] : undefined;
    return (
      <ItemTile
        key={it.id}
        id={it.id}
        label={itemLabels[it.id] ?? it.id}
        state={state}
        goalText={goal && goalFn ? goalFn(goal.need) : undefined}
        progress={goal ? { have: goal.have, need: goal.need } : undefined}
        premiumLabel={premiumLabel}
        wornLabel={wornLabel}
        newLabel={newIds?.includes(it.id) ? newLabel : undefined}
        accessibilityHint={hints?.[state]}
        onPress={onSelect ? () => onSelect(it) : undefined}
      />
    );
  });
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
  // `.grid` : 3 colonnes, écart 9.
  grid: { gap: 9 },
  row: { flexDirection: 'row', gap: 9 },
  pad: { flex: 1 },
});
