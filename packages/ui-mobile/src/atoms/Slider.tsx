/**
 * Curseur bipolaire accessible (caractère du pet, −1..+1). Geste pan Gesture Handler v3 +
 * actions d'accessibilité incrémentales (VoiceOver « augmenter/diminuer »).
 */
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import { color, hard, radius, space } from '../foundations/theme';

export interface SliderProps {
  /** Valeur dans [-1, 1]. */
  value: number;
  onChange: (v: number) => void;
  accessibilityLabel: string;
  /** Texte vocalisé de la valeur courante (« plutôt espiègle »). */
  accessibilityValueText: string;
  step?: number;
  testID?: string;
}

const THUMB = 28;

export function Slider({ value, onChange, accessibilityLabel, accessibilityValueText, step = 0.1, testID }: SliderProps) {
  const [width, setWidth] = useState(0);
  const toValue = (x: number) => {
    const usable = Math.max(1, width - THUMB);
    const v = ((x - THUMB / 2) / usable) * 2 - 1;
    return Math.round(Math.max(-1, Math.min(1, v)) / step) * step;
  };
  const pan = usePanGesture({ runOnJS: true, onUpdate: (e) => onChange(toValue(e.x)) });
  const tap = useTapGesture({ runOnJS: true, onActivate: (e) => onChange(toValue(e.x)) });
  const left = ((value + 1) / 2) * Math.max(0, width - THUMB);
  const adjust = (d: number) => onChange(Math.max(-1, Math.min(1, Math.round((value + d) / step) * step)));

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: accessibilityValueText }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => adjust(e.nativeEvent.actionName === 'increment' ? step * 2 : -step * 2)}
      testID={testID}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={styles.hit}
    >
      <GestureDetector gesture={pan}>
        <GestureDetector gesture={tap}>
          <View style={styles.inner}>
            <View style={styles.track}>
              <View style={[styles.seg, { backgroundColor: color.coral }]} />
              <View style={[styles.seg, { backgroundColor: color.mango }]} />
              <View style={[styles.seg, { backgroundColor: color.violet }]} />
            </View>
            <View style={[styles.thumb, { left }, hard(3, color.ink)]} />
          </View>
        </GestureDetector>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 44, justifyContent: 'center' },
  inner: { height: 44, justifyContent: 'center' },
  track: { height: 10, borderRadius: radius.pill, overflow: 'hidden', flexDirection: 'row', marginHorizontal: space.xxs },
  seg: { flex: 1 },
  thumb: { position: 'absolute', width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: color.white, borderWidth: 4, borderColor: color.ink },
});
