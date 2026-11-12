import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { Panel } from '../atoms/Panel';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { alpha, color } from '../theme';
import type { TitleContent } from '../types';
import { type EvolutionStep, EvolutionTimeline } from './EvolutionTimeline';

export interface EvolutionHeroProps {
  /** « IL CHANGE / AVEC TOI. » */
  title: TitleContent;
  species: Species;
  steps: readonly EvolutionStep[];
  onBack: () => void;
  backLabel: string;
  /** Puce en haut à droite (« 3 mois avec toi »). */
  age?: string;
}

/** Panneau violet de l'écran Évolution : retour, âge, titre et formes successives. */
export function EvolutionHero({ title, species, steps, onBack, backLabel, age }: EvolutionHeroProps) {
  return (
    <Panel gradient="violet" radius={32} padding="none" style={styles.panel}>
      <View style={layout.rowBetween}>
        <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} />
        {age ? (
          <View style={styles.age}>
            <Text variant="bodyHeavy" size={12} numberOfLines={1}>
              {age}
            </Text>
          </View>
        ) : null}
      </View>
      <Title text={title} size={50} style={styles.title} />
      <EvolutionTimeline species={species} steps={steps} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 18 },
  age: { height: 26, paddingHorizontal: 11, borderRadius: 999, justifyContent: 'center', backgroundColor: alpha(color.white, 0.16) },
  title: { marginTop: 8 },
});
