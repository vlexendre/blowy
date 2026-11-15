import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Glyph } from '../atoms/Glyph';
import { Icon } from '../atoms/Icon';
import { RichText, type TextRun } from '../atoms/RichText';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { useFirstTime } from '../motion/once';
import { PopIn } from '../motion/PopIn';
import { alpha, color, radius, space, veil } from '../theme';

/** not_yet : avant le premier jour de la personne (neutre, ni manqué ni à venir). */
export type StreakDayStatus = 'done' | 'joker' | 'missed' | 'today' | 'future' | 'not_yet';

export interface StreakWeekProps {
  /** Lundi → dimanche (`Streak.week` du contrat, avec l'initiale du jour). */
  days: readonly { letter: string; status: StreakDayStatus; label: string }[];
  /** Phrase sous la semaine (« Aujourd'hui : **le café dehors**, et c'est 13. »). */
  runs?: readonly TextRun[];
  /** Clé de la semaine : à la première apparition de la session, les jours faits se cochent un à un. */
  animateKey?: string;
}

const TICK_START = 220;
const TICK_STEP = 110;
const DOT = 38;

/**
 * La semaine de la série (V6-GSerie) : jours faits en jaune cochés, joker en violet, aujourd'hui en pointillé, jours
 * d'avant l'arrivée de la personne à peine tracés (neutres).
 */
export function StreakWeek({ days, runs, animateKey }: StreakWeekProps) {
  const first = useFirstTime(animateKey ? `streak-week:${animateKey}` : undefined);
  const tick = !!animateKey && first;
  let ticked = 0;
  return (
    <Card padding="none" style={styles.card}>
      <View style={layout.rowBetween}>
        {days.map((d, i) => {
          const pops = tick && (d.status === 'done' || d.status === 'joker');
          const delay = TICK_START + ticked * TICK_STEP;
          if (pops) ticked += 1;
          const dot = (
            <View style={[styles.dot, styles[d.status]]}>
              {d.status === 'done' ? <Glyph name="check" size={15} color={color.dark} /> : null}
              {d.status === 'joker' ? <Icon name="etoiles" size={22} /> : null}
            </View>
          );
          return (
            <View key={i} style={styles.day} accessible accessibilityLabel={d.label}>
              {pops ? (
                <PopIn delay={delay} from={0.4}>
                  {dot}
                </PopIn>
              ) : (
                dot
              )}
              <Text variant="bodyHeavy" size={13} muted={d.status !== 'today'}>
                {d.letter}
              </Text>
            </View>
          );
        })}
      </View>
      {runs?.length ? <RichText size={15} center runs={runs} style={styles.text} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, paddingHorizontal: space.lg, paddingVertical: space.lg },
  day: { alignItems: 'center', gap: space.xs + 2, minWidth: DOT },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: color.accent },
  joker: { backgroundColor: color.violet },
  missed: { backgroundColor: veil.line },
  today: { borderWidth: 2, borderStyle: 'dashed', borderColor: color.accent },
  future: { borderWidth: 1, borderColor: alpha(color.white, 0.14) },
  not_yet: { opacity: 0.35, borderWidth: 1, borderStyle: 'dotted', borderColor: alpha(color.white, 0.14) },
  text: { marginTop: space.md },
});
