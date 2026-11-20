import type { TrophyFamily } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { Image, StyleSheet, View } from 'react-native';
import { trophyImage } from '../assets/trophees';
import { Card } from '../atoms/Card';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { space } from '../theme';

export interface TrophyCardProps {
  family: TrophyFamily;
  /** Nom de la famille (« Premier pas »). */
  title: string;
  /** Niveaux gagnés (0 à 3). */
  won: number;
  /** Ce qu'il reste à faire (« 4/10 bonjours pour l'argent »), ou ce qui est gagné. */
  goal: string;
  /** Avancement vers le prochain niveau, de 0 à 1. */
  progress: number;
}

const LOCKED = { opacity: 0.35 } as const;

/** Une famille de trophées (maquette V7 « Trophées ») : le dernier gagné en grand, les trois en petit, la barre. */
export function TrophyCard({ family, title, won, goal, progress }: TrophyCardProps) {
  const main = Math.max(0, Math.min(2, won - 1)) as 0 | 1 | 2;
  return (
    <Card padding="sm" accessibilityLabel={`${title}. ${goal}`}>
      <View style={styles.row}>
        <Image source={trophyImage(family, main)} style={[styles.big, won === 0 ? LOCKED : null]} accessibilityIgnoresInvertColors />
        <View style={styles.body}>
          <View style={styles.head}>
            <Text variant="bodyHeavy" style={styles.grow}>
              {title}
            </Text>
            {([0, 1, 2] as const).map((i) => (
              <Image key={i} source={trophyImage(family, i)} style={[styles.mini, i < won ? null : LOCKED]} />
            ))}
          </View>
          <Text variant="small" muted>
            {goal}
          </Text>
          <ProgressBar value={progress} height={8} color={color.accent} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  big: { width: 72, height: 72 },
  body: { flex: 1, gap: space.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  grow: { flex: 1 },
  mini: { width: 26, height: 26 },
});
