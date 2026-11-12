import { ITEM_SLOTS, type ItemSlot } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { color, radius, veil } from '../theme';

export interface SlotTabsProps {
  /** Noms des emplacements (`slotLabel` : tête · visage · tenue · objets). */
  labels: Record<ItemSlot, string>;
  active: ItemSlot;
  onChange: (slot: ItemSlot) => void;
  /** Point jaune (nouvel objet dans cet emplacement). */
  badges?: Partial<Record<ItemSlot, boolean>>;
  slots?: readonly ItemSlot[];
  style?: StyleProp<ViewStyle>;
}

/** Les 4 emplacements de la garde-robe en onglets pilule (`.slots` de V6-GardeRobe : actif blanc). */
export function SlotTabs({ labels, active, onChange, badges, slots = ITEM_SLOTS, style }: SlotTabsProps) {
  return (
    <View accessibilityRole="tablist" style={[styles.row, style]}>
      {slots.map((slot) => {
        const on = slot === active;
        return (
          <Pressable
            key={slot}
            accessibilityRole="tab"
            accessibilityLabel={labels[slot]}
            accessibilityState={{ selected: on }}
            haptic="selection"
            scaleTo={0.95}
            hitSlop={{ top: 5, bottom: 5 }}
            onPress={() => {
              if (!on) onChange(slot);
            }}
            style={[styles.tab, on && styles.on]}
          >
            <Text variant="bodyHeavy" size={13} color={on ? color.dark : color.mute} numberOfLines={1}>
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
  // `.slots` : 4 colonnes, écart 4, padding 4, fond blanc 8 %.
  row: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.pill, backgroundColor: veil.line },
  tab: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderRadius: radius.pill },
  on: { backgroundColor: color.white },
  dot: { position: 'absolute', top: 6, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: color.accent },
});
