import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import type { PetPose } from '../assets/pets';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Title } from '../atoms/Title';
import { MessageBubble } from '../molecules/MessageBubble';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { Appear } from '../motion/Appear';
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

const PET_IN = 140;

/**
 * Grand panneau d'inscription (V6-Compte) : titre, bulle du pet, pet incliné qui déborde en bas à droite.
 * Le pet surgit du coin en bas à droite, se pose en rebondissant, puis sa bulle arrive. Animations réduites : fondu.
 */
export function OnboardingPanel({ title, titleSize = 60, gradient = 'coral', pet, pose = 'surpris', speech }: OnboardingPanelProps) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 0 : 1);
  const sy = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(PET_IN, withSpring(0, springs.plush));
    sy.value = withDelay(PET_IN + 280, withSequence(withTiming(0.92, { duration: 90, easing: ease.out }), withSpring(1, springs.plush)));
  }, [reduced, p, sy]);
  const popUp = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 150 }, { translateY: p.value * 190 }, { rotate: `${p.value * 18}deg` }, { scaleY: sy.value }] }));
  return (
    <Panel gradient={gradient} radius={32} padding="none" style={styles.panel}>
      <View pointerEvents="none" style={styles.pet}>
        <Animated.View style={[styles.feet, popUp]}>
          <PetImage species={pet.species} mood={pose} size={280} rotate={-7} animation="breathe" outline accessibilityLabel={pet.name} />
        </Animated.View>
      </View>
      <Title text={title} size={titleSize} />
      {speech ? (
        <Appear delay={reduced ? 0 : 620} distance={8} scale={0.92} style={styles.speech}>
          <MessageBubble
            message={{ author: 'my_pet', kind: 'text', body: speech, mediaUrl: null }}
            pet={pet}
            name={pet.name.toLowerCase()}
            nameColor={color.accent}
            avatarBg={color.accent}
          />
        </Appear>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { flexGrow: 1, minHeight: 440, paddingVertical: 24, paddingHorizontal: 22 },
  pet: { position: 'absolute', right: -70, bottom: -44 },
  feet: { transformOrigin: '50% 90%' },
  speech: { position: 'absolute', left: 16, top: 316, width: 236 },
});
