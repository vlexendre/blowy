import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import type { ArtName } from '../assets/pets';
import { type GradientName, space } from '../theme';
import type { TitleContent } from '../types';

export interface MemoriesPanelProps {
  /** « fait par nino & suzie ». */
  kicker: string;
  title: TitleContent;
  text: string;
  /** Les deux pets du lien (ton pet d'abord). */
  pets: readonly [Species, Species];
  gradient?: GradientName;
}

/** Duo illustré quand il existe pour la paire (Nino & Suzie, Gaston & Pia). */
function duoArt([a, b]: readonly [Species, Species]): ArtName | null {
  const pair = [a, b].sort().join('+');
  if (pair === 'nino+suzie') return 'duo_nino_suzie';
  if (pair === 'gaston+pia') return 'duo_gaston_pia';
  return null;
}

const DUO_WIDTH = 210;

/** En-tête des souvenirs d'un lien (V6-Souvenirs) : titre et les deux pets en autocollant qui débordent en bas à droite. */
export function MemoriesPanel({ kicker, title, text, pets, gradient = 'coral' }: MemoriesPanelProps) {
  const art = duoArt(pets);
  return (
    <Panel gradient={gradient} padding="none" overflow style={styles.panel}>
      <View pointerEvents="none" style={styles.duo}>
        {art ? (
          <PetImage art={art} size={DUO_WIDTH} outline />
        ) : (
          <View style={styles.pair}>
            <PetImage species={pets[0]} mood="joie" size={116} outline />
            <PetImage species={pets[1]} mood="amour" size={116} outline style={styles.second} />
          </View>
        )}
      </View>
      <Text variant="label" size={11} style={styles.kicker}>
        {kicker}
      </Text>
      <Title text={title} size={40} style={styles.title} />
      <Text variant="bodyBold" size={14} style={styles.text}>
        {text}
      </Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  // `.panel` : rayon 32, padding 16 18 ; le duo dépasse en bas à droite (right -10, bottom -6, rotation 6°).
  panel: { borderRadius: 32, paddingVertical: space.lg, paddingHorizontal: 18, minHeight: 190 },
  duo: { position: 'absolute', right: -10, bottom: -6, width: DUO_WIDTH, alignItems: 'flex-end', transform: [{ rotate: '6deg' }] },
  pair: { flexDirection: 'row', alignItems: 'flex-end' },
  second: { marginLeft: -22 },
  kicker: { letterSpacing: 1.32, opacity: 0.8 },
  title: { marginTop: space.xs },
  // S'arrête avant le duo (210 de large, collé à droite) : sur un iPhone de 402, il commence vers 178.
  text: { marginTop: 6, maxWidth: 150 },
});
