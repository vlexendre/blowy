import { LEAGUE_TIERS, type LeagueTier } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { Image, StyleSheet, View } from 'react-native';
import { leagueImage } from '../assets/ligues';
import { Card } from '../atoms/Card';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { PopIn } from '../motion/PopIn';
import { space } from '../theme';

export interface LeagueHeaderProps {
  tier: LeagueTier;
  /** Nom de la ligue (« Ligue Pompon »). */
  title: string;
  /** Ce qu'il faut pour monter (« Encore 18 étincelles cette semaine pour Houppette »), ou le sommet atteint. */
  goal: string;
  /** Avancement vers la ligue suivante, de 0 à 1 (1 : déjà Étoile). */
  progress: number;
  tierLabels: Record<LeagueTier, string>;
}

/** Les cinq ligues en rangée (la tienne en grand, les autres estompées), son nom et l'objectif de la semaine. */
export function LeagueHeader({ tier, title, goal, progress, tierLabels }: LeagueHeaderProps) {
  const mine = LEAGUE_TIERS.indexOf(tier);
  return (
    <Card padding="md">
      <View style={styles.row}>
        {LEAGUE_TIERS.map((t, i) => (
          <View key={t} style={styles.cell} accessible accessibilityLabel={tierLabels[t]}>
            {t === tier ? (
              <PopIn from={0.5}>
                <Image source={leagueImage(t)} style={styles.big} />
              </PopIn>
            ) : (
              <Image source={leagueImage(t)} style={[styles.small, i > mine ? styles.locked : null]} />
            )}
          </View>
        ))}
      </View>
      <Text variant="h3" center style={styles.title}>
        {title}
      </Text>
      <Text variant="small" muted center>
        {goal}
      </Text>
      <View style={styles.bar}>
        <ProgressBar value={progress} height={8} color={color.accent} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cell: { flex: 1, alignItems: 'center' },
  big: { width: 76, height: 76 },
  small: { width: 44, height: 44 },
  locked: { opacity: 0.35 },
  title: { marginTop: space.sm },
  bar: { marginTop: space.sm },
});
