import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Glyph } from '../atoms/Glyph';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { StreakPill } from '../molecules/StreakPill';
import { layout } from '../lib/styles';
import { springs, useReducedMotion } from '../lib/motion';
import { PopIn } from '../motion/PopIn';
import { color, type GradientName, motion, opacity, radius, size, space, veil } from '../theme';

export interface ChallengeCardProps {
  /** Petite ligne en capitales (« défi du jour »). */
  label: string;
  question: string;
  choices: readonly [string, string] | readonly string[];
  /** Défi déjà relevé aujourd'hui. */
  done: boolean;
  /** Réponse choisie (si connue). */
  picked?: number | null;
  /** Message une fois fait (« reviens demain »). */
  doneLabel?: string;
  onChoose?: (choice: 0 | 1) => void;
  loading?: boolean;
  streak?: number;
  streakUnit?: string;
  gradient?: GradientName;
}

type ChoiceState = 'idle' | 'chosen' | 'picked' | 'other';

/**
 * Une réponse : choisie, elle s'incline et grandit (le temps que la réponse parte) ; résolue, elle se redresse en jaune
 * avec sa coche, l'autre s'efface un peu.
 */
function Choice({ text, index, state, disabled, onPress, done }: { text: string; index: number; state: ChoiceState; disabled: boolean; onPress: () => void; done: boolean }) {
  const reduced = useReducedMotion();
  const tilt = useSharedValue(0);
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    const lean = index === 0 ? -3 : 3;
    tilt.value = withSpring(state === 'chosen' ? lean : 0, springs.pop);
    scale.value = withSpring(state === 'chosen' ? 1.05 : state === 'other' ? 0.96 : state === 'picked' ? 1.02 : 1, springs.pop);
    if (state === 'picked') scale.value = withSpring(1, springs.plush);
  }, [state, index, reduced, tilt, scale]);
  const anim = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }, { scale: scale.value }] }));
  const isPicked = state === 'picked';
  return (
    <Animated.View style={[styles.slot, anim]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        haptic="medium"
        accessibilityLabel={text}
        accessibilityState={{ selected: isPicked, disabled: done }}
        style={[styles.choice, (isPicked || state === 'chosen') && styles.picked, state === 'other' && styles.faded]}
      >
        <Text variant="bodyBold" size={15} color={color.dark} center numberOfLines={3}>
          {text}
        </Text>
        {isPicked ? (
          <PopIn delay={motion.instant}>
            <Glyph name="check" size={14} color={color.dark} />
          </PopIn>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/** Question du jour : deux réponses, puis l'état « fait ». */
export function ChallengeCard({ label, question, choices, done, picked, doneLabel, onChoose, loading, streak, streakUnit, gradient = 'violet' }: ChallengeCardProps) {
  const [pressed, setPressed] = useState<number | null>(null);
  useEffect(() => {
    if (!loading && !done) setPressed(null);
  }, [loading, done]);
  const stateOf = (i: number): ChoiceState => {
    if (done) return picked === i ? 'picked' : picked === null || picked === undefined ? 'idle' : 'other';
    if (loading && pressed !== null) return pressed === i ? 'chosen' : 'other';
    return 'idle';
  };
  return (
    <Panel gradient={gradient} padding="lg" style={layout.gapMd}>
      <View style={layout.rowBetween}>
        <Text variant="label">{label}</Text>
        {streak !== undefined && streakUnit ? <StreakPill count={streak} label={streakUnit} /> : null}
      </View>
      <Title text={question} size={28} />
      <View style={[layout.row, layout.gapSm]}>
        {choices.slice(0, 2).map((c, i) => (
          <Choice
            key={i}
            text={c}
            index={i}
            state={stateOf(i)}
            done={done}
            disabled={done || !!loading || !onChoose}
            onPress={() => {
              setPressed(i);
              onChoose?.(i === 0 ? 0 : 1);
            }}
          />
        ))}
      </View>
      {done && doneLabel ? (
        <PopIn from={0.7} style={styles.doneBox}>
        <View style={[layout.row, styles.done]}>
          <Glyph name="check" size={14} />
          <Text variant="bodyBold" size={13}>
            {doneLabel}
          </Text>
        </View>
        </PopIn>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  doneBox: { alignSelf: 'flex-start' },
  choice: {
    flex: 1,
    minHeight: size.button.lg + space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md + 2,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.xs + 2,
  },
  picked: { backgroundColor: color.accent },
  faded: { opacity: opacity.disabled },
  done: { gap: space.sm, alignSelf: 'flex-start', paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: radius.pill, backgroundColor: veil.darkGlass },
});
