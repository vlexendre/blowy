import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { Surface } from '../atoms/Surface';
import { Gauge, type GaugeProps } from '../molecules/Gauge';
import { StatusPill } from '../molecules/StatusPill';

export interface GaugePanelProps {
  gauges: readonly (GaugeProps & { key: string })[];
  /** « État du 14:02 » — le pet est figé à son dernier état officiel. */
  asOfLabel?: string;
  stale?: boolean;
}

export function GaugePanel({ gauges, asOfLabel, stale }: GaugePanelProps) {
  return (
    <Surface padding="md" style={styles.wrap}>
      {asOfLabel ? <StatusPill kind={stale ? 'pending' : 'info'} label={asOfLabel} /> : null}
      <View style={styles.grid}>
        {gauges.map(({ key, ...g }) => (
          <Gauge key={key} {...g} />
        ))}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
});
