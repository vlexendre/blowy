import { MAX_LIVES } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Glyph } from '../atoms/Glyph';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { Hearts } from '../molecules/Hearts';
import { StreakPill } from '../molecules/StreakPill';
import { layout } from '../lib/styles';
import { color, radius, space, veil } from '../theme';
import type { TitleContent } from '../types';

export type WeekDayState = 'done' | 'half' | 'none';

export interface LivesPanelProps {
  lives: number;
  max?: number;
  /** « 5 VIES / SUR 7 ». */
  title: TitleContent;
  /** Explication des règles. */
  text?: string;
  streak?: number;
  streakUnit?: string;
  /** Semaine en cours : initiale du jour, état et libellé de la case (« 1/2 »). */
  week?: readonly { day: string; state: WeekDayState; mark?: string }[];
  weekTitle?: string;
  accessibilityLabel?: string;
}

/** Les vies d'un lien : cœurs, série, semaine et règle en une carte. */
export function LivesPanel({ lives, max = MAX_LIVES, title, text, streak, streakUnit, week, weekTitle, accessibilityLabel }: LivesPanelProps) {
  return (
    <Card padding="lg" style={layout.gapMd}>
      <View style={[layout.rowBetween, layout.gapSm]}>
        <Title text={title} variant="h2" size={26} />
        <Hearts lives={lives} max={max} size={16} accessibilityLabel={accessibilityLabel} />
      </View>
      {week ? (
        <View style={layout.gapSm}>
          {weekTitle ? (
            <Text variant="label" muted>
              {weekTitle}
            </Text>
          ) : null}
          <View style={layout.rowBetween}>
            {week.map((d, i) => (
              <View key={i} style={styles.day}>
                <View style={[styles.dot, d.state === 'done' && styles.done, d.state === 'half' && styles.half]}>
                  {d.state === 'done' ? <Glyph name="check" size={14} color={color.dark} /> : null}
                  {d.state === 'half' && d.mark ? (
                    <Text variant="bodyBold" size={11} color={color.orange}>
                      {d.mark}
                    </Text>
                  ) : null}
                </View>
                <Text variant="bodyBold" size={11} muted={d.state !== 'half'}>
                  {d.day}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {text ? (
        <Text variant="small" color={veil.text}>
          {text}
        </Text>
      ) : null}
      {streak !== undefined && streakUnit ? <StreakPill count={streak} label={streakUnit} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  day: { alignItems: 'center', gap: space.xs + 1 },
  dot: { width: 34, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: veil.line },
  done: { backgroundColor: color.orange },
  half: { backgroundColor: 'transparent', borderWidth: 2, borderColor: color.orange },
});
