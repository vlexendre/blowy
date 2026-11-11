import { GAUGE_KEYS, type GaugeKey, type Gauges } from '@blowy/domain';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { GaugeBar } from '../molecules/GaugeBar';
import { layout } from '../lib/styles';
import { radius, space, veil } from '../theme';

export interface GaugePanelProps {
  gauges: Gauges;
  /** Pôles de chaque jauge (`gaugeLabel` de @blowy/content accepté tel quel). */
  labels: Record<GaugeKey, { low: string; high: string }>;
  /** Nom de chaque jauge (« sociabilité ») : la valeur signée est ajoutée (« sociabilité · +45 »). */
  names?: Partial<Record<GaugeKey, string>>;
  /** Titre de la carte (« son caractère »). */
  title?: string;
  /** Aide à droite du titre (« touche une jauge »). */
  hint?: string;
  selected?: GaugeKey | null;
  onSelect?: (key: GaugeKey) => void;
  /** Encadré sous les jauges (explication de la jauge choisie). */
  footer?: ReactNode;
}

const signed = (v: number): string => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0');

/** Les quatre jauges du caractère, touchables pour en savoir plus. */
export function GaugePanel({ gauges, labels, names, title, hint, selected, onSelect, footer }: GaugePanelProps) {
  return (
    <Card padding="md" style={styles.card}>
      {title || hint ? (
        <View style={[layout.rowBetween, styles.head]}>
          {title ? <Text variant="label">{title}</Text> : <View />}
          {hint ? (
            <Text variant="small" muted>
              {hint}
            </Text>
          ) : null}
        </View>
      ) : null}
      {GAUGE_KEYS.map((k) => {
        const name = names?.[k];
        return (
          <GaugeBar
            key={k}
            value={gauges[k]}
            low={labels[k].low}
            high={labels[k].high}
            caption={name ? `${name} · ${signed(gauges[k])}` : undefined}
            selected={selected === k}
            onPress={onSelect ? () => onSelect(k) : undefined}
          />
        );
      })}
      {footer ? <View style={styles.footer}>{typeof footer === 'string' ? <Text variant="small">{footer}</Text> : footer}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.xs },
  head: { paddingHorizontal: space.xs, marginBottom: space.xs },
  footer: { marginTop: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: veil.line },
});
