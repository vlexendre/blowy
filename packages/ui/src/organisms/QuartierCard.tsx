import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { color, radius, space } from '../theme';
import type { TitleContent } from '../types';

export interface QuartierCardProps {
  /** « Ton quartier ». */
  kicker: string;
  title: TitleContent;
  /** « 38 / 50 pour ouvrir Paris 11e » : le vrai compteur, venu du serveur. */
  counter: string;
  /** Avancement du compteur (0 à 1). */
  progress: number;
  text: string;
  actionLabel: string;
  onAction: () => void;
  species: Species;
  loading?: boolean;
}

/**
 * Rencontres vide, quartier pas encore ouvert (docs/VIRALITE.md, « Ouvre ton quartier ») : le compteur réel de la zone,
 * une phrase honnête, et inviter des gens du quartier. Le minimoa passe la tête à droite.
 */
export function QuartierCard({ kicker, title, counter, progress, text, actionLabel, onAction, species, loading }: QuartierCardProps) {
  return (
    <Panel gradient="violet" radius={radius.card} padding="none" overflow style={styles.panel}>
      <View style={styles.pet} pointerEvents="none">
        <PetImage species={species} mood="salut" size={96} outline rotate={-6} />
      </View>
      <Text variant="label" size={11} style={styles.kicker}>
        {kicker}
      </Text>
      <Title text={title} size={28} style={styles.title} />
      <View style={styles.meter}>
        <ProgressBar value={progress} color={color.accent} height={12} accessibilityLabel={counter} />
        <Text variant="bodyHeavy" size={15}>
          {counter}
        </Text>
      </View>
      <Text variant="body" size={15} style={styles.text}>
        {text}
      </Text>
      <Button label={actionLabel} variant="accent" onPress={onAction} loading={loading} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { padding: space.lg, gap: space.sm },
  pet: { position: 'absolute', right: -10, top: -6 },
  kicker: { opacity: 0.85, paddingRight: 90 },
  title: { paddingRight: 84 },
  meter: { gap: space.xs, marginTop: space.xs },
  text: { opacity: 0.9, marginBottom: space.xs },
});
