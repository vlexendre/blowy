import type { ItemSlot, Mood, Outfit, Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { type ComponentProps, memo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { type ItemPlacement, FIT_CANVAS, hasOutfit, outfitLayers } from '../assets/fit';
import { itemImage } from '../assets/items';
import { type PetPose, petImage, RENDER_RATIO } from '../assets/pets';
import { useLoop } from '../lib/motion';

export interface DressedPetProps {
  species: Species;
  /** Tenue portée (`Pet.outfit` / `PublicPet.outfit`). Vide ou absente : le pet seul. */
  outfit?: Outfit | null;
  /** Largeur en points de la toile du pet ; la hauteur suit le rapport 900×1000. */
  size: number;
  /** Humeur ou pose utilisée seulement quand aucun objet n'est porté (sinon la pose `debout` est imposée). */
  mood?: Mood;
  pose?: PetPose;
  /** Respiration douce au repos (coupée si « réduire les animations »). */
  animated?: boolean;
  /** Emplacements dessinés (défaut : les quatre). Le médaillon omet l'objet au sol. */
  slots?: readonly ItemSlot[];
  /** Décalage de l'animation (ms). */
  delay?: number;
  /** Objets dessinés mais invisibles (un objet en vol vers le pet, montré à l'atterrissage). */
  hidden?: readonly string[];
  /**
   * Style animé des objets de la tête et du visage (chapeau qui suit le corps avec un temps de retard, `PetActor`).
   * Pivot : le haut de la tête.
   */
  headStyle?: ComponentProps<typeof Animated.View>['style'];
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

function Layer({ p, k, hidden }: { p: ItemPlacement; k: number; hidden?: boolean }) {
  const src = itemImage(p.id);
  if (src === undefined) return null;
  const transform = p.rotate || p.scaleY !== 1 ? [{ rotate: `${p.rotate}deg` }, { scaleY: p.scaleY }] : undefined;
  return (
    <Image
      source={src}
      contentFit="fill"
      style={{
        position: 'absolute',
        left: p.left * k,
        top: p.top * k,
        width: p.width * k,
        height: p.height * k,
        transform,
        transformOrigin: `${p.originX * 100}% ${p.originY * 100}%`,
        opacity: hidden ? 0 : 1,
      }}
    />
  );
}

/**
 * Le pet en pied (pose `debout`) avec les objets de sa tenue posés dessus, d'après `assets/fit.json`.
 * Ailes, cape, sac à dos et serre-têtes passent derrière ; l'objet au sol se pose à droite, sur la même ligne.
 * Certains objets débordent légèrement de la toile (ailes, objet au sol) : le conteneur ne rogne pas.
 */
export const DressedPet = memo(function DressedPet({ species, outfit, size, mood, pose, animated = false, slots, delay = 0, hidden, headStyle, accessibilityLabel, style }: DressedPetProps) {
  const dressed = hasOutfit(outfit);
  const height = Math.round(size / RENDER_RATIO);
  const k = size / FIT_CANVAS.width;
  const t = useLoop(1300, animated, delay);
  const breathe = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 * t.value }, { scaleX: 1 - 0.02 * t.value }, { scaleY: 1 + 0.03 * t.value }],
  }));
  const layers = dressed ? outfitLayers(species, outfit, slots) : { back: [], front: [] };
  const base = petImage(species, dressed ? 'debout' : (pose ?? mood ?? 'debout'));
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height }, style]}
    >
      <Animated.View style={[styles.fill, styles.origin, breathe]}>
        {layers.back.map((p) => (
          <Layer key={p.id} p={p} k={k} hidden={hidden?.includes(p.id)} />
        ))}
        <Image source={base} contentFit="contain" style={StyleSheet.absoluteFill} />
        {layers.front
          .filter((p) => !headStyle || (p.slot !== 'head' && p.slot !== 'face'))
          .map((p) => (
            <Layer key={p.id} p={p} k={k} hidden={hidden?.includes(p.id)} />
          ))}
        {headStyle ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transformOrigin: `${HEAD_PIVOT.x * 100}% ${HEAD_PIVOT.y * 100}%` }, headStyle]}>
            {layers.front
              .filter((p) => p.slot === 'head' || p.slot === 'face')
              .map((p) => (
                <Layer key={p.id} p={p} k={k} hidden={hidden?.includes(p.id)} />
              ))}
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
});

/** Pivot des objets de la tête : le bas du visage (ils basculent autour du cou). */
const HEAD_PIVOT = { x: 0.5, y: 0.62 };

const styles = StyleSheet.create({
  fill: { flex: 1 },
  origin: { transformOrigin: '50% 100%' },
});
