import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { type StyleProp, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { hapticFor } from '../lib/haptics';
import { ease, fadeTo, springs, useLoop, useReducedMotion } from '../lib/motion';
import { DrawnCheck } from '../motion/DrawnCheck';
import { PopIn, Shake } from '../motion/PopIn';
import { color, motion, radius, size, space, type } from '../theme';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Appelé quand tous les chiffres sont saisis. */
  onComplete?: (value: string) => void;
  length?: number;
  error?: string | null;
  /** Code accepté : les cases passent au vert en vague et une coche se dessine. */
  success?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Libellé lu (« code reçu par e-mail »). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const CELL_H = 60;
const CELL_MAX = 52;
/** Code bon : vague verte (40 ms par case), puis les cases se rejoignent au milieu et deviennent une coche. */
const WAVE_STEP = 40;
const GATHER_AT = 300;
const CHECK_DISC = 52;

/**
 * Saisie d'un code à 6 chiffres : un champ caché, des cases visibles. Gère le remplissage automatique.
 * Chaque chiffre arrive en « pop », la case active a un curseur qui clignote ; code faux : la rangée se secoue ;
 * code bon (`success`) : vague verte et coche dessinée.
 */
export function OtpInput({ value, onChange, onComplete, length = 6, error, success, autoFocus, disabled, accessibilityLabel = 'code', style }: OtpInputProps) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const digits = value.replace(/\D/g, '').slice(0, length);
  const set = (raw: string) => {
    const next = raw.replace(/\D/g, '').slice(0, length);
    if (next.length > digits.length) hapticFor('press');
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };
  // Une secousse à chaque nouvelle erreur (la vibration « erreur » est incluse).
  const [failed, setFailed] = useState(0);
  const lastError = useRef(error);
  useEffect(() => {
    if (error && error !== lastError.current) setFailed((n) => n + 1);
    lastError.current = error;
  }, [error]);
  const caret = useLoop(420, !disabled && !success && digits.length < length);
  // Écart entre deux centres de case (pour que les cases se rejoignent au milieu quand le code est bon).
  const [rowWidth, setRowWidth] = useState(0);
  const cellW = Math.min(CELL_MAX, (rowWidth - space.sm * (length - 1)) / length);
  const pitch = length > 1 ? (rowWidth - cellW) / (length - 1) : 0;
  return (
    <View style={[styles.wrap, style]}>
      <Shake trigger={failed}>
        <Pressable
          onPress={() => input.current?.focus()}
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
          haptic={false}
          scaleTo={1}
          accessibilityRole="none"
          accessible={false}
          style={styles.row}
        >
          {Array.from({ length }, (_, i) => {
            const ch = digits[i];
            const active = i === Math.min(digits.length, length - 1) && !disabled && !success;
            return (
              <Cell
                key={i}
                index={i}
                toCenter={((length - 1) / 2 - i) * pitch}
                ch={ch}
                active={active}
                error={!!error}
                success={!!success}
                caret={active && !ch ? caret : null}
              />
            );
          })}
        </Pressable>
        {success ? (
          <View pointerEvents="none" style={styles.checkBox}>
            <PopIn delay={GATHER_AT + 120} from={0.3} style={styles.checkDisc}>
              <DrawnCheck size={30} color={color.dark} strokeWidth={4} delay={GATHER_AT + 200} haptic="success" />
            </PopIn>
          </View>
        ) : null}
      </Shake>
      <TextInput
        ref={input}
        value={digits}
        onChangeText={set}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        accessibilityLabel={accessibilityLabel}
        caretHidden
        style={styles.hidden}
      />
      {error ? (
        <Text variant="small" color={color.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

interface CellProps {
  index: number;
  /** Distance jusqu'au centre de la rangée (code bon : la case y glisse et s'efface). */
  toCenter: number;
  ch?: string;
  active: boolean;
  error: boolean;
  success: boolean;
  caret: ReturnType<typeof useLoop> | null;
}

/** Une case : bordure jaune (active), rouge (erreur) ou verte (code bon, en vague de gauche à droite). */
function Cell({ index, toCenter, ch, active, error, success, caret }: CellProps) {
  const reduced = useReducedMotion();
  const lit = useSharedValue(active ? 1 : 0);
  const ok = useSharedValue(success ? 1 : 0);
  const s = useSharedValue(1);
  const gather = useSharedValue(0);
  useEffect(() => {
    lit.value = reduced ? fadeTo(active ? 1 : 0, motion.instant) : withTiming(active ? 1 : 0, { duration: motion.fast, easing: ease.out });
  }, [active, reduced, lit]);
  useEffect(() => {
    if (!success) {
      ok.value = 0;
      gather.value = 0;
      return;
    }
    const wait = index * WAVE_STEP;
    ok.value = withDelay(wait, reduced ? fadeTo(1, motion.fast) : withTiming(1, { duration: motion.fast }));
    gather.value = withDelay(GATHER_AT, reduced ? fadeTo(1, motion.fast) : withTiming(1, { duration: motion.base, easing: ease.in }));
    if (!reduced) s.value = withDelay(wait, withSequence(withTiming(1.1, { duration: motion.instant, easing: ease.out }), withSpring(1, springs.pop)));
  }, [success, index, reduced, ok, s, gather]);
  // La case se gonfle un peu quand un chiffre y tombe.
  const filled = !!ch;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (filled && !reduced) s.value = withSequence(withTiming(1.07, { duration: motion.instant, easing: ease.out }), withSpring(1, springs.pop));
  }, [filled, reduced, s]);
  const box = useAnimatedStyle(() =>
    reduced
      ? { opacity: 1 - gather.value }
      : { opacity: 1 - gather.value, transform: [{ translateX: toCenter * gather.value }, { scale: s.value * (1 - 0.4 * gather.value) }] },
    [toCenter, reduced],
  );
  const litStyle = useAnimatedStyle(() => ({ opacity: lit.value }));
  const okStyle = useAnimatedStyle(() => ({ opacity: ok.value }));
  const caretStyle = useAnimatedStyle(() => ({ opacity: caret ? (reduced ? 1 : 0.15 + 0.85 * caret.value) : 0 }));
  return (
    <Animated.View style={[styles.cell, error ? styles.error : null, box]}>
      {error ? null : <Animated.View pointerEvents="none" style={[styles.ring, styles.activeRing, litStyle]} />}
      <Animated.View pointerEvents="none" style={[styles.ring, styles.okRing, okStyle]} />
      {ch ? (
        <PopIn key={`${index}:${ch}`} from={0.3}>
          <Text variant="h2" size={28}>
            {ch}
          </Text>
        </PopIn>
      ) : caret ? (
        <Animated.View pointerEvents="none" style={[styles.caret, caretStyle]} />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm, justifyContent: 'space-between' },
  cell: {
    flex: 1,
    maxWidth: CELL_MAX,
    height: CELL_H,
    borderRadius: radius.sm + 2,
    backgroundColor: color.panel,
    borderWidth: size.border + 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { position: 'absolute', top: -(size.border + 1), left: -(size.border + 1), right: -(size.border + 1), bottom: -(size.border + 1), borderRadius: radius.sm + 2, borderWidth: size.border + 1 },
  activeRing: { borderColor: color.accent },
  okRing: { borderColor: color.ok },
  error: { borderColor: color.danger },
  caret: { width: 2, height: 26, borderRadius: 1, backgroundColor: color.accent },
  checkBox: { position: 'absolute', top: 0, left: 0, right: 0, height: CELL_H, alignItems: 'center', justifyContent: 'center' },
  checkDisc: { width: CHECK_DISC, height: CHECK_DISC, borderRadius: CHECK_DISC / 2, backgroundColor: color.ok, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, height: CELL_H, opacity: 0, color: 'transparent', ...type.body },
});
