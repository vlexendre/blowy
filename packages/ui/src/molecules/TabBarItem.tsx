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
import { color } from '../theme';

/**
 * Hauteur d'un onglet : pictogramme 24 pt et libellé 10 pt dessous (ADA 2027 §0 : quatre onglets avec libellés, 54 pt).
 */
export const ITEM_HEIGHT = 54;

export interface TabBarItemProps {
  label: string;
  glyph: GlyphName;
  active?: boolean;
  badge?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Lu par VoiceOver à la place du libellé, pastille comprise (« Chats, 3 non lus »). */
  accessibilityLabel?: string;
  /**
   * Pilule glissante de `BottomTabBar` (et rang de l'onglet) : l'onglet ne dessine plus son fond jaune,
   * son encre passe du gris au sombre en fondu croisé quand la pilule arrive.
   */
  indicator?: Indicator;
  index?: number;
}

const SW = 2.2;
const ICON = 24;

/**
 * Pictos de la barre (V6-GAccueil `.ada-onglets`, viewBox 24, trait 2,2) : en contour, **pleins sur l'onglet actif**
 * (l'onglet choisi ne tient pas à la seule couleur de la pilule). Repli sur `Glyph`.
 */
function NavIcon({ glyph, color: c, active }: { glyph: GlyphName; color: string; active: boolean }) {
  const fill = active ? c : 'none';
  let body;
  switch (glyph) {
    case 'minimoa':
      body = (
        <>
          <Path d="M4.5 19.5c0-6 3.4-10 7.5-10s7.5 4 7.5 10z" stroke={c} strokeWidth={SW} fill={fill} strokeLinejoin="round" />
          <Path d="M9.5 9.8L7.6 4.6M14.5 9.8l1.9-5.2" stroke={c} strokeWidth={SW} fill="none" strokeLinecap="round" />
          <Circle cx={7.4} cy={4} r={1.6} fill={c} />
          <Circle cx={16.6} cy={4} r={1.6} fill={c} />
        </>
      );
      break;
    case 'pin':
      body = (
        <Path
          d="M12 21.5s-7-6-7-11.8a7 7 0 0 1 14 0c0 5.8-7 11.8-7 11.8zM12 7.2a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z"
          fillRule="evenodd"
          stroke={c}
          strokeWidth={SW}
          fill={fill}
          strokeLinejoin="round"
        />
      );
      break;
    case 'chat':
      body = <Path d="M4 5h16v11H9.5L4 20.5z" stroke={c} strokeWidth={SW} fill={fill} strokeLinejoin="round" />;
      break;
    case 'person':
      body = (
        <>
          <Circle cx={12} cy={8} r={4} stroke={c} strokeWidth={SW} fill={fill} />
          <Path d="M4 21c1-4 4.5-6 8-6s7 2 8 6z" stroke={c} strokeWidth={SW} fill={fill} strokeLinejoin="round" />
        </>
      );
      break;
    default:
      return <Glyph name={glyph} size={ICON} color={c} filled={active} />;
  }
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}

/**
 * Picto + libellé d'un onglet dans une encre donnée. Le libellé tient toujours sur une ligne, sans coupe : il rétrécit
 * un peu s'il le faut (écran de 320 pt, néerlandais, très grand texte) plutôt que de finir en « … ».
 */
function Face({ glyph, label, ink, active }: { glyph: GlyphName; label: string; ink: string; active: boolean }) {
  return (
    <View style={styles.face}>
      <NavIcon glyph={glyph} color={ink} active={active} />
      <Text
        variant="bodyHeavy"
        size={10}
        tabLabel
        color={ink}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        ellipsizeMode="clip"
        // Taille fixe, comme la barre d'onglets d'iOS : en très grand texte, l'appui long montre le libellé en grand
        // (Large Content Viewer, branché sur l'onglet).
        maxFontSizeMultiplier={1}
        style={styles.label}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Onglet de la barre flottante : pictogramme + libellé, pilule jaune quand actif. Devenu actif, son picto rebondit ;
 * ses pastilles font « pop » quand leur nombre change. VoiceOver : rôle « onglet », état sélectionné, et la pastille
 * dans le libellé (`accessibilityLabel`, fourni par l'écran).
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
      accessibilityShowsLargeContentViewer
      accessibilityLargeContentTitle={label}
      style={[styles.base, active && !sliding && styles.active]}
    >
      <Animated.View style={[styles.stretch, bounce]}>
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
        <View style={styles.badge} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Badge count={badge} tone="light" size="tab" popOnMount />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, height: ITEM_HEIGHT, minWidth: 44, borderRadius: ITEM_HEIGHT / 2, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: color.accent },
  stretch: { alignSelf: 'stretch' },
  // `.ada-onglets a` : 10 pt, graisse 800, approche .02em.
  label: { letterSpacing: 0.2, maxWidth: '100%' },
  face: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 2 },
  badge: { position: 'absolute', top: 3, left: '50%', marginLeft: 6 },
});
