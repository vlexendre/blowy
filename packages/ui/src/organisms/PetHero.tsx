import { StyleSheet, View } from 'react-native';

import type { PetPose } from '../assets/pets';
import { Chip } from '../atoms/Chip';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Sticker } from '../atoms/Sticker';
import { Title } from '../atoms/Title';
import { SpeechBubble } from '../molecules/SpeechBubble';
import { color, type GradientName, space, speciesGradient } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface PetHeroProps {
  pet: PetLook;
  /** « NINO, / PLUTÔT JOUEUR. » */
  title: TitleContent;
  /** Puce d'humeur en haut (« d'humeur joueuse »). */
  moodLabel?: string;
  /** Autocollant de forme (« joueur »). */
  formLabel?: string;
  /** Ce que dit le pet (bulle en haut à droite). */
  speech?: string;
  /** Dégradé ; défaut celui de l'espèce. */
  gradient?: GradientName;
  /** Pose du grand pet. Défaut `debout` (corps entier) ; une humeur donne un buste. */
  pose?: PetPose;
  /** Montre la forme d'évolution (`pet.form`) plutôt que la pose. */
  showForm?: boolean;
  onPetPress?: () => void;
  petLabel?: string;
}


/** Grand pet sur le panneau de son espèce, avec son nom en Anton. */
export function PetHero({ pet, title, moodLabel, formLabel, speech, gradient, pose = 'debout', showForm, onPetPress, petLabel }: PetHeroProps) {
  const image = (
    <PetImage species={pet.species} mood={pose} form={showForm ? pet.form : undefined} size={196} animation="breathe" accessibilityLabel={petLabel ?? pet.name} />
  );
  return (
    <Panel gradient={gradient ?? speciesGradient[pet.species]} padding="lg" style={styles.panel}>
      <View style={styles.text}>
        {moodLabel ? <Chip label={moodLabel} tone="dark" left={<View style={styles.moodDot} />} /> : null}
        <Title text={title} size={52} />
      </View>
      <View style={styles.pet} pointerEvents="box-none">
        {onPetPress ? (
          <Pressable onPress={onPetPress} accessibilityLabel={petLabel ?? pet.name} scaleTo={0.94} haptic="medium">
            {image}
          </Pressable>
        ) : (
          image
        )}
      </View>
      {speech ? <SpeechBubble text={speech} tail="left" rotate={3} style={styles.speech} /> : null}
      {formLabel ? <Sticker label={formLabel} tone="white" rotate={-6} style={styles.sticker} /> : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { minHeight: 236, justifyContent: 'flex-end' },
  text: { gap: space.md, width: '58%', zIndex: 1 },
  pet: { position: 'absolute', right: -space.md, bottom: -space.lg },
  speech: { position: 'absolute', top: space.lg, right: space.md, maxWidth: 160 },
  sticker: { position: 'absolute', bottom: space.lg, right: space.xl },
  moodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.accent },
});
