import type { Species } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Button } from '../atoms/Button';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { countWords, Title } from '../atoms/Title';
import { hapticFor } from '../lib/haptics';
import { InkProvider } from '../lib/ink';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { Burst } from '../motion/Burst';
import { useReveal } from '../motion/reveal';
import { color, gradient, motion, radius, space } from '../theme';
import type { TitleContent } from '../types';

export interface QuizResultProps {
  kicker: string;
  title: TitleContent;
  text: string;
  species: Species;
  petLabel?: string;
}

const PET_LAND = 420;
const TITLE_STEP = 110;

/**
 * Fin du quiz (V6-Caractere) : panneau jaune « c'est nino. pour l'instant. » et le pet content.
 * Le panneau se pose, le pet bondit du bas et atterrit dans des étoiles, le verdict s'écrit mot à mot, puis la phrase.
 * Animations réduites : tout est là, en fondu.
 */
export function QuizResult({ kicker, title, text, species, petLabel }: QuizResultProps) {
  const reduced = useReducedMotion();
  const words = countWords(title);
  const shown = useReveal(words, { step: TITLE_STEP, delay: 220 });
  const [stars, setStars] = useState(0);
  const y = useSharedValue(reduced ? 0 : 260);
  const sy = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    y.value = withDelay(120, withSpring(0, springs.plush));
    sy.value = withDelay(120 + 260, withSequence(withTiming(0.9, { duration: 90, easing: ease.out }), withSpring(1, springs.plush)));
    const id = setTimeout(() => {
      setStars(1);
      hapticFor('success');
    }, PET_LAND);
    return () => clearTimeout(id);
  }, [reduced, y, sy]);
  const jump = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scaleY: sy.value }] }));
  const textDelay = 220 + words * TITLE_STEP;
  return (
    <Appear scale={0.94} distance={16} duration={motion.base} style={styles.panel}>
      <LinearGradient colors={gradient.accent} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.pet}>
        <Animated.View style={[styles.feet, jump]}>
          <PetImage species={species} mood="joie" size={230} rotate={-5} animation="breathe" outline accessibilityLabel={petLabel} />
        </Animated.View>
        <Burst kind="stars" trigger={stars} count={7} spread={120} size={26} style={styles.burst} />
      </View>
      <InkProvider value={color.dark}>
        <Text variant="label" size={11} style={styles.kicker}>
          {kicker}
        </Text>
        <Title text={title} size={50} style={styles.title} reveal={shown} />
        <Appear delay={reduced ? 0 : textDelay} distance={8}>
          <Text variant="bodyBold" size={16} style={styles.text}>
            {text}
          </Text>
        </Appear>
      </InkProvider>
    </Appear>
  );
}

export interface QuizResultActionsProps {
  redoLabel: string;
  onRedo: () => void;
  ctaLabel: string;
  onCta: () => void;
}

/** « refaire » (verre) + « continuer » (jaune, pleine largeur restante). */
export function QuizResultActions({ redoLabel, onRedo, ctaLabel, onCta }: QuizResultActionsProps) {
  return (
    <Appear delay={260} distance={10} style={[layout.row, styles.actions]}>
      <Button label={redoLabel} variant="ghost" block={false} onPress={onRedo} style={styles.redo} />
      <Button label={ctaLabel} iconRight="arrow" onPress={onCta} style={layout.grow} />
    </Appear>
  );
}

const styles = StyleSheet.create({
  panel: { flexGrow: 1, minHeight: 320, borderRadius: radius.xl - 4, overflow: 'hidden', paddingTop: 20, paddingHorizontal: 20, marginTop: 2 },
  pet: { position: 'absolute', right: -40, bottom: -36 },
  feet: { transformOrigin: '50% 90%' },
  burst: { position: 'absolute', left: 105, top: 70 },
  kicker: { letterSpacing: 1.32, opacity: 0.6 },
  title: { marginTop: space.sm },
  text: { marginTop: 10, maxWidth: 210, lineHeight: 21 },
  actions: { gap: 10 },
  redo: { alignSelf: 'auto' },
});
