import type { Species } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { StyleSheet, View } from 'react-native';
import { PetBadge } from '../atoms/PetBadge';
import { Text } from '../atoms/Text';
import { alpha, radius, space } from '../theme';

export interface LeagueRowProps {
  rank: number;
  name: string;
  species: Species;
  /** Étincelles, déjà mises en forme (« 120 »). */
  sparks: string;
  podium: boolean;
  me: boolean;
  /** Zone de fin de semaine où tombe la ligne : montée (vert) ou descente (rouge). */
  zone?: 'up' | 'down' | null;
  accessibilityLabel?: string;
}

/** Une ligne de la ligue de la semaine (maquette V7 « Ligue ») : rang, minimoa, prénom, étincelles. */
export function LeagueRow({
  rank,
  name,
  species,
  sparks,
  podium,
  me,
  zone,
  accessibilityLabel,
}: LeagueRowProps) {
  return (
    <View style={[styles.row, me ? styles.me : null]} accessible accessibilityLabel={accessibilityLabel}>
      <Text
        variant="bodyHeavy"
        color={zone === 'up' || podium ? color.ok : zone === 'down' ? color.danger : color.mute}
        style={styles.rank}
      >
        {String(rank)}
      </Text>
      <PetBadge species={species} size={40} />
      <Text variant={me ? 'bodyHeavy' : 'body'} style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text variant="bodyBold" color={color.accent}>
        {sparks}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
  },
  // Ta ligne : fond jaune léger et bord jaune (V6-Ligue).
  me: { backgroundColor: alpha(color.accent, 0.12), borderWidth: 2, borderColor: color.accent },
  rank: { width: 28, textAlign: 'center' },
  medal: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1 },
});

/** Or, argent, bronze (V6-Ligue). */
const MEDAL = [color.accentSoft, color.silver, color.bronze] as const;

/** Ligne de séparation de la ligue (façon Duolingo) : « ↑ Zone de montée » en vert, « ↓ Zone de descente » en rouge. */
export function LeagueZoneLine({ label, kind }: { label: string; kind: 'up' | 'down' }) {
  const tint = kind === 'up' ? color.lime : color.danger;
  return (
    <View style={zone.row} accessibilityRole="text" accessibilityLabel={label}>
      <View style={[zone.line, { backgroundColor: alpha(tint, 0.5) }]} />
      <Text variant="bodyHeavy" size={13} color={tint}>
        {label}
      </Text>
      <View style={[zone.line, { backgroundColor: alpha(tint, 0.5) }]} />
    </View>
  );
}

const zone = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  line: { flex: 1, height: 2, borderRadius: 1 },
});
