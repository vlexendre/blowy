import type { Mood, Species } from '@blowy/domain';
import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Icon } from '../atoms/Icon';
import { Panel } from '../atoms/Panel';
import { type PetAnimation, PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import type { IconName } from '../assets/pets';
import { ease, fadeTo, springs, useLoop, useReducedMotion } from '../lib/motion';
import { useFirstTime } from '../motion/once';
import { type GradientName, motion, radius } from '../theme';
import type { TitleContent } from '../types';

export interface NudgeBannerProps {
  kicker: string;
  title: TitleContent;
  text: string;
  gradient?: GradientName;
  /** Icône 3D animée à gauche (flamme de la photo du jour). */
  icon?: IconName;
  /** Pet autocollant qui déborde à droite. */
  species: Species;
  mood?: Mood;
  animation?: PetAnimation;
  onPress: () => void;
  accessibilityLabel: string;
  /**
   * Clé du bandeau (ex. id de la demande) : à sa première apparition, il s'ouvre depuis le haut, puis le pet sort
   * du bord en rebondissant et fait signe. Sans clé : posé tel quel.
   */
  reveal?: string;
  style?: StyleProp<ViewStyle>;
}

/** Bandeau d'appel en tête de la liste des chats (photo du jour, rencontres) : icône, texte, pet qui déborde. */
export function NudgeBanner({ kicker, title, text, gradient = 'orange', icon, species, mood = 'joie', animation = 'none', onPress, accessibilityLabel, reveal, style }: NudgeBannerProps) {
  const open = useOpen(reveal);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} scaleTo={0.98} style={style}>
      <Animated.View style={[styles.open, open.panel]}>
      <Panel gradient={gradient} radius="lg" padding="none" overflow style={styles.panel}>
        {icon ? <Flick name={icon} /> : null}
        <Animated.View style={[styles.body, open.body]}>
          <Text variant="label" size={11} style={styles.kicker}>
            {kicker}
          </Text>
          <Title text={title} size={26} style={styles.title} />
          <Text variant="bodyBold" size={13} style={styles.text}>
            {text}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.pet, open.pet]}>
          <PetImage species={species} mood={mood} size={104} outline rotate={8} animation={animation} />
        </Animated.View>
      </Panel>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Ouverture du bandeau (vedette de la liste des chats) : il se déplie depuis le haut (ressort doux), le texte
 * monte, puis le pet jaillit du bas du bandeau et fait signe. Fondu seul si animations réduites.
 */
function useOpen(key: string | undefined) {
  const reduced = useReducedMotion();
  const first = useFirstTime(key ? `nudge:${key}` : undefined);
  const play = !!key && first;
  const unfold = useSharedValue(play ? 0 : 1);
  const fade = useSharedValue(play ? 0 : 1);
  const body = useSharedValue(play ? 0 : 1);
  const pet = useSharedValue(play ? 0 : 1);
  const wave = useSharedValue(0);
  useEffect(() => {
    if (!play) return;
    if (reduced) {
      unfold.value = 1;
      body.value = 1;
      pet.value = 1;
      fade.value = fadeTo(1, motion.fast);
      return;
    }
    fade.value = withTiming(1, { duration: motion.fast });
    unfold.value = withSpring(1, springs.soft);
    body.value = withDelay(110, withTiming(1, { duration: motion.base, easing: ease.out }));
    pet.value = withDelay(220, withSpring(1, springs.plush));
    const w = (to: number, d = 150) => withTiming(to, { duration: d, easing: ease.inOut });
    wave.value = withDelay(620, withSequence(w(-12), w(10), w(-8), w(5), withSpring(0, springs.pop)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return {
    panel: useAnimatedStyle(() => ({
      opacity: fade.value,
      transform: [{ translateY: (1 - unfold.value) * -10 }, { scaleY: 0.55 + 0.45 * unfold.value }, { scaleX: 0.96 + 0.04 * unfold.value }],
    })),
    body: useAnimatedStyle(() => ({ opacity: body.value, transform: [{ translateY: (1 - body.value) * 10 }] })),
    pet: useAnimatedStyle(() => ({
      opacity: Math.min(1, pet.value * 3),
      transform: [{ translateY: (1 - pet.value) * 34 }, { scale: 0.55 + 0.45 * pet.value }, { rotate: `${wave.value}deg` }],
    })),
  };
}

/** `.flick` des maquettes : la flamme oscille de -4° à 4° en grossissant légèrement. */
function Flick({ name }: { name: IconName }) {
  const reduced = useReducedMotion();
  const t = useLoop(800, !reduced);
  const animated = useAnimatedStyle(() => (reduced ? {} : { transform: [{ rotate: `${-4 + 8 * t.value}deg` }, { scale: 1 + 0.06 * t.value }] }));
  return (
    <Animated.View style={[styles.icon, animated]}>
      <Icon name={name} size={44} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 92, paddingVertical: 16, paddingHorizontal: 18, borderRadius: radius.lg },
  icon: { transformOrigin: '50% 90%' },
  open: { transformOrigin: '50% 0%' },
  body: { flex: 1, minWidth: 0 },
  kicker: { letterSpacing: 1.32, opacity: 0.7 },
  title: { marginTop: 3 },
  text: { marginTop: 2 },
  pet: { marginTop: -34, marginRight: -14, marginBottom: -30, marginLeft: -10, transformOrigin: '50% 85%' },
});
