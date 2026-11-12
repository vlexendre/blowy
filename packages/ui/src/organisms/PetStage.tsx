import type { CareAction, Shape } from '@blowy/domain';
import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { IconName } from '../assets/pets';
import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { DressedPet } from '../atoms/DressedPet';
import { Icon } from '../atoms/Icon';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { SpeechBubble } from '../molecules/SpeechBubble';
import { color, type GradientName, motion, speciesGradient } from '../theme';
import type { PetLook, TitleContent } from '../types';

export type PetReaction = CareAction;

export interface PetStageAction {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export interface PetStageProps {
  /** Le pet (`Pet` du contrat accepté tel quel : nom, espèce, tenue). */
  pet: PetLook;
  /** Titre ; défaut le nom du pet. */
  title?: TitleContent;
  /** Forme du pet (`Pet.shape`) : un pet qui boude passe sur le panneau lie-de-vin, couleurs éteintes. */
  shape?: Shape;
  /** Puce sous le nom (`shapeLabel[shape].title` : « en pleine forme »). */
  shapeLabel?: string;
  /** Ce que dit le pet (bulle sombre). */
  speech?: string;
  /** Bouton blanc en haut à droite (« garde-robe »). */
  action?: PetStageAction;
  /** Réaction à jouer après un soin : `feed` rebond + étoiles, `play` sauts + confettis, `nap` zzz, `cuddle` cœurs. */
  reaction?: PetReaction | null;
  /** À incrémenter pour rejouer la même réaction. */
  reactionKey?: number;
  /** Lettre des « zzz » de la sieste (décorative). Défaut « z ». */
  sleepGlyph?: string;
  /** Panneau ; défaut celui de l'espèce, lie-de-vin quand il boude. */
  gradient?: GradientName;
  /** Largeur du pet. Défaut 236. */
  petSize?: number;
  /** Hauteur du panneau. Défaut 318. */
  height?: number;
  onPetPress?: () => void;
  petLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const PARTICLE: Record<PetReaction, IconName | null> = { feed: 'etoiles', play: 'confettis', nap: null, cuddle: 'coeurs' };
const SPOTS = [
  { x: -0.32, y: 0.22, delay: 0 },
  { x: 0.3, y: 0.12, delay: 160 },
  { x: -0.05, y: 0.02, delay: 320 },
] as const;
/** Pet qui boude : `filter: saturate(.55) brightness(.8)` de V6-Boude. */
const SULK_FILTER = 'saturate(0.55) brightness(0.8)';

function Particle({ kind, index, trigger, area, glyph }: { kind: PetReaction; index: number; trigger: number; area: number; glyph: string }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  const spot = SPOTS[index] ?? SPOTS[0];
  useEffect(() => {
    if (trigger === 0) return;
    t.value = 0;
    t.value = withDelay(spot.delay, withTiming(1, { duration: kind === 'nap' ? 1600 : 1100, easing: Easing.out(Easing.quad) }));
  }, [trigger, kind, spot.delay, t]);
  const style = useAnimatedStyle(() => {
    const p = t.value;
    const fade = p <= 0 ? 0 : p < 0.2 ? p / 0.2 : p > 0.75 ? Math.max(0, (1 - p) / 0.25) : 1;
    if (reduced) return { opacity: fade };
    const drift = kind === 'nap' ? 26 * p : 0;
    return { opacity: fade, transform: [{ translateY: -110 * p }, { translateX: drift }, { scale: 0.6 + 0.6 * Math.min(1, p * 2) }] };
  });
  const icon = PARTICLE[kind];
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.particle, { left: area / 2 + spot.x * area - 18, top: spot.y * area * 1.1 + 40 }, style]}
    >
      {icon ? (
        <Icon name={icon} size={36} />
      ) : (
        <Text variant="h2" size={30 - index * 4} color={color.white}>
          {glyph}
        </Text>
      )}
    </Animated.View>
  );
}

/**
 * Scène de l'accueil (V6-Accueil, V6-Boude) : grand panneau, nom en Anton, puce de forme, bouton garde-robe,
 * bulle du pet, et le pet habillé en bas à droite qui réagit aux soins.
 */
export function PetStage({
  pet,
  title,
  shape,
  shapeLabel,
  speech,
  action,
  reaction,
  reactionKey = 0,
  sleepGlyph = 'z',
  gradient,
  petSize = 236,
  height = 318,
  onPetPress,
  petLabel,
  style,
}: PetStageProps) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const rot = useSharedValue(0);
  const trigger = reaction ? reactionKey + 1 : 0;
  const sulking = shape === 'boude';

  useEffect(() => {
    if (!reaction || reduced) return;
    const sp = motion.pop;
    if (reaction === 'feed') {
      sy.value = withSequence(withTiming(0.9, { duration: 120 }), withSpring(1.06, sp), withSpring(1, sp));
      sx.value = withSequence(withTiming(1.08, { duration: 120 }), withSpring(0.97, sp), withSpring(1, sp));
    } else if (reaction === 'play') {
      const hop = withSequence(
        withTiming(-46, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }),
      );
      y.value = withSequence(hop, withSequence(withTiming(-30, { duration: 170 }), withTiming(0, { duration: 170 })));
      rot.value = withSequence(withTiming(-6, { duration: 200 }), withTiming(6, { duration: 340 }), withSpring(0, sp));
    } else if (reaction === 'nap') {
      sy.value = withSequence(withTiming(0.94, { duration: 500 }), withDelay(1100, withTiming(1, { duration: 500 })));
      y.value = withSequence(withTiming(6, { duration: 500 }), withDelay(1100, withTiming(0, { duration: 500 })));
    } else {
      sx.value = withSequence(withTiming(1.07, { duration: 160 }), withSpring(1, sp));
      sy.value = withSequence(withTiming(0.95, { duration: 160 }), withSpring(1, sp));
      rot.value = withSequence(withTiming(-4, { duration: 120 }), withTiming(4, { duration: 160 }), withSpring(0, sp));
    }
  }, [reaction, reactionKey, reduced, rot, sx, sy, y]);

  const react = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }, { scaleX: sx.value }, { scaleY: sy.value }],
  }));

  const petNode = <DressedPet species={pet.species} outfit={pet.outfit} size={petSize} animated accessibilityLabel={petLabel ?? pet.name} />;
  const petHeight = Math.round(petSize / 0.9);

  return (
    <Panel gradient={gradient ?? (sulking ? 'wine' : speciesGradient[pet.species])} radius={32} padding="none" style={[styles.panel, { height }, style]}>
      <View style={[styles.pet, { width: petSize, height: petHeight }, sulking && styles.sulk]}>
        <Animated.View style={[styles.origin, react]}>
          {onPetPress ? (
            <Pressable onPress={onPetPress} accessibilityLabel={petLabel ?? pet.name} scaleTo={0.95} haptic="medium">
              {petNode}
            </Pressable>
          ) : (
            petNode
          )}
        </Animated.View>
        {reaction
          ? SPOTS.map((_, i) => <Particle key={`${reaction}-${i}`} kind={reaction} index={i} trigger={trigger} area={petSize} glyph={sleepGlyph} />)
          : null}
      </View>
      <View style={styles.head} pointerEvents="box-none">
        <View style={styles.name}>
          <Title text={title ?? pet.name.toUpperCase()} size={40} numberOfLines={1} />
          {shapeLabel ? <Chip label={shapeLabel} tone="dark" left={<View style={styles.dot} />} style={styles.chip} /> : null}
        </View>
        {action ? (
          <Button
            label={action.label}
            onPress={action.onPress}
            accessibilityLabel={action.accessibilityLabel}
            variant="white"
            size="sm"
            labelSize={14}
            block={false}
            style={styles.action}
          />
        ) : null}
      </View>
      {speech ? (
        <Animated.View key={speech} entering={reduced ? undefined : FadeIn.duration(motion.base)} style={styles.speech} pointerEvents="none">
          <SpeechBubble text={speech} tone="dark" tail="left" />
        </Animated.View>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: {},
  // `.panel` : rayon 32, padding 14 16, hauteur 318.
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingTop: 14, paddingHorizontal: 16 },
  name: { flexShrink: 1, minWidth: 0, alignItems: 'flex-start' },
  chip: { marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: color.white },
  action: { height: 38 },
  // `.bubble` : à 16 du bord, 112 du haut, 150 de large au plus.
  speech: { position: 'absolute', left: 16, top: 112, maxWidth: 168, zIndex: 2 },
  // `.sq` : à 6 du bord droit, 6 sous le bas du panneau.
  pet: { position: 'absolute', right: 6, bottom: -6 },
  origin: { transformOrigin: '50% 100%' },
  sulk: { filter: SULK_FILTER },
  particle: { position: 'absolute' },
});
