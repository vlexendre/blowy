/**
 * Scène du Nid : décor 2D scénographié, caméra déplaçable (pan horizontal) avec parallaxe
 * (fond lent, pets au premier plan) et zoom pinch borné. « Tourner le Nid » = déplacement de
 * caméra, pas de 3D. Gesture Handler v3 (hooks) + Reanimated worklets.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useState } from 'react';
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useA11yPrefs } from '../foundations/accessibility';
import { SCENE_LIMITS, clamp, maxPanX } from '../foundations/motion';
import { color, hard, radius, scrim, space } from '../foundations/theme';
import { Sprite } from '../atoms/Sprite';
import { Text } from '../atoms/Text';

export interface PetSceneProps {
  /** Asset du décor (scenes/*.webp). */
  backgroundPath: string;
  height: number;
  /** Titre de lieu affiché en haut à droite (« Chez Suzie »). */
  placeTitle?: string;
  placeSubtitle?: string;
  /** Aide gestuelle (« glisse · pince »). */
  gestureHint?: string;
  /** Résumé vocal de la scène (lieu + présents). */
  accessibilityLabel: string;
  /** Pets et objets posés sur la ligne de sol (premier plan). */
  children: ReactNode;
  /** Couche par-dessus (déplacement en cours…). */
  overlay?: ReactNode;
  testID?: string;
}

/** Le décor est plus large que la vue pour permettre le panoramique. */
const BG_OVERSCAN = 1.35;

export function PetScene({
  backgroundPath,
  height,
  placeTitle,
  placeSubtitle,
  gestureHint,
  accessibilityLabel,
  children,
  overlay,
  testID,
}: PetSceneProps) {
  const { reduceMotion } = useA11yPrefs();
  const [w, setW] = useState(0);
  const pan = useSharedValue(0);
  const panStart = useSharedValue(0);
  const scale = useSharedValue(1);
  const scaleStart = useSharedValue(1);
  const width = useSharedValue(0);

  const panG = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-14, 14],
    onBegin: () => {
      'worklet';
      panStart.value = pan.value;
    },
    onUpdate: (e) => {
      'worklet';
      const lim = maxPanX(width.value, width.value * BG_OVERSCAN, scale.value);
      pan.value = clamp(panStart.value + e.translationX, -lim, lim);
    },
    onDeactivate: () => {
      'worklet';
      if (!reduceMotion) pan.value = withSpring(pan.value * 0.6, { damping: 18 });
    },
  });
  const pinchG = usePinchGesture({
    onBegin: () => {
      'worklet';
      scaleStart.value = scale.value;
    },
    onUpdate: (e) => {
      'worklet';
      scale.value = clamp(scaleStart.value * e.scale, SCENE_LIMITS.minScale, SCENE_LIMITS.maxScale);
    },
    onDeactivate: () => {
      'worklet';
      const lim = maxPanX(width.value, width.value * BG_OVERSCAN, scale.value);
      pan.value = clamp(pan.value, -lim, lim);
    },
  });
  const gesture = useSimultaneousGestures(panG, pinchG);

  const back = useAnimatedStyle(() => ({
    transform: [
      { translateX: pan.value * SCENE_LIMITS.parallaxBack },
      { scale: 1 + (scale.value - 1) * 0.6 },
    ],
  }));
  const front = useAnimatedStyle(() => ({
    transform: [
      { translateX: pan.value * SCENE_LIMITS.parallaxFront * 0.5 },
      { scale: scale.value },
    ],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const nw = e.nativeEvent.layout.width;
    setW(nw);
    width.value = nw;
  };

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[styles.frame, { height }, hard(6, color.sunShadow)]}
    >
      <GestureDetector gesture={gesture}>
        <View
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel}
        >
          <Animated.View
            style={[
              styles.bg,
              { width: w * BG_OVERSCAN, left: -(w * (BG_OVERSCAN - 1)) / 2, height },
              back,
            ]}
          >
            <Sprite
              path={backgroundPath}
              size={w * BG_OVERSCAN}
              height={height}
              contentFit="cover"
            />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.stage, front]}>
            {children}
          </Animated.View>
        </View>
      </GestureDetector>
      {placeTitle ? (
        <View
          style={styles.place}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text variant="displayM" tone="white" align="right">
            {placeTitle}
          </Text>
          {placeSubtitle ? (
            <Text variant="caption" tone="white" align="right">
              {placeSubtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {gestureHint ? (
        <View
          style={styles.hint}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text variant="caption" tone="white">
            {gestureHint}
          </Text>
        </View>
      ) : null}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.xxl, overflow: 'hidden', backgroundColor: color.mango },
  bg: { position: 'absolute', top: 0 },
  stage: { justifyContent: 'flex-end', paddingBottom: space.xl },
  place: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    backgroundColor: scrim.medium,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    maxWidth: '70%',
  },
  hint: {
    position: 'absolute',
    bottom: space.sm,
    left: space.md,
    backgroundColor: scrim.strong,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
});
