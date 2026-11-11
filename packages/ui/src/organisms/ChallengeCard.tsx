import { StyleSheet, View } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { StreakPill } from '../molecules/StreakPill';
import { layout } from '../lib/styles';
import { color, type GradientName, opacity, radius, size, space, veil } from '../theme';

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

/** Question du jour : deux réponses, puis l'état « fait ». */
export function ChallengeCard({ label, question, choices, done, picked, doneLabel, onChoose, loading, streak, streakUnit, gradient = 'violet' }: ChallengeCardProps) {
  return (
    <Panel gradient={gradient} padding="lg" style={layout.gapMd}>
      <View style={layout.rowBetween}>
        <Text variant="label">{label}</Text>
        {streak !== undefined && streakUnit ? <StreakPill count={streak} label={streakUnit} /> : null}
      </View>
      <Title text={question} size={28} />
      <View style={[layout.row, layout.gapSm]}>
        {choices.slice(0, 2).map((c, i) => {
          const isPicked = done && picked === i;
          return (
            <Pressable
              key={i}
              onPress={() => onChoose?.(i === 0 ? 0 : 1)}
              disabled={done || loading || !onChoose}
              haptic="medium"
              accessibilityLabel={c}
              accessibilityState={{ selected: isPicked, disabled: done }}
              style={[styles.choice, isPicked && styles.picked, done && !isPicked && styles.faded]}
            >
              <Text variant="bodyBold" size={15} color={color.dark} center numberOfLines={3}>
                {c}
              </Text>
              {isPicked ? <Glyph name="check" size={14} color={color.dark} /> : null}
            </Pressable>
          );
        })}
      </View>
      {done && doneLabel ? (
        <View style={[layout.row, styles.done]}>
          <Glyph name="check" size={14} />
          <Text variant="bodyBold" size={13}>
            {doneLabel}
          </Text>
        </View>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
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
