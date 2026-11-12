import type { Mood, Species } from '@blowy/domain';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type PetPose, petImage, RENDER_RATIO } from '../assets/pets';
import type { GlyphName } from '../atoms/Glyph';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { ITEM_HEIGHT, TabBarItem } from '../molecules/TabBarItem';
import { useIndicator, useIndicatorStyle } from '../motion/indicator';
import { alpha, color, radius, space, veil } from '../theme';

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
  /** À chaque changement d'onglet, ce pet passe la tête au-dessus de la barre un instant (décoratif). */
  peek?: { species: Species; mood?: Mood | PetPose };
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** `.gnav` : onglets de 54 + 2 × 6 de marge intérieure + 2 × 1 de bordure. */
const BAR_HEIGHT = ITEM_HEIGHT + 2 * 6 + 2;
const PAD = 6;
const GAP = 2;
const PEEK = 52;

/** Petite tête qui passe au-dessus de la barre, au-dessus de l'onglet choisi, puis replonge. */
function TabPeek({
  species,
  mood = 'joie',
  index,
  step,
  offset,
  show,
}: {
  species: Species;
  mood?: Mood | PetPose;
  index: number;
  step: number;
  offset: number;
  show: number;
}) {
  const p = useSharedValue(0);
  const h = PEEK / RENDER_RATIO;
  useEffect(() => {
    if (!show) return;
    p.value = 0;
    // Monte vite en dépassant un peu (ressort), reste un instant, replonge.
    p.value = withSequence(withSpring(1, { ...springs.pop, damping: 11 }), withDelay(450, withTiming(0, { duration: 170, easing: ease.in })));
  }, [show, p]);
  // Haut du dessin à 17 % du buste ; on en montre la moitié (jusqu'aux yeux).
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: h * (1 - p.value * 0.5) - h * 0.17 * p.value }, { rotate: `${(1 - p.value) * 12}deg` }] }));
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.peekClip, { left: offset + index * step + step / 2 - PEEK / 2, height: h * 0.56, top: -h * 0.56 + 1 }]}
    >
      <Animated.View style={[{ width: PEEK, height: h, top: -h * 0.44 }, style]}>
        <Image source={petImage(species, mood)} contentFit="contain" style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

/** Hauteur à réserver en bas d'un écran sous la barre flottante (hors zone de sécurité). */
export const TAB_BAR_SPACE = BAR_HEIGHT + space.lg + space.sm;

/**
 * Barre d'onglets flottante en verre. Utilisable comme `tabBar` d'expo-router :
 * `tabBar={(p) => <BottomTabBar items={…} activeKey={p.state.routes[p.state.index].name} onPress={(k) => p.navigation.navigate(k)} />}`.
 */
export function BottomTabBar<K extends string>({
  items,
  activeKey,
  onPress,
  onLongPress,
  floating = true,
  peek,
  accessibilityLabel,
  style,
}: BottomTabBarProps<K>) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const bottom = Math.max(insets.bottom, space.lg);
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    items.findIndex((it) => it.key === activeKey),
  );
  const seg = items.length ? (width - 2 - PAD * 2 - GAP * (items.length - 1)) / items.length : 0;
  const indicator = useIndicator(index);
  const pill = useIndicatorStyle(indicator, seg + GAP, 0.1);
  const [peekKey, setPeekKey] = useState(0);
  const last = useRef(activeKey);
  useEffect(() => {
    if (last.current !== activeKey && peek && !reduced) setPeekKey((n) => n + 1);
    last.current = activeKey;
  }, [activeKey, peek, reduced]);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View pointerEvents="box-none" style={[floating ? styles.floating : null, { paddingBottom: bottom }, styles.outer, style]}>
      {peek && peekKey > 0 && width > 0 ? (
        <TabPeek species={peek.species} mood={peek.mood} index={index} step={seg + GAP} offset={14 + 1 + PAD} show={peekKey} />
      ) : null}
      <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} onLayout={onLayout} style={styles.bar}>
        <View pointerEvents="none" style={styles.glass}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.tint]} />
        </View>
        {width > 0 ? <Animated.View pointerEvents="none" style={[styles.pill, { width: seg }, pill]} /> : null}
        {items.map((it, i) => (
          <TabBarItem
            key={it.key}
            label={it.label}
            glyph={it.glyph}
            badge={it.badge}
            active={it.key === activeKey}
            indicator={width > 0 ? indicator : undefined}
            index={i}
            onPress={() => onPress(it.key)}
            onLongPress={onLongPress ? () => onLongPress(it.key) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glass: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: BAR_HEIGHT / 2, overflow: 'hidden' },
  tint: { backgroundColor: alpha(color.card, 0.62) },
  floating: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  outer: { paddingHorizontal: 14 },
  pill: { position: 'absolute', top: PAD, left: PAD, height: ITEM_HEIGHT, borderRadius: radius.lg, backgroundColor: color.accent },
  peekClip: { position: 'absolute', width: PEEK, overflow: 'hidden' },
  bar: {
    flexDirection: 'row',
    gap: GAP,
    padding: PAD,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    borderWidth: 1,
    borderColor: veil.glassStrong,
    // `box-shadow: 0 14px 30px rgba(0,0,0,.45)`
    shadowColor: color.night,
    shadowOpacity: 0.45,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
});
