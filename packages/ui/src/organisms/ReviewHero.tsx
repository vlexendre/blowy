import type { Outfit, Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';
import { Panel } from '../atoms/Panel';
import { Title } from '../atoms/Title';
import { PetActor } from '../motion/pets/PetActor';
import { color, type GradientName, space } from '../theme';
import type { TitleContent } from '../types';

export interface ReviewHeroProps {
  pet: { species: Species; outfit?: Outfit | null; name: string; id?: string };
  /** Puce (« Dimanche soir · semaine 46 »). */
  kicker: string;
  /** « TA SEMAINE / EN VRAI. » */
  title: TitleContent;
  gradient?: GradientName;
  onClose: () => void;
  closeLabel: string;
  /** Croix (écran ouvert depuis l'accueil) ou flèche retour. Défaut croix. */
  glyph?: 'close' | 'back';
}

const PET = 170;

/** Haut du bilan de la semaine (V6-GBilan) : le minimoa présente sa semaine, sur un panneau rose. */
export function ReviewHero({ pet, kicker, title, gradient = 'rose', onClose, closeLabel, glyph = 'close' }: ReviewHeroProps) {
  return (
    <Panel gradient={gradient} radius={32} padding="none" style={styles.panel}>
      <View style={styles.pet} pointerEvents="box-none">
        <PetActor species={pet.species} outfit={pet.outfit} size={PET} seed={pet.id ?? pet.name} sleepAfter={null} accessibilityLabel={pet.name} />
      </View>
      <View style={styles.top}>
        <Chip label={kicker} tone="dark" ink={color.white} style={styles.chip} />
        <IconButton label={closeLabel} glyph={glyph} variant="dark" onPress={onClose} />
      </View>
      <Title text={title} size={52} style={styles.title} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { minHeight: 214, paddingHorizontal: space.lg + 2, paddingTop: space.md + 2, paddingBottom: space.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2, gap: space.sm },
  chip: { flexShrink: 1, transform: [{ rotate: '-3deg' }], marginTop: space.sm },
  title: { marginTop: space.md, maxWidth: '68%', zIndex: 2 },
  pet: { position: 'absolute', right: -24, bottom: -28, zIndex: 1 },
});
