import { ITEM_SLOTS, type ItemSlot, type Outfit } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { ItemImage } from '../atoms/ItemImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { color, radius, size as sizes, space, veil } from '../theme';

export interface SlotTabsProps {
  /** Noms des emplacements (`slotLabel` : tête · visage · tenue · objets). */
  labels: Record<ItemSlot, string>;
  active: ItemSlot;
  onChange: (slot: ItemSlot) => void;
  /** Tenue portée : vignette de l'objet de chaque emplacement dans son onglet. */
  outfit?: Outfit;
  /** Point jaune (nouvel objet dans cet emplacement). */
  badges?: Partial<Record<ItemSlot, boolean>>;
  slots?: readonly ItemSlot[];
  style?: StyleProp<ViewStyle>;
}

/** Les 4 emplacements de la garde-robe en onglets pilule, avec l'objet porté en vignette. */
export function SlotTabs({ labels, active, onChange, outfit, badges, slots = ITEM_SLOTS, style }: SlotTabsProps) {
  return (
    <View accessibilityRole="tablist" style={[styles.row, style]}>
      {slots.map((slot) => {
        const on = slot === active;
        const worn = outfit?.[slot];
        return (
          <Pressable
            key={slot}
            accessibilityRole="tab"
            accessibilityLabel={labels[slot]}
            accessibilityState={{ selected: on }}
            haptic="selection"
            scaleTo={0.95}
            onPress={() => {
              if (!on) onChange(slot);
            }}
            style={[styles.tab, on && styles.on]}
          >
            {worn ? <ItemImage id={worn} size={22} /> : null}
            <Text variant="bodyBold" size={13} color={on ? color.dark : color.mute} numberOfLines={1}>
              {labels[slot]}
            </Text>
            {badges?.[slot] && !on ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.xs, padding: space.xs, borderRadius: radius.pill, backgroundColor: veil.line },
  tab: {
    flex: 1,
    minHeight: sizes.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: space.xs,
    borderRadius: radius.pill,
  },
  on: { backgroundColor: color.accent },
  dot: { position: 'absolute', top: 6, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: color.accent },
});
