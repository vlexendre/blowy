import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Glyph } from '../atoms/Glyph';
import { ItemImage } from '../atoms/ItemImage';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { Pulse } from '../motion/PopIn';
import { Stagger } from '../motion/Appear';
import { color, radius, space, veil } from '../theme';

export interface Milestone {
  /** Palier (3, 7, 14, 30, 60, 100). */
  days: number;
  /** Objet débloqué au palier (image réelle). */
  itemId: string | null;
  /** owned : gagné · next : le prochain · locked : plus loin. */
  state: 'owned' | 'next' | 'locked';
  /** « 3 j ». */
  label: string;
  /** Libellé lu (« La couronne de fleurs, 3 jours, gagnée »). */
  accessibilityLabel: string;
}

export interface MilestoneTrackProps {
  /** « Ses objets de série ». */
  title: string;
  /** À droite du titre (« L’écharpe dans 2 jours »). */
  hint?: string;
  milestones: readonly Milestone[];
  /** Clé de la cascade (une fois par session). */
  onceKey?: string;
}

/** Les paliers de la série et leurs objets (V6-GSerie) : gagnés cochés, le prochain en jaune qui bat deux fois. */
export function MilestoneTrack({ title, hint, milestones, onceKey }: MilestoneTrackProps) {
  return (
    <Card padding="none" style={styles.card}>
      <View style={styles.head}>
        <Text variant="bodyHeavy" size={17} accessibilityRole="header">
          {title}
        </Text>
        {hint ? (
          <Text size={15} muted>
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={styles.row}>
      <Stagger onceKey={onceKey} from="below" distance={8}>
        {milestones.map((m) => (
          <View key={m.days} accessible accessibilityLabel={m.accessibilityLabel} style={styles.cell}>
            <Pulse active={m.state === 'next'} beats={2} scale={1.08} delay={700}>
              <View style={[styles.tile, m.state === 'next' && styles.next, m.state === 'locked' && styles.locked]}>
                {m.itemId ? <ItemImage id={m.itemId} size={m.state === 'next' ? 42 : 36} /> : null}
                {m.state === 'owned' ? (
                  <View style={styles.check}>
                    <Glyph name="check" size={11} color={color.dark} />
                  </View>
                ) : null}
              </View>
            </Pulse>
            <Text variant="bodyHeavy" size={13} color={m.state === 'next' ? color.accent : undefined} muted={m.state !== 'next'}>
              {m.label}
            </Text>
          </View>
        ))}
      </Stagger>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, paddingHorizontal: space.lg, paddingVertical: space.lg, gap: space.md },
  head: { gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { alignItems: 'center', gap: space.xs + 2 },
  tile: { width: 46, height: 46, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center', backgroundColor: veil.glass },
  next: { width: 54, height: 54, backgroundColor: color.accent },
  locked: { opacity: 0.45 },
  check: { position: 'absolute', right: -4, bottom: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: color.ok, alignItems: 'center', justifyContent: 'center' },
});
