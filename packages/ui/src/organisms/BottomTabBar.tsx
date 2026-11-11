import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GlyphName } from '../atoms/Glyph';
import { TabBarItem } from '../molecules/TabBarItem';
import { alpha, color, radius, shadow, size, space, veil } from '../theme';

export interface BottomTabItem<K extends string = string> {
  key: K;
  label: string;
  glyph: GlyphName;
  badge?: number;
}

export interface BottomTabBarProps<K extends string = string> {
  /** Les 4 onglets : Chats · Mon pet · Rencontres · Moi. */
  items: readonly BottomTabItem<K>[];
  activeKey: K;
  onPress: (key: K) => void;
  onLongPress?: (key: K) => void;
  /** Flotte au-dessus du contenu (défaut) ou s'empile en bas. */
  floating?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Hauteur à réserver en bas d'un écran sous la barre flottante (hors zone de sécurité). */
export const TAB_BAR_SPACE = size.tabBar + space.lg + space.sm;

/**
 * Barre d'onglets flottante en verre. Utilisable comme `tabBar` d'expo-router :
 * `tabBar={(p) => <BottomTabBar items={…} activeKey={p.state.routes[p.state.index].name} onPress={(k) => p.navigation.navigate(k)} />}`.
 */
export function BottomTabBar<K extends string>({ items, activeKey, onPress, onLongPress, floating = true, accessibilityLabel, style }: BottomTabBarProps<K>) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, space.lg);
  return (
    <View pointerEvents="box-none" style={[floating ? styles.floating : null, { paddingBottom: bottom }, styles.outer, style]}>
      <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={[styles.bar, shadow.lift]}>
        {items.map((it) => (
          <TabBarItem
            key={it.key}
            label={it.label}
            glyph={it.glyph}
            badge={it.badge}
            active={it.key === activeKey}
            onPress={() => onPress(it.key)}
            onLongPress={onLongPress ? () => onLongPress(it.key) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floating: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  outer: { paddingHorizontal: space.md + 2 },
  bar: {
    flexDirection: 'row',
    gap: 2,
    padding: space.sm - 2,
    height: size.tabBar,
    borderRadius: radius.xl - 2,
    backgroundColor: alpha(color.card, 0.94),
    borderWidth: 1,
    borderColor: veil.glassStrong,
  },
});
