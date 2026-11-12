import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { InkProvider } from '../lib/ink';
import { alpha, color, extra, radius, space } from '../theme';
import type { TitleContent } from '../types';

export interface LevelHeroProps {
  /** « niveau 3 sur 7 ». */
  kicker: string;
  title: TitleContent;
  /** Avancement vers le niveau suivant (0 à 1). */
  ratio: number;
  /** « 340 / 500 xp avant le niveau 4 ». */
  progressLabel: string;
  /** Les deux pets, posés en bas à droite et débordant du panneau. */
  art?: ReactNode;
}

/** Panneau du niveau d'un lien (V6-Lien) : niveau, titre, barre d'xp, les pets qui débordent. */
export function LevelHero({ kicker, title, ratio, progressLabel, art }: LevelHeroProps) {
  const pct = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%` as const;
  return (
    <View style={styles.panel}>
      <LinearGradient colors={extra.roseLight} style={[StyleSheet.absoluteFill, styles.round]} />
      {art ? (
        <View pointerEvents="none" style={styles.art}>
          {art}
        </View>
      ) : null}
      <InkProvider value={color.dark}>
        <Text variant="label" size={11} style={styles.kicker}>
          {kicker}
        </Text>
        <Title text={title} size={44} style={styles.title} />
        <View style={styles.progress} accessible accessibilityRole="progressbar" accessibilityLabel={progressLabel}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: pct }]} />
          </View>
          <Text variant="bodyHeavy" size={12} style={styles.caption}>
            {progressLabel}
          </Text>
        </View>
      </InkProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  // `.panel` : rayon 32, padding 18 ; le duo déborde (right -26, bottom -16).
  panel: { borderRadius: 32, padding: 18 },
  round: { borderRadius: 32 },
  art: { position: 'absolute', right: -26, bottom: -16 },
  kicker: { letterSpacing: 1.32, opacity: 0.7 },
  title: { marginTop: space.xs },
  progress: { marginTop: space.md + 2, width: 186 },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: alpha(color.dark, 0.18), overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: color.dark },
  caption: { marginTop: 5 },
});
