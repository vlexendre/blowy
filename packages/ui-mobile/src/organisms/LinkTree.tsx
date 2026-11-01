import { StyleSheet, View } from 'react-native';
import { color, radius, space, tone } from '../foundations/theme';
import { Icon } from '../atoms/Icon';
import { Sprite } from '../atoms/Sprite';
import { Surface } from '../atoms/Surface';
import { Text } from '../atoms/Text';

export type GateState = 'reached' | 'current' | 'locked' | 'consent-needed' | 'not-in-branch';

export interface LinkLevelNode {
  level: number;
  title: string;
  subtitle: string;
  xpLabel: string;
  state: GateState;
  /** Libellé d'état écrit (« Atteint », « Accord des deux requis »). */
  stateLabel: string;
  iconPath?: string;
}

/** Arbre du Lien : niveaux 1→7 avec portes visibles (XP + accords). */
export function LinkTree({ nodes }: { nodes: readonly LinkLevelNode[] }) {
  return (
    <View style={styles.list} accessibilityRole="list">
      {nodes.map((n, i) => {
        const on = n.state === 'reached' || n.state === 'current';
        const t = tone[n.state === 'current' ? 'lime' : n.state === 'reached' ? 'ink' : 'white'];
        return (
          <View key={n.level} style={styles.item}>
            <View style={styles.rail}>
              <View style={[styles.node, { backgroundColor: t.bg }]}>
                {n.state === 'locked' || n.state === 'not-in-branch' ? <Icon name="lock" size={16} tint={color.muted} /> : <Text variant="displayS" style={{ color: t.fg }}>{String(n.level)}</Text>}
              </View>
              {i < nodes.length - 1 ? <View style={[styles.line, on && styles.lineOn]} /> : null}
            </View>
            <Surface padding="md" style={[styles.card, n.state === 'not-in-branch' && styles.dim]} accessible accessibilityLabel={[`${n.level}`, n.title, n.subtitle, n.xpLabel, n.stateLabel].join(', ')}>
              <View style={styles.cardRow}>
                {n.iconPath ? <Sprite path={n.iconPath} size={36} /> : null}
                <View style={styles.text}>
                  <Text variant="displayS">{n.title}</Text>
                  <Text variant="small" tone="inkSoft">
                    {n.subtitle}
                  </Text>
                  <Text variant="caption" tone={n.state === 'consent-needed' ? 'violet' : 'muted'}>
                    {`${n.xpLabel} · ${n.stateLabel}`}
                  </Text>
                </View>
              </View>
            </Surface>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0 },
  item: { flexDirection: 'row', gap: space.md },
  rail: { alignItems: 'center', width: 36 },
  node: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color.creamShadow },
  line: { flex: 1, width: 4, backgroundColor: color.creamShadow, borderRadius: radius.pill, marginVertical: 2 },
  lineOn: { backgroundColor: color.ink },
  card: { flex: 1, marginBottom: space.md },
  dim: { opacity: 0.6 },
  cardRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  text: { flex: 1, gap: 2 },
});
