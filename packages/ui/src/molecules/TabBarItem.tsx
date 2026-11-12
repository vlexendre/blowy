import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Badge } from '../atoms/Badge';
import { Glyph, type GlyphName } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { color, radius } from '../theme';

/** Hauteur d'un onglet (`.gnav a` : 54 px). */
export const ITEM_HEIGHT = 54;

export interface TabBarItemProps {
  label: string;
  glyph: GlyphName;
  active?: boolean;
  badge?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
}

const SW = 2.2;

/** Pictos SVG de `.gnav` (viewBox 24, trait 2,2) ; la bulle du chat est pleine, les autres en contour. Repli sur `Glyph`. */
function NavIcon({ glyph, color: c, active }: { glyph: GlyphName; color: string; active: boolean }) {
  const common = { stroke: c, strokeWidth: SW, fill: 'none' as const };
  let body;
  switch (glyph) {
    case 'chat':
      body = <Path d="M4 5h16v11H9l-5 4z" stroke={c} strokeWidth={SW} fill={c} strokeLinejoin="round" />;
      break;
    case 'heart':
      body = <Path d="M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z" {...common} fill={active ? c : 'none'} strokeLinejoin="round" />;
      break;
    case 'people':
      body = (
        <>
          <Circle cx={8.5} cy={9} r={3.5} {...common} />
          <Circle cx={16.5} cy={9} r={3.5} {...common} />
          <Path d="M2.5 20c.6-3.4 3-5 6-5s5.4 1.6 6 5M14 15.2c.8-.2 1.6-.2 2.5-.2 3 0 4.4 1.6 5 5" {...common} strokeLinecap="round" />
        </>
      );
      break;
    case 'person':
      body = (
        <>
          <Circle cx={12} cy={8} r={4} {...common} />
          <Path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" {...common} strokeLinecap="round" />
        </>
      );
      break;
    default:
      return <Glyph name={glyph} size={21} color={c} filled={active} />;
  }
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
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
      <NavIcon glyph={glyph} color={ink} active={!!active} />
      <Text variant="bodyHeavy" size={10} color={ink} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      {badge && !active ? (
        <View style={styles.badge} pointerEvents="none">
          <Badge count={badge} size="sm" />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, height: ITEM_HEIGHT, minWidth: 0, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 2 },
  active: { backgroundColor: color.accent },
  label: { letterSpacing: 0.4 },
  badge: { position: 'absolute', top: 5, left: '50%', marginLeft: 6 },
});
