import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { StatTile } from '../molecules/StatTile';
import { layout } from '../lib/styles';
import { color, radius, veil } from '../theme';
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
export function MemoryGrid({ days, stats, statLabels, dayLabel, blurred, columns = 4, onDayPress, emptyText }: MemoryGridProps) {
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
            ) : (
              <View key={`empty:${c}`} style={styles.filler} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Maquette V6-Souvenirs : 4 colonnes séparées de 8, vignettes de 78 pt, rayon 16, date en bas à gauche.
  tile: { flex: 1, height: 78, borderRadius: 16, overflow: 'hidden', backgroundColor: color.card },
  split: { flex: 1, flexDirection: 'row', gap: 2 },
  half: { flex: 1, backgroundColor: veil.glass },
  label: { position: 'absolute', left: 6, bottom: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: veil.darkLabel },
  filler: { flex: 1 },
});
