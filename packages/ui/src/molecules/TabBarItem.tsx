import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Badge } from '../atoms/Badge';
import { Glyph, type GlyphName } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { type Indicator, useActiveInk, useIndicator } from '../motion/indicator';
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
  /**
   * Pilule glissante de `BottomTabBar` (et rang de l'onglet) : l'onglet ne dessine plus son fond jaune,
   * son encre passe du gris au sombre en fondu croisé quand la pilule arrive.
   */
  indicator?: Indicator;
  index?: number;
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

/** Picto + libellé d'un onglet dans une encre donnée. */
function Face({ glyph, label, ink, active }: { glyph: GlyphName; label: string; ink: string; active: boolean }) {
  return (
    <View style={styles.face}>
      <NavIcon glyph={glyph} color={ink} active={active} />
      <Text variant="bodyHeavy" size={10} color={ink} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Onglet de la barre flottante : pictogramme + libellé, pilule jaune quand actif. Devenu actif, son picto rebondit ;
 * ses pastilles font « pop » quand leur nombre change.
 */
export function TabBarItem({ label, glyph, active, badge, onPress, onLongPress, accessibilityLabel, indicator, index = 0 }: TabBarItemProps) {
  const reduced = useReducedMotion();
  const still = useIndicator(index);
  const ink = useActiveInk(indicator ?? still, index);
  const hop = useSharedValue(0);
  const was = useRef(active);
  useEffect(() => {
    if (active && !was.current && !reduced) {
      hop.value = 0;
      hop.value = withSequence(withTiming(1, { duration: 140, easing: ease.out }), withSpring(0, springs.plush));
    }
    was.current = active;
  }, [active, reduced, hop]);
  const bounce = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 * hop.value }, { scale: 1 + 0.2 * hop.value }, { rotate: `${-8 * hop.value}deg` }],
  }));
  const sliding = !!indicator;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      haptic="selection"
      scaleTo={0.92}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!active }}
      style={[styles.base, active && !sliding && styles.active]}
    >
      <Animated.View style={bounce}>
        {sliding ? (
          <>
            <Animated.View style={ink.off}>
              <Face glyph={glyph} label={label} ink={color.mute} active={false} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, ink.on]}>
              <Face glyph={glyph} label={label} ink={color.dark} active />
            </Animated.View>
          </>
        ) : (
          <Face glyph={glyph} label={label} ink={active ? color.dark : color.mute} active={!!active} />
        )}
      </Animated.View>
      {badge && !active ? (
        <View style={styles.badge} pointerEvents="none">
          <Badge count={badge} size="sm" popOnMount />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, height: ITEM_HEIGHT, minWidth: 0, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 2 },
  active: { backgroundColor: color.accent },
  label: { letterSpacing: 0.4 },
  face: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  badge: { position: 'absolute', top: 5, left: '50%', marginLeft: 6 },
});
