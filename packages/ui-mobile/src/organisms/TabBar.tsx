/**
 * Barre d'onglets flottante 5 entrées (maquette .gnav « verre liquide »). Verre dépoli
 * (expo-blur) sur iOS si la transparence n'est pas réduite ; sinon fond crème opaque
 * (Android, Réduire la transparence). Indépendante d'expo-router : l'app branche ses routes.
 */
import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, View } from 'react-native';
import { useA11yPrefs } from '../foundations/accessibility';
import { color, glass, radius, scrim, space, touch } from '../foundations/theme';
import { Badge } from '../atoms/Badge';
import { Icon, type IconName } from '../atoms/Icon';
import { Text } from '../atoms/Text';

export interface TabItem {
  key: string;
  label: string;
  icon: IconName;
  badge?: string | null;
  /** Pastille « PLUS » (fonction Blowy+), annoncée dans le libellé. */
  tag?: string | null;
  accessibilityLabel?: string;
}

export interface TabBarProps {
  items: readonly TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  bottomInset: number;
}

export function TabBar({ items, activeKey, onSelect, bottomInset }: TabBarProps) {
  const { allowBlur } = useA11yPrefs();
  const content = (
    <View style={styles.row} accessibilityRole="tablist">
      {items.map((it) => {
        const on = it.key === activeKey;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={it.accessibilityLabel ?? [it.label, it.tag, it.badge].filter(Boolean).join(', ')}
            onPress={() => onSelect(it.key)}
            testID={`tab-${it.key}`}
            style={[styles.tab, on && styles.tabOn]}
          >
            <Icon name={it.icon} size={21} tint={on ? color.ink : color.inkSoft} />
            <Text variant="caption" style={{ color: on ? color.ink : color.inkSoft }} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {it.label}
            </Text>
            {it.badge ? (
              <View style={styles.badge}>
                <Badge label={it.badge} />
              </View>
            ) : it.tag ? (
              <View style={styles.badge}>
                <Badge label={it.tag} tone="violet" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(bottomInset, space.lg) }]}>
      {allowBlur ? (
        <BlurView intensity={40} tint="light" style={[styles.bar, styles.glass]}>
          {content}
        </BlurView>
      ) : (
        <View style={[styles.bar, styles.opaque]}>{content}</View>
      )}
    </View>
  );
}

/** Hauteur réservée en bas des écrans d'onglet (barre + marge). */
export const TAB_BAR_SPACE = 96;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14 },
  bar: { borderRadius: radius.xxl + 4, overflow: 'hidden', padding: space.xs, boxShadow: [{ offsetX: 0, offsetY: 16, blurRadius: 36, spreadDistance: 0, color: scrim.floating }] },
  glass: { backgroundColor: glass.tint, borderWidth: 1, borderColor: color.white },
  opaque: { backgroundColor: glass.opaqueFallback, borderWidth: 1, borderColor: color.creamShadow },
  row: { flexDirection: 'row', gap: 2 },
  tab: { flex: 1, minHeight: Math.max(touch.minTarget, 54), borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabOn: { backgroundColor: color.lime },
  badge: { position: 'absolute', top: 4, left: '56%' },
});
