import type { Mood, Species } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { Icon } from '../atoms/Icon';
import { Panel } from '../atoms/Panel';
import { type PetAnimation, PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import type { IconName } from '../assets/pets';
import { useLoop } from '../lib/motion';
import { type GradientName, radius } from '../theme';
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
  style?: StyleProp<ViewStyle>;
}

/** Bandeau d'appel en tête de la liste des chats (photo du jour, rencontres) : icône, texte, pet qui déborde. */
export function NudgeBanner({ kicker, title, text, gradient = 'orange', icon, species, mood = 'joie', animation = 'none', onPress, accessibilityLabel, style }: NudgeBannerProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} scaleTo={0.98} style={style}>
      <Panel gradient={gradient} radius="lg" padding="none" overflow style={styles.panel}>
        {icon ? <Flick name={icon} /> : null}
        <View style={styles.body}>
          <Text variant="label" size={11} style={styles.kicker}>
            {kicker}
          </Text>
          <Title text={title} size={26} style={styles.title} />
          <Text variant="bodyBold" size={13} style={styles.text}>
            {text}
          </Text>
        </View>
        <PetImage species={species} mood={mood} size={104} outline rotate={8} animation={animation} style={styles.pet} />
      </Panel>
    </Pressable>
  );
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
  body: { flex: 1, minWidth: 0 },
  kicker: { letterSpacing: 1.32, opacity: 0.7 },
  title: { marginTop: 3 },
  text: { marginTop: 2 },
  pet: { marginTop: -34, marginRight: -14, marginBottom: -30, marginLeft: -10 },
});
