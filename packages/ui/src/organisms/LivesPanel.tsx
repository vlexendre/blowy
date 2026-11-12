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
  /** Grand titre facultatif (« 5 VIES / SUR 7 ») ; sinon l'en-tête est `weekTitle`. */
  title?: TitleContent;
  /** Compteur à droite des cœurs (« 5/7 »). */
  count?: string;
  /** Explication des règles. */
  text?: string;
  streak?: number;
  streakUnit?: string;
  /** Semaine en cours : initiale du jour, état et libellé de la case (« 1/2 »). */
  week?: readonly { day: string; state: WeekDayState; mark?: string }[];
  /** « cette semaine ». */
  weekTitle?: string;
  accessibilityLabel?: string;
}

/** Les vies d'un lien et la semaine de photos du jour (`.card` « cette semaine » de V6-Aujourdhui). */
export function LivesPanel({ lives, max = MAX_LIVES, title, count, text, streak, streakUnit, week, weekTitle, accessibilityLabel }: LivesPanelProps) {
  return (
    <Card padding="none" style={styles.card}>
      <View style={[layout.rowBetween, layout.gapSm]}>
        {title ? (
          <Title text={title} variant="h2" size={26} />
        ) : weekTitle ? (
          <Text variant="label" size={11} muted style={styles.kicker}>
            {weekTitle}
          </Text>
        ) : null}
        <View style={[layout.row, layout.gapSm]}>
          <Hearts lives={lives} max={max} size={14} accessibilityLabel={accessibilityLabel} />
          {count ? (
            <Text variant="bodyBold" size={13}>
              {count}
            </Text>
          ) : null}
        </View>
      </View>
      {week ? (
        <View style={[layout.rowBetween, styles.week]}>
          {week.map((d, i) => (
            <View key={i} style={styles.day}>
              <View style={[styles.dot, d.state === 'done' && styles.done, d.state === 'half' && styles.half]}>
                {d.state === 'done' ? <Glyph name="check" size={14} color={color.dark} /> : null}
                {d.state === 'half' && d.mark ? (
                  <Text variant="bodyHeavy" size={11} color={color.orange}>
                    {d.mark}
                  </Text>
                ) : null}
              </View>
              <Text variant="bodyHeavy" size={11} muted={d.state !== 'half'}>
                {d.day}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {text ? (
        <Text variant="small" color={veil.text} style={styles.text}>
          {text}
        </Text>
      ) : null}
      {streak !== undefined && streakUnit ? <StreakPill count={streak} label={streakUnit} style={styles.text} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, paddingTop: space.md + 2, paddingHorizontal: space.md + 2, paddingBottom: space.md },
  kicker: { letterSpacing: 1.32 },
  week: { marginTop: space.md },
  day: { alignItems: 'center', gap: space.xs + 1 },
  dot: { width: 34, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: veil.line },
  done: { backgroundColor: color.orange },
  half: { backgroundColor: 'transparent', borderWidth: 2, borderColor: color.orange },
  text: { marginTop: space.md },
});
