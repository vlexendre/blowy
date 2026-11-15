import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { Appear } from '../motion/Appear';
import { PopIn } from '../motion/PopIn';
import { color, radius, space } from '../theme';
import type { TitleContent } from '../types';

export interface VisionHeroProps {
  /** « TA VISION, / POUR L’INSTANT. » */
  title: TitleContent;
  /** Petites étiquettes (« 12 situations », « 2 minutes »). */
  chips: readonly string[];
  species: Species;
  petLabel?: string;
}

/** En-tête du résultat du test (V6-GTaVision) : panneau violet, titre, étiquettes, le minimoa qui passe la tête. */
export function VisionHero({ title, chips, species, petLabel }: VisionHeroProps) {
  return (
    <Panel gradient="violet" radius={30} padding="none" style={styles.panel}>
      <Title text={title} size={40} style={styles.title} />
      <View style={styles.chips}>
        {chips.map((c, i) => (
          <PopIn key={c} delay={260 + i * 110} from={0.5}>
            <View style={[styles.chip, { transform: [{ rotate: `${i % 2 ? 2 : -3}deg` }] }]}>
              <Text variant="bodyHeavy" size={14} color={color.white}>
                {c}
              </Text>
            </View>
          </PopIn>
        ))}
      </View>
      <Appear from="right" distance={50} delay={380} pointerEvents="none" style={styles.pet}>
        <PetImage species={species} mood="smug" size={128} rotate={-6} animation="breathe" accessibilityLabel={petLabel} />
      </Appear>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { minHeight: 168, paddingVertical: 20, paddingHorizontal: 20, overflow: 'hidden' },
  title: { maxWidth: '86%' },
  chips: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: color.dark },
  pet: { position: 'absolute', right: -22, bottom: -34 },
});
