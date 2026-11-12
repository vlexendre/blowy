import { useState } from 'react';
import { type LayoutChangeEvent, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { type Indicator, useActiveInk, useIndicator, useIndicatorStyle } from '../motion/indicator';
import { color, radius, space, veil } from '../theme';

export interface SegmentedTabItem<K extends string = string> {
  key: K;
  label: string;
  badge?: boolean;
}

export interface SegmentedTabsProps<K extends string = string> {
  /** Les onglets (dans un lien : aujourd'hui · chat · souvenirs). */
  items: readonly SegmentedTabItem<K>[];
  activeKey: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
}

const PAD = 4;
const GAP = 4;

function TabLabel({ label, indicator, index }: { label: string; indicator: Indicator; index: number }) {
  const ink = useActiveInk(indicator, index);
  return (
    <View>
      <Animated.View style={ink.off}>
        <Text variant="bodyHeavy" size={13} color={color.mute}>
          {label}
        </Text>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, ink.on]}>
        <Text variant="bodyHeavy" size={13} color={color.dark}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

/** Contrôle segmenté pilule ; la pastille blanche glisse en ressort vers l'onglet actif (et s'étire en chemin). */
export function SegmentedTabs<K extends string>({ items, activeKey, onChange, style }: SegmentedTabsProps<K>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, items.findIndex((i) => i.key === activeKey));
  const seg = items.length ? (width - PAD * 2 - GAP * (items.length - 1)) / items.length : 0;
  const indicator = useIndicator(index);
  const thumb = useIndicatorStyle(indicator, seg + GAP);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View accessibilityRole="tablist" onLayout={onLayout} style={[styles.base, style]}>
      {width > 0 ? <Animated.View style={[styles.thumb, { width: seg }, thumb]} /> : null}
      {items.map((item, i) => {
        const on = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: on }}
            haptic="selection"
            scaleTo={0.97}
            onPress={() => {
              if (!on) onChange(item.key);
            }}
            style={styles.tab}
          >
            <TabLabel label={item.label} indicator={indicator} index={i} />
            {item.badge && !on ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // `.tabs3` : 3 colonnes séparées de 4, onglets de 34 pt, fond blanc à 8 %.
  base: { flexDirection: 'row', gap: GAP, padding: PAD, borderRadius: radius.pill, backgroundColor: veil.line },
  thumb: { position: 'absolute', top: PAD, bottom: PAD, left: PAD, borderRadius: radius.pill, backgroundColor: color.white },
  tab: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: space.xs, borderRadius: radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.accent },
});
