import { useState } from 'react';
import { type LayoutChangeEvent, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { useAnimatedNumber } from '../lib/motion';
import { color, motion, radius, size, space, veil } from '../theme';

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

/** Contrôle segmenté pilule ; la pastille blanche glisse vers l'onglet actif. */
export function SegmentedTabs<K extends string>({ items, activeKey, onChange, style }: SegmentedTabsProps<K>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, items.findIndex((i) => i.key === activeKey));
  const seg = items.length ? (width - PAD * 2) / items.length : 0;
  const x = useAnimatedNumber(index * seg, motion.base);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View accessibilityRole="tablist" onLayout={onLayout} style={[styles.base, style]}>
      {width > 0 ? <Animated.View style={[styles.thumb, { width: seg }, thumb]} /> : null}
      {items.map((item) => {
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
            <Text variant="bodyBold" size={13} color={on ? color.dark : color.mute}>
              {item.label}
            </Text>
            {item.badge && !on ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', padding: PAD, borderRadius: radius.pill, backgroundColor: veil.line },
  thumb: { position: 'absolute', top: PAD, bottom: PAD, left: PAD, borderRadius: radius.pill, backgroundColor: color.white },
  tab: { flex: 1, minHeight: size.touch - PAD * 2 + 2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: space.xs, borderRadius: radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.accent },
});
