import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import type { PetPose } from '../assets/pets';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { MessageBubble } from '../molecules/MessageBubble';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { Appear } from '../motion/Appear';
import { PopIn } from '../motion/PopIn';
import { color, type GradientName, radius, space } from '../theme';
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
  /** Phrase sous le titre (à la place de la bulle). */
  text?: string;
  /** Petites étiquettes inclinées sous la phrase (« Ta vision », « Tes réponses »). */
  chips?: readonly string[];
  /** Panneau plus bas (écrans avec boutons dessous). */
  compact?: boolean;
}

const PET_IN = 140;

/**
 * Grand panneau d'inscription (V6-Compte) : titre, bulle du pet, pet incliné qui déborde en bas à droite.
 * Le pet surgit du coin en bas à droite, se pose en rebondissant, puis sa bulle arrive. Animations réduites : fondu.
 */
export function OnboardingPanel({ title, titleSize = 60, gradient = 'coral', pet, pose = 'surpris', speech, text, chips, compact }: OnboardingPanelProps) {
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
    <Panel gradient={gradient} radius={32} padding="none" style={[styles.panel, compact && styles.compact]}>
      <View pointerEvents="none" style={styles.pet}>
        <Animated.View style={[styles.feet, popUp]}>
          <PetImage species={pet.species} mood={pose} size={280} rotate={-7} animation="breathe" outline accessibilityLabel={pet.name} />
        </Animated.View>
      </View>
      <Title text={title} size={titleSize} />
      {text ? (
        <Appear delay={reduced ? 0 : 260} distance={8} style={styles.textBox}>
          <Text variant="bodyHeavy" size={17} style={styles.text}>
            {text}
          </Text>
        </Appear>
      ) : null}
      {chips?.length ? (
        <View style={styles.chips}>
          {chips.map((c, i) => (
            <PopIn key={c} delay={reduced ? 0 : 420 + i * 110} from={0.5}>
              <View style={[styles.chip, { transform: [{ rotate: `${i % 2 ? 2 : -3}deg` }] }]}>
                <Text variant="bodyHeavy" size={14} color={color.white}>
                  {c}
                </Text>
              </View>
            </PopIn>
          ))}
        </View>
      ) : null}
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
  compact: { minHeight: 380 },
  textBox: { marginTop: space.md, maxWidth: '82%' },
  text: { lineHeight: 23 },
  chips: { marginTop: space.lg, gap: space.sm, alignItems: 'flex-start' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: color.dark },
  feet: { transformOrigin: '50% 90%' },
  speech: { position: 'absolute', left: 16, top: 316, width: 236 },
});
