import type { Mood, PetForm, Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import {
  ART_RATIO,
  type ArtName,
  artImage,
  type CraftColour,
  craftImage,
  type PetPose,
  type PetTrait,
  petFormImage,
  petImage,
  petTraitImage,
  RENDER_RATIO,
  type Src,
} from '../assets/pets';
import { useLoop } from '../lib/motion';
import { color } from '../theme';

export type PetAnimation = 'none' | 'breathe' | 'bob';

export interface PetImageProps {
  species?: Species;
  /** Humeur du domaine (buste) ou pose : `debout` / `trois_quarts` / `cote` / `dos` (corps entier), `face`, `fantome`… Défaut `neutre`. */
  mood?: Mood | PetPose;
  /** Image de trait propre à l'espèce (suzie `douce`, gaston `pose` / `calme`, pia `bavard`) ; repli sur l'humeur. */
  trait?: PetTrait;
  /** Forme d'évolution de l'espèce : prioritaire sur l'humeur et le trait. */
  form?: PetForm;
  /** Illustration hors espèce (œuf, bébé, bande, duos). */
  art?: ArtName;
  /** Pet de l'écran de création, par couleur. */
  craft?: CraftColour;
  /** Source libre (prioritaire sur tout le reste). */
  source?: Src | { uri: string };
  /** Largeur en points ; la hauteur suit le rapport du rendu. */
  size: number;
  /** Animation au repos : `breathe` (écrasement doux) ou `bob` (flottement). Coupée si « réduire les animations ». */
  animation?: PetAnimation;
  /** Contour blanc façon autocollant découpé. */
  outline?: boolean;
  /** Inclinaison en degrés. */
  rotate?: number;
  /** Décalage de l'animation (ms) pour désynchroniser deux pets. */
  delay?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

function resolve(p: PetImageProps): { src: Src | { uri: string }; ratio: number } {
  if (p.source) return { src: p.source, ratio: RENDER_RATIO };
  if (p.art) return { src: artImage(p.art), ratio: ART_RATIO[p.art] };
  if (p.craft) return { src: craftImage(p.craft), ratio: RENDER_RATIO };
  const species = p.species ?? 'nino';
  if (p.form) return { src: petFormImage(species, p.form), ratio: RENDER_RATIO };
  const trait = p.trait ? petTraitImage(species, p.trait) : undefined;
  if (trait) return { src: trait, ratio: RENDER_RATIO };
  const pose = p.mood ?? 'neutre';
  return { src: petImage(species, pose), ratio: pose === 'face' ? 1 : RENDER_RATIO };
}

const OUTLINE_DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.7, 0.7],
  [-0.7, 0.7],
  [0.7, -0.7],
  [-0.7, -0.7],
] as const;

/**
 * Rendu détouré d'un pet. L'animation et la rotation sont portées par un conteneur externe,
 * l'image reste à l'intérieur (évite le rognage d'une ombre animée sur Chromium).
 */
export function PetImage(props: PetImageProps) {
  const { size, animation = 'none', outline, rotate = 0, delay = 0, accessibilityLabel, style } = props;
  const { src, ratio } = resolve(props);
  const height = Math.round(size / ratio);
  const t = useLoop(animation === 'bob' ? 2000 : 1300, animation !== 'none', delay);
  const animated = useAnimatedStyle(() => {
    if (animation === 'bob') return { transform: [{ translateY: -8 * t.value }] };
    if (animation === 'breathe') {
      return { transform: [{ translateY: -5 * t.value }, { scaleX: 1 - 0.025 * t.value }, { scaleY: 1 + 0.035 * t.value }] };
    }
    return {};
  });
  const o = Math.max(2, Math.round(size * 0.014));
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height, transform: rotate ? [{ rotate: `${rotate}deg` }] : undefined }, style]}
    >
      <Animated.View style={[styles.fill, styles.origin, animated]}>
        {outline
          ? OUTLINE_DIRS.map(([x, y]) => (
              <Image
                key={`${x}:${y}`}
                source={src}
                tintColor={color.white}
                contentFit="contain"
                style={[StyleSheet.absoluteFill, { transform: [{ translateX: x * o }, { translateY: y * o }] }]}
              />
            ))
          : null}
        <Image source={src} contentFit="contain" transition={120} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  origin: { transformOrigin: '50% 100%' },
});
