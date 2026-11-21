import { LEAGUE_TIERS, type LeagueTier } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { Image, StyleSheet, View } from 'react-native';
import { leagueImage } from '../assets/ligues';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
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
    <View>
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
      <Title text={title} size={38} center style={styles.title} />
      <Text size={15} muted center>
        {goal}
      </Text>
      <View style={styles.bar}>
        <ProgressBar value={progress} height={8} color={color.accent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cell: { flex: 1, alignItems: 'center' },
  // V6-Ligue : la tienne 84, les autres 48, celles d'après estompées.
  big: { width: 84, height: 84 },
  small: { width: 48, height: 48 },
  locked: { opacity: 0.35 },
  title: { marginTop: 6 },
  bar: { marginTop: 10, marginHorizontal: 24 },
});
