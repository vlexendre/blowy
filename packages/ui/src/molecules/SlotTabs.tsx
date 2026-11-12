import { ITEM_SLOTS, type ItemSlot } from '@blowy/domain';
import { useState } from 'react';
import { type LayoutChangeEvent, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { type Indicator, useActiveInk, useIndicator, useIndicatorStyle } from '../motion/indicator';
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

const PAD = 4;
const GAP = 4;

function SlotLabel({ label, indicator, index }: { label: string; indicator: Indicator; index: number }) {
  const ink = useActiveInk(indicator, index);
  return (
    <View style={styles.label}>
      <Animated.View style={ink.off}>
        <Text variant="bodyHeavy" size={13} color={color.mute} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, ink.on]}>
        <Text variant="bodyHeavy" size={13} color={color.dark} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

/**
 * Les 4 emplacements de la garde-robe en onglets pilule (`.slots` de V6-GardeRobe : actif blanc).
 * La pilule blanche glisse en ressort d'un emplacement à l'autre ; les libellés changent d'encre en fondu croisé.
 */
export function SlotTabs({ labels, active, onChange, badges, slots = ITEM_SLOTS, style }: SlotTabsProps) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, slots.indexOf(active));
  const seg = slots.length ? (width - PAD * 2 - GAP * (slots.length - 1)) / slots.length : 0;
  const indicator = useIndicator(index);
  const pill = useIndicatorStyle(indicator, seg + GAP, 0.1);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View accessibilityRole="tablist" onLayout={onLayout} style={[styles.row, style]}>
      {width > 0 ? <Animated.View pointerEvents="none" style={[styles.pill, { width: seg }, pill]} /> : null}
      {slots.map((slot, i) => {
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
            style={[styles.tab, on && width === 0 && styles.on]}
          >
            <SlotLabel label={labels[slot]} indicator={indicator} index={i} />
            {badges?.[slot] && !on ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // `.slots` : 4 colonnes, écart 4, padding 4, fond blanc 8 %.
  row: { flexDirection: 'row', gap: GAP, padding: PAD, borderRadius: radius.pill, backgroundColor: veil.line },
  pill: { position: 'absolute', top: PAD, bottom: PAD, left: PAD, borderRadius: radius.pill, backgroundColor: color.white },
  label: { maxWidth: '100%' },
  tab: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderRadius: radius.pill },
  on: { backgroundColor: color.white },
  dot: { position: 'absolute', top: 6, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: color.accent },
});
