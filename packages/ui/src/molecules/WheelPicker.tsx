import { type ReactNode, useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, type SharedValue, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { hapticFor } from '../lib/haptics';
import { useReducedMotion } from '../lib/motion';
import { color, radius } from '../theme';

/** Hauteur d'une ligne et nombre de lignes visibles (la choisie au milieu). */
export const WHEEL_ROW = 40;
const VISIBLE = 5;
const PAD = WHEEL_ROW * Math.floor(VISIBLE / 2);

export interface WheelColumnProps {
  items: readonly string[];
  index: number;
  onChange: (index: number) => void;
  /** Nom lu de la colonne (« Jour », « Mois », « Année »). */
  label: string;
  /** Part de la largeur (flex). Défaut 1. */
  flex?: number;
}

function WheelRow({ i, y, text, onPress, reduced }: { i: number; y: SharedValue<number>; text: string; onPress: () => void; reduced: boolean }) {
  const style = useAnimatedStyle(() => {
    const d = y.value / WHEEL_ROW - i;
    const a = Math.min(Math.abs(d), 2.6);
    return {
      opacity: 1 - a * 0.3,
      transform: reduced ? [] : [{ perspective: 400 }, { rotateX: `${Math.max(-60, Math.min(60, d * 22))}deg` }, { scale: 1 - Math.min(a, 2) * 0.07 }],
    };
  });
  return (
    <Pressable onPress={onPress} haptic={false} scaleTo={1} accessible={false} style={styles.row}>
      <Animated.View style={style}>
        <Text variant="bodyHeavy" size={20} center numberOfLines={1}>
          {text}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Une colonne de sélecteur à roue (comme celui d'iOS) : on fait défiler, la ligne s'aimante au milieu, chaque cran
 * fait une petite vibration ; toucher une ligne y va. Lignes inclinées et estompées loin du centre (transformations et
 * opacité seulement ; à plat avec « réduire les animations »). Lecteur d'écran : réglable par balayage haut/bas.
 */
export function WheelColumn({ items, index, onChange, label, flex = 1 }: WheelColumnProps) {
  const reduced = useReducedMotion();
  const ref = useAnimatedRef<Animated.ScrollView>();
  const y = useSharedValue(index * WHEEL_ROW);
  const tick = useSharedValue(index);
  const current = useRef(index);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const max = items.length - 1;

  const go = (i: number, animated = true) => {
    const k = Math.max(0, Math.min(max, i));
    ref.current?.scrollTo({ y: k * WHEEL_ROW, animated });
    if (k !== current.current) {
      current.current = k;
      onChange(k);
    }
  };
  // Index changé de l'extérieur (le 31 devient le 30 en passant à avril) : la roue suit.
  useEffect(() => {
    if (index !== current.current) {
      current.current = index;
      ref.current?.scrollTo({ y: index * WHEEL_ROW, animated: true });
    }
  }, [index, ref]);
  useEffect(() => () => void (settleTimer.current && clearTimeout(settleTimer.current)), []);

  const settle = (offset: number) => {
    const k = Math.max(0, Math.min(max, Math.round(offset / WHEEL_ROW)));
    if (Math.abs(offset - k * WHEEL_ROW) > 1) ref.current?.scrollTo({ y: k * WHEEL_ROW, animated: true });
    if (k !== current.current) {
      current.current = k;
      onChange(k);
    }
  };
  // Web : pas de fin d'inertie, on attend que le défilement s'arrête.
  const webScroll = (offset: number) => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => settle(offset), 140);
  };
  const web = Platform.OS === 'web';
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      y.value = e.contentOffset.y;
      const k = Math.round(e.contentOffset.y / WHEEL_ROW);
      if (k !== tick.value) {
        tick.value = k;
        runOnJS(hapticFor)('select');
      }
      if (web) runOnJS(webScroll)(e.contentOffset.y);
    },
    onMomentumEnd: (e) => {
      runOnJS(settle)(e.contentOffset.y);
    },
    onEndDrag: (e) => {
      if (!e.velocity || Math.abs(e.velocity.y) < 0.05) runOnJS(settle)(e.contentOffset.y);
    },
  });

  return (
    <View
      style={[styles.column, { flex }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[index] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => go(index + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
    >
      <Animated.ScrollView
        ref={ref}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ROW}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: index * WHEEL_ROW }}
        onLayout={() => ref.current?.scrollTo({ y: current.current * WHEEL_ROW, animated: false })}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
      >
        {items.map((text, i) => (
          <WheelRow key={`${i}-${text}`} i={i} y={y} text={text} reduced={reduced} onPress={() => go(i)} />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

export interface WheelPickerProps {
  children: ReactNode;
}

/** Cadre du sélecteur à roues : la bande de sélection derrière la ligne du milieu, les colonnes côte à côte. */
export function WheelPicker({ children }: WheelPickerProps) {
  return (
    <View style={styles.frame}>
      <View pointerEvents="none" style={styles.band} />
      <View style={styles.columns}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: WHEEL_ROW * VISIBLE, justifyContent: 'center' },
  band: { position: 'absolute', left: 0, right: 0, top: PAD, height: WHEEL_ROW, borderRadius: radius.md - 4, backgroundColor: color.card },
  columns: { flexDirection: 'row', height: WHEEL_ROW * VISIBLE },
  column: { height: WHEEL_ROW * VISIBLE },
  content: { paddingVertical: PAD },
  row: { height: WHEEL_ROW, justifyContent: 'center', paddingHorizontal: 6 },
});
