import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

export interface PillSpanProps {
  /** Bord gauche et bord droit du segment, en points depuis la gauche du conteneur (valeurs animées). */
  from: SharedValue<number>;
  to: SharedValue<number>;
  /** Épaisseur (= diamètre des bouts arrondis). */
  height: number;
  color: string;
  /** Largeur de référence du milieu étiré (la plus grande longueur possible, ex. la largeur de la piste). */
  span: number;
}

/**
 * Pilule de longueur animée, en transformations seulement : deux bouts ronds qui glissent et un milieu étiré
 * (`scaleX`). Même rendu qu'une vue arrondie de largeur variable, sans relayout à chaque image.
 */
export function PillSpan({ from, to, height, color, span }: PillSpanProps) {
  const r = height / 2;
  const left = useAnimatedStyle(() => {
    const a = Math.min(from.value, to.value);
    const b = Math.max(from.value, to.value);
    const len = b - a;
    // Plus court que son épaisseur : les deux bouts se superposent en une ellipse de largeur `len`.
    return { opacity: len > 0.5 ? 1 : 0, transform: [{ translateX: len < height ? a + (len - height) / 2 : a }, { scaleX: len < height ? len / height : 1 }] };
  });
  const right = useAnimatedStyle(() => {
    const a = Math.min(from.value, to.value);
    const b = Math.max(from.value, to.value);
    const len = b - a;
    return {
      opacity: len > 0.5 ? 1 : 0,
      transform: [{ translateX: len < height ? a + (len - height) / 2 : b - height }, { scaleX: len < height ? len / height : 1 }],
    };
  });
  const mid = useAnimatedStyle(() => {
    const a = Math.min(from.value, to.value);
    const b = Math.max(from.value, to.value);
    const len = Math.max(0, b - a - height);
    const w = Math.max(1, span);
    return { transform: [{ translateX: a + r + len / 2 - w / 2 }, { scaleX: len / w }] };
  });
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clipNone]}>
      <Animated.View style={[styles.abs, { width: Math.max(1, span), height, backgroundColor: color }, mid]} />
      <Animated.View style={[styles.abs, { width: height, height, borderRadius: r, backgroundColor: color }, left]} />
      <Animated.View style={[styles.abs, { width: height, height, borderRadius: r, backgroundColor: color }, right]} />
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', left: 0, top: 0 },
  clipNone: { overflow: 'visible' },
});
