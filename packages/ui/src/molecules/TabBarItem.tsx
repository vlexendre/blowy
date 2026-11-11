import { StyleSheet, View } from 'react-native';

import { Badge } from '../atoms/Badge';
import { Glyph, type GlyphName } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { color, radius, size } from '../theme';

export interface TabBarItemProps {
  label: string;
  glyph: GlyphName;
  active?: boolean;
  badge?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
}

/** Onglet de la barre flottante : pictogramme + libellé, pilule jaune quand actif. */
export function TabBarItem({ label, glyph, active, badge, onPress, onLongPress, accessibilityLabel }: TabBarItemProps) {
  const ink = active ? color.dark : color.mute;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      haptic="selection"
      scaleTo={0.92}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!active }}
      style={[styles.base, active && styles.active]}
    >
      <Glyph name={glyph} size={21} color={ink} filled={active} />
      <Text variant="bodyBold" size={10} color={ink} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      {badge && !active ? (
        <View style={styles.badge} pointerEvents="none">
          <Badge count={badge} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, height: size.tabBar - 12, minWidth: 0, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 2 },
  active: { backgroundColor: color.accent },
  label: { letterSpacing: 0.4 },
  badge: { position: 'absolute', top: 4, left: '50%', marginLeft: 6 },
});
