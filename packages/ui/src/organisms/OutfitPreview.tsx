import { ITEM_SLOTS, type ItemSlot, type Outfit, type Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { DressedPet } from '../atoms/DressedPet';
import { ItemImage } from '../atoms/ItemImage';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { color, type GradientName, radius, size as sizes, space, speciesGradient, veil } from '../theme';

export interface OutfitPreviewProps {
  species: Species;
  outfit: Outfit;
  /** Nom du pet (titre). */
  name?: string;
  /** Noms des emplacements (`slotLabel`). */
  slotLabels: Record<ItemSlot, string>;
  /** Noms des objets (`itemLabel`). */
  itemLabels: Record<string, string>;
  /** Emplacement vide (« rien »). */
  emptyLabel: string;
  /** Emplacement en cours d'édition (surligné). */
  activeSlot?: ItemSlot;
  onSlotPress?: (slot: ItemSlot) => void;
  gradient?: GradientName;
  petLabel?: string;
}

/** Haut de l'écran garde-robe : le pet habillé et le résumé des 4 emplacements. */
export function OutfitPreview({ species, outfit, name, slotLabels, itemLabels, emptyLabel, activeSlot, onSlotPress, gradient, petLabel }: OutfitPreviewProps) {
  return (
    <Panel gradient={gradient ?? speciesGradient[species]} padding="md" style={styles.panel}>
      <View style={styles.pet}>
        <DressedPet species={species} outfit={outfit} size={150} animated accessibilityLabel={petLabel ?? name} />
      </View>
      <View style={[layout.grow, layout.gapXs]}>
        {name ? <Title text={name} size={30} numberOfLines={1} /> : null}
        {ITEM_SLOTS.map((slot) => {
          const id = outfit[slot];
          const on = slot === activeSlot;
          const itemName = id ? (itemLabels[id] ?? id) : emptyLabel;
          return (
            <Pressable
              key={slot}
              onPress={onSlotPress ? () => onSlotPress(slot) : undefined}
              disabled={!onSlotPress}
              haptic="selection"
              scaleTo={0.97}
              accessibilityRole={onSlotPress ? 'button' : 'text'}
              accessibilityLabel={`${slotLabels[slot]} : ${itemName}`}
              accessibilityState={{ selected: on }}
              style={[styles.row, on && styles.rowOn]}
            >
              <View style={styles.thumb}>{id ? <ItemImage id={id} size={28} /> : <View style={styles.empty} />}</View>
              <View style={layout.shrink}>
                <Text variant="label" size={10} color={on ? color.dark : undefined} muted={!on}>
                  {slotLabels[slot]}
                </Text>
                <Text variant="bodyBold" size={13} numberOfLines={1} color={on ? color.dark : undefined} dim={!id && !on}>
                  {itemName}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pet: { width: 150, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: sizes.touch, paddingHorizontal: space.sm, borderRadius: radius.sm },
  rowOn: { backgroundColor: color.white },
  thumb: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: veil.darkGlass },
  empty: { width: 10, height: 2, borderRadius: 1, backgroundColor: veil.off },
});
