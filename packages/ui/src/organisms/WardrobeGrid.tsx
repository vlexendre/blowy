import type { ItemSlot } from '@blowy/domain';
import { type ComponentRef, createRef, type ReactElement, type Ref, type RefObject, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ItemTile } from '../molecules/ItemTile';
import { Appear, staggerDelay } from '../motion/Appear';
import { measureInWindow, type Rect } from '../motion/MotionHost';
import type { WardrobeItemLook } from '../types';

/** Commandes de la grille pour les vols d'objets (`useFlyTo`). */
export interface WardrobeGridHandle {
  /** Rectangle (fenêtre) de l'image d'un objet dans sa case, s'il est affiché. */
  tileRect: (id: string) => Promise<Rect | null>;
  /** L'objet revient se poser dans sa case : petit rebond. */
  land: (id: string) => void;
}

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
  /** Commandes pour les vols d'objets (mesure des cases, rebond au retour). */
  gridRef?: Ref<WardrobeGridHandle>;
}

/**
 * Grille des objets d'un emplacement (`.grid` de V6-GardeRobe) : porté, possédés, à gagner, premium.
 * Les cases arrivent en cascade (8 au plus, le reste d'un bloc) à l'ouverture et à chaque changement d'emplacement.
 */
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
  gridRef,
}: WardrobeGridProps<T>) {
  const list = useMemo(() => (slot ? items.filter((i) => i.slot === slot) : items), [items, slot]);
  const refs = useRef(new Map<string, RefObject<ComponentRef<typeof View> | null>>());
  const refFor = (id: string) => {
    let r = refs.current.get(id);
    if (!r) {
      r = createRef<ComponentRef<typeof View>>();
      refs.current.set(id, r);
    }
    return r;
  };
  const [lands, setLands] = useState<Record<string, number>>({});
  useImperativeHandle(
    gridRef,
    () => ({
      tileRect: (id) => measureInWindow(refFor(id)),
      land: (id) => setLands((l) => ({ ...l, [id]: (l[id] ?? 0) + 1 })),
    }),
    [],
  );
  const cells: ReactElement[] = list.map((it, i) => {
    const state = it.state === 'owned' ? (it.id === worn ? 'worn' : 'owned') : it.state;
    const goal = it.goal;
    const goalFn = goal ? goalLabels[goal.stat] : undefined;
    return (
      <Appear key={`${slot ?? 'all'}:${it.id}`} delay={staggerDelay(i)} distance={10} scale={0.94} style={styles.cell}>
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
          imageRef={refFor(it.id)}
          landKey={lands[it.id] ?? 0}
        />
      </Appear>
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
  // Cellule animée : elle porte la largeur (part égale de la rangée) et le rapport `.tile` (1/1,08) ; la case la remplit.
  cell: { flex: 1, aspectRatio: 1 / 1.08 },
});
