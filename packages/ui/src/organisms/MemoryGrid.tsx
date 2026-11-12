import { Image } from 'expo-image';
import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { StatTile } from '../molecules/StatTile';
import { fadeTo, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { staggerDelay } from '../motion/Appear';
import { useFirstTime } from '../motion/once';
import { hashString, makeSeed } from '../motion/seed';
import { color, motion, radius, veil } from '../theme';
import type { MemoryDayLook, MemoryStatsLook } from '../types';

export interface MemoryGridProps {
  /** Jours avec photos (`Memories.days`). */
  days: readonly MemoryDayLook[];
  /** Chiffres du lien (`Memories.stats`) ; affichés si `statLabels` est fourni. */
  stats?: MemoryStatsLook;
  statLabels?: Record<keyof MemoryStatsLook, string>;
  /** Libellé de la date d'une vignette (« 12 oct. »). */
  dayLabel: (day: string) => string;
  /** Photos floues (visages pas encore nets). */
  blurred?: boolean;
  columns?: number;
  onDayPress?: (day: MemoryDayLook) => void;
  emptyText?: string;
  /** Clé du lien : à la première visite, les photos se posent une à une comme des cartes jetées sur la table. */
  animateKey?: string;
}

const STAT_KEYS: readonly (keyof MemoryStatsLook)[] = ['daysTogether', 'bestStreak', 'photos', 'messages'];
const STAT_COLORS: Record<keyof MemoryStatsLook, string> = { daysTogether: color.white, bestStreak: color.orange, photos: color.accent, messages: color.rose };

function Half({ uri, blurred }: { uri: string | null; blurred?: boolean }) {
  return (
    <View style={styles.half}>
      {uri ? <Image source={{ uri }} contentFit="cover" blurRadius={blurred ? 20 : 0} transition={150} style={StyleSheet.absoluteFill} /> : null}
    </View>
  );
}

/** Souvenirs d'un lien : chiffres clés et grille des photos du jour à deux. */
export function MemoryGrid({ days, stats, statLabels, dayLabel, blurred, columns = 4, onDayPress, emptyText, animateKey }: MemoryGridProps) {
  const deal = useFirstTime(animateKey ? `memories:${animateKey}` : undefined) && !!animateKey;
  const rows: (MemoryDayLook | null)[][] = [];
  for (let i = 0; i < days.length; i += columns) {
    const row: (MemoryDayLook | null)[] = days.slice(i, i + columns);
    while (row.length < columns) row.push(null);
    rows.push(row);
  }
  return (
    <View style={layout.gapSm}>
      {stats && statLabels ? (
        <View style={layout.gapSm}>
          {[STAT_KEYS.slice(0, 2), STAT_KEYS.slice(2)].map((pair, i) => (
            <View key={i} style={[layout.row, layout.gapSm]}>
              {pair.map((k) => (
                <StatTile key={k} value={String(stats[k])} label={statLabels[k]} color={STAT_COLORS[k]} />
              ))}
            </View>
          ))}
        </View>
      ) : null}
      {days.length === 0 && emptyText ? (
        <Text variant="small" muted center>
          {emptyText}
        </Text>
      ) : null}
      {rows.map((row, r) => (
        <View key={r} style={[layout.row, layout.gapSm]}>
          {row.map((d, c) =>
            d ? (
              <Land key={d.day} play={deal} index={r * columns + c} seed={d.day}>
              <Pressable
                key={d.day}
                onPress={onDayPress ? () => onDayPress(d) : undefined}
                disabled={!onDayPress}
                accessibilityRole={onDayPress ? 'button' : 'image'}
                accessibilityLabel={dayLabel(d.day)}
                scaleTo={0.96}
                style={styles.tile}
              >
                <View style={styles.split}>
                  <Half uri={d.myPhotoUrl} blurred={blurred} />
                  <Half uri={d.theirPhotoUrl} blurred={blurred} />
                </View>
                <View style={styles.label}>
                  <Text variant="bodyHeavy" size={10} color={color.white} numberOfLines={1}>
                    {dayLabel(d.day)}
                  </Text>
                </View>
              </Pressable>
              </Land>
            ) : (
              <View key={`empty:${c}`} style={styles.filler} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

/**
 * Une photo qui se pose comme une carte : elle tombe d'un peu plus haut, plus grande et inclinée (angle tiré de sa
 * date), puis se pose à plat avec un petit rebond. Animations réduites : fondu décalé.
 */
function Land({ play, index, seed, children }: { play: boolean; index: number; seed: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(play ? 0 : 1);
  const o = useSharedValue(play ? 0 : 1);
  const tilt = (makeSeed(hashString(seed)).next() - 0.5) * 24;
  useEffect(() => {
    if (!play) return;
    const delay = 120 + staggerDelay(index, 70);
    if (reduced) {
      p.value = 1;
      o.value = withDelay(Math.min(delay, motion.base), fadeTo(1, motion.fast));
      return;
    }
    o.value = withDelay(delay, withTiming(1, { duration: motion.instant }));
    p.value = withDelay(delay, withSpring(1, springs.plush));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => {
    const k = 1 - p.value;
    return { opacity: o.value, transform: [{ translateY: -14 * k }, { rotate: `${tilt * k}deg` }, { scale: 1 + 0.16 * k }] };
  });
  return <Animated.View style={[styles.land, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  land: { flex: 1 },
  // Maquette V6-Souvenirs : 4 colonnes séparées de 8, vignettes de 78 pt, rayon 16, date en bas à gauche.
  tile: { height: 78, borderRadius: 16, overflow: 'hidden', backgroundColor: color.card },
  split: { flex: 1, flexDirection: 'row', gap: 2 },
  half: { flex: 1, backgroundColor: veil.glass },
  label: { position: 'absolute', left: 6, bottom: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: veil.darkLabel },
  filler: { flex: 1 },
});
