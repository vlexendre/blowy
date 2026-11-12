import { StyleSheet, View } from 'react-native';

import type { PetPose } from '../assets/pets';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Title } from '../atoms/Title';
import { MessageBubble } from '../molecules/MessageBubble';
import { color, type GradientName } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface OnboardingPanelProps {
  title: TitleContent;
  /** Corps du titre. Défaut 60. */
  titleSize?: number;
  gradient?: GradientName;
  pet: PetLook;
  /** Pose du grand pet en bas à droite. Défaut `surpris`. */
  pose?: PetPose;
  /** Ce que dit le pet, dans une bulle de chat avec son visage et son nom. */
  speech?: string;
}

/** Grand panneau d'inscription (V6-Compte) : titre, bulle du pet, pet incliné qui déborde en bas à droite. */
export function OnboardingPanel({ title, titleSize = 60, gradient = 'coral', pet, pose = 'surpris', speech }: OnboardingPanelProps) {
  return (
    <Panel gradient={gradient} radius={32} padding="none" style={styles.panel}>
      <View pointerEvents="none" style={styles.pet}>
        <PetImage species={pet.species} mood={pose} size={280} rotate={-7} animation="breathe" outline accessibilityLabel={pet.name} />
      </View>
      <Title text={title} size={titleSize} />
      {speech ? (
        <View style={styles.speech}>
          <MessageBubble
            message={{ author: 'my_pet', kind: 'text', body: speech, mediaUrl: null }}
            pet={pet}
            name={pet.name.toLowerCase()}
            nameColor={color.accent}
            avatarBg={color.accent}
          />
        </View>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { flexGrow: 1, minHeight: 440, paddingVertical: 24, paddingHorizontal: 22 },
  pet: { position: 'absolute', right: -70, bottom: -44 },
  speech: { position: 'absolute', left: 16, top: 316, width: 236 },
});
