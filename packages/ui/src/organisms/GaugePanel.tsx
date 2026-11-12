import { GAUGE_KEYS, type GaugeKey, type Gauges } from '@blowy/domain';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { GaugeBar } from '../molecules/GaugeBar';
import { layout } from '../lib/styles';
import { color, extra, space } from '../theme';

/** Ce qui fait monter / baisser une jauge et ce que ça change à son allure. */
export interface GaugeDetail {
  up: string;
  down: string;
  look?: string;
}

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
  /** Encadré sous les jauges : texte libre… */
  footer?: ReactNode;
  /** …ou « ↑ ce qui la fait monter  ↓ ce qui la fait baisser » + son effet sur l'allure. */
  detail?: GaugeDetail | null;
}

const signed = (v: number): string => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0');

/** Les quatre jauges du caractère, touchables pour en savoir plus. */
export function GaugePanel({ gauges, labels, names, title, hint, selected, onSelect, footer, detail }: GaugePanelProps) {
  return (
    <Card padding="none" style={styles.card}>
      {title || hint ? (
        <View style={[layout.rowBetween, styles.head]}>
          {title ? (
            <Text variant="bodyHeavy" size={11} style={styles.title}>
              {title}
            </Text>
          ) : (
            <View />
          )}
          {hint ? (
            <Text variant="small" size={12} muted>
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
      {detail ? (
        <View style={[styles.footer, styles.detail]}>
          <Text variant="small" style={styles.detailText}>
            <Text variant="bodyBold" style={styles.detailText} color={color.accent}>
              ↑
            </Text>
            {` ${detail.up}  `}
            <Text variant="bodyBold" style={styles.detailText} color={extra.coralSoft}>
              ↓
            </Text>
            {` ${detail.down}`}
          </Text>
          {detail.look ? (
            <Text variant="small" muted style={[styles.detailText, styles.look]}>
              {detail.look}
            </Text>
          ) : null}
        </View>
      ) : footer ? (
        <View style={styles.footer}>{typeof footer === 'string' ? <Text variant="small" style={styles.detailText}>{footer}</Text> : footer}</View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2, paddingTop: space.md, paddingHorizontal: space.md, paddingBottom: 10, borderRadius: 24 },
  head: { paddingHorizontal: space.xs, paddingBottom: space.xs },
  title: { letterSpacing: 1.32, textTransform: 'uppercase' },
  footer: { marginTop: 6, paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: 16, backgroundColor: color.card },
  detail: { minHeight: 66 },
  detailText: { fontSize: 12.5, lineHeight: 16 },
  look: { marginTop: space.xs },
});
