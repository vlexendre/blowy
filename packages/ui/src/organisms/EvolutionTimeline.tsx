import { GAUGE_KEYS, type GaugeKey, type PetEventKind } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { alpha, color, radius, space, veil } from '../theme';
import type { PetEventLook } from '../types';

export interface EvolutionTimelineProps {
  events: readonly PetEventLook[];
  /** Libellé de chaque événement (`eventLabel` de @blowy/content accepté tel quel). */
  eventLabels: Record<PetEventKind, string>;
  /** Pôles des jauges (`gaugeLabel` de @blowy/content) : « +12 sociable », « −5 bavard ». */
  gaugeLabels: Record<GaugeKey, { low: string; high: string }>;
  /** Date affichée d'un événement (« hier », « 12 oct. »). */
  dateLabel: (at: string) => string;
  /** Texte quand la liste est vide. */
  emptyText?: string;
}

const deltaText = (v: number, label: string): string => `${v > 0 ? '+' : '−'}${Math.abs(v)} ${label}`;

/** Journal du caractère : ce qui s'est passé et comment les jauges ont bougé. */
export function EvolutionTimeline({ events, eventLabels, gaugeLabels, dateLabel, emptyText }: EvolutionTimelineProps) {
  if (events.length === 0) {
    return emptyText ? (
      <Text variant="small" muted center>
        {emptyText}
      </Text>
    ) : null;
  }
  return (
    <View accessibilityRole="list">
      {events.map((e, i) => {
        const deltas = GAUGE_KEYS.flatMap((k) => {
          const v = e.delta[k];
          return v ? [{ k, v }] : [];
        });
        return (
          <View key={e.id} accessible style={[layout.rowTop, styles.row]}>
            <View style={styles.rail}>
              <View style={styles.dot} />
              {i < events.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={[layout.grow, styles.body]}>
              <View style={[layout.rowBetween, layout.gapSm]}>
                <Text variant="bodyBold" size={15} style={layout.shrink}>
                  {eventLabels[e.kind]}
                </Text>
                <Text variant="small" muted>
                  {dateLabel(e.at)}
                </Text>
              </View>
              {deltas.length ? (
                <View style={layout.wrap}>
                  {deltas.map(({ k, v }) => (
                    <View key={k} style={[styles.delta, { backgroundColor: alpha(v > 0 ? color.accent : color.coral, 0.16) }]}>
                      <Text variant="bodyBold" size={12} color={v > 0 ? color.accent : color.coral}>
                        {deltaText(v, gaugeLabels[k].high)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.md },
  rail: { width: 14, alignItems: 'center', alignSelf: 'stretch', paddingTop: space.xs + 1 },
  dot: { width: 12, height: 12, borderRadius: radius.pill, backgroundColor: color.accent, borderWidth: 3, borderColor: color.panel },
  line: { flex: 1, width: 2, backgroundColor: veil.glass, marginTop: 2 },
  body: { gap: space.sm, paddingBottom: space.lg },
  delta: { paddingHorizontal: space.md - 2, paddingVertical: space.xs, borderRadius: radius.pill },
});
