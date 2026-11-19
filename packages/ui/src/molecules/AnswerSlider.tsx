import { useCallback, useMemo, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { GestureDetector, type PanGestureConfig, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '../atoms/Text';
import { haptic } from '../lib/haptics';
import { springs } from '../lib/motion';
import { layout } from '../lib/styles';
import { alpha, color, radius, space } from '../theme';

export interface AnswerSliderProps {
  /** Les deux bouts (libellé et emoji ou rien), de gauche à droite. */
  low: { label: string; icon?: string | null };
  high: { label: string; icon?: string | null };
  /** 0 à 100 ; null : pas encore touché (le curseur attend à `start`). */
  value: number | null;
  start?: number;
  onChange: (value: number) => void;
  /** Lu par le lecteur d'écran (« Ton curseur : plutôt le calme »). */
  accessibilityLabel: string;
  /** Lu pour la valeur (« 70 sur 100 »). */
  valueText: (value: number) => string;
}

const KNOB = 34;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Le curseur d'une question de Ton chemin : une piste, deux bouts nommés, un gros bouton rond qu'on glisse (ou
 * qu'on pose d'un tap sur la piste). Réglable au lecteur d'écran (± 10). La valeur part à la fin du geste.
 */
export function AnswerSlider({ low, high, value, start = 50, onChange, accessibilityLabel, valueText }: AnswerSliderProps) {
  const [width, setWidth] = useState(0);
  const w = useSharedValue(0);
  const pos = useSharedValue(((value ?? start) / 100) * 0);
  const from = useSharedValue(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width - KNOB;
    setWidth(next);
    w.value = next;
    pos.value = ((value ?? start) / 100) * next;
  };
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const commit = useCallback((v: number) => {
    haptic('selection');
    changeRef.current(clamp(v));
  }, []);
  const cfg = useMemo<PanGestureConfig>(
    () => ({
      onBegin: (e) => {
        'worklet';
        from.value = Math.max(0, Math.min(w.value, e.x - KNOB / 2));
        pos.value = withSpring(from.value, springs.press);
      },
      onUpdate: (e) => {
        'worklet';
        pos.value = Math.max(0, Math.min(w.value, from.value + e.translationX));
      },
      onFinalize: () => {
        'worklet';
        if (w.value > 0) scheduleOnRN(commit, (pos.value / w.value) * 100);
      },
    }),
    // Valeurs animées et trampoline stables : le geste n'est jamais recréé pendant un appui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const pan = usePanGesture(cfg);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value }] }));
  const fill = useAnimatedStyle(() => ({ width: pos.value + KNOB / 2 }));
  const shown = value ?? start;
  const nudge = (d: number) => {
    const v = clamp(shown + d);
    if (width > 0) pos.value = withSpring((v / 100) * width, springs.pop);
    commit(v);
  };
  return (
    <View style={styles.wrap}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max: 100, now: shown, text: valueText(shown) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? 10 : -10)}
      >
        <GestureDetector gesture={pan} touchAction="pan-y">
          <View onLayout={onLayout} style={styles.track} hitSlop={{ top: 14, bottom: 14 }}>
            <View style={styles.rail} />
            <Animated.View style={[styles.fill, value === null ? styles.idle : null, fill]} />
            <Animated.View style={[styles.knob, value === null ? styles.knobIdle : null, knob]} />
          </View>
        </GestureDetector>
      </View>
      <View style={[layout.rowBetween, styles.ends]}>
        <End label={low.label} icon={low.icon} on={value !== null && value < 40} />
        <End label={high.label} icon={high.icon} on={value !== null && value > 60} right />
      </View>
    </View>
  );
}

function End({ label, icon, on, right }: { label: string; icon?: string | null; on: boolean; right?: boolean }) {
  return (
    <View style={[styles.end, right ? styles.endRight : null]}>
      {icon ? (
        <Text size={26} style={right ? styles.right : null}>
          {icon}
        </Text>
      ) : null}
      <Text variant={on ? 'bodyHeavy' : 'body'} size={15} muted={!on} style={right ? styles.right : null}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md, paddingTop: space.sm },
  track: { height: KNOB, justifyContent: 'center' },
  rail: { position: 'absolute', left: KNOB / 2, right: KNOB / 2, height: 10, borderRadius: radius.pill, backgroundColor: alpha(color.white, 0.12) },
  fill: { position: 'absolute', left: 0, height: 10, borderRadius: radius.pill, backgroundColor: color.accent },
  idle: { opacity: 0 },
  knob: { position: 'absolute', left: 0, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: color.white, borderWidth: 4, borderColor: color.accent },
  knobIdle: { borderColor: alpha(color.white, 0.3) },
  ends: { alignItems: 'flex-start', gap: space.lg },
  end: { flex: 1, gap: 2 },
  endRight: { alignItems: 'flex-end' },
  right: { textAlign: 'right' },
});
