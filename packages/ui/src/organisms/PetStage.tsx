import type { CareAction, Shape } from '@blowy/domain';
import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { IconName } from '../assets/pets';
import { DressedPet } from '../atoms/DressedPet';
import { Icon } from '../atoms/Icon';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Sticker, type StickerTone } from '../atoms/Sticker';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { SpeechBubble } from '../molecules/SpeechBubble';
import { layout } from '../lib/styles';
import { color, type GradientName, motion, radius, space, speciesGradient, veil } from '../theme';
import type { PetLook, TitleContent } from '../types';

export type PetReaction = CareAction;

export interface PetStageProps {
  /** Le pet (`Pet` du contrat accepté tel quel : nom, espèce, tenue). */
  pet: PetLook;
  /** Titre ; défaut le nom du pet. */
  title?: TitleContent;
  /** Forme du pet (`Pet.shape`) : teinte de l'autocollant. */
  shape?: Shape;
  /** Texte de l'autocollant (`shapeLabel[shape].title` : « en pleine forme »). */
  shapeLabel?: string;
  /** Ce que dit le pet (bulle). */
  speech?: string;
  /** Réaction à jouer après un soin : `feed` rebond + étoiles, `play` sauts + confettis, `nap` zzz, `cuddle` cœurs. */
  reaction?: PetReaction | null;
  /** À incrémenter pour rejouer la même réaction. */
  reactionKey?: number;
  /** Lettre des « zzz » de la sieste (décorative). Défaut « z ». */
  sleepGlyph?: string;
  gradient?: GradientName;
  /** Largeur du pet. Défaut 240. */
  petSize?: number;
  onPetPress?: () => void;
  petLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const SHAPE_TONE: Record<Shape, StickerTone> = { en_forme: 'accent', bof: 'white', boude: 'coral' };
const PARTICLE: Record<PetReaction, IconName | null> = { feed: 'etoiles', play: 'confettis', nap: null, cuddle: 'coeurs' };
const SPOTS = [
  { x: -0.32, y: 0.22, delay: 0 },
  { x: 0.3, y: 0.12, delay: 160 },
  { x: -0.05, y: 0.02, delay: 320 },
] as const;

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

/** Héros de l'accueil : le pet habillé en grand sur le panneau de son espèce, son nom, sa forme, et ses réactions aux soins. */
export function PetStage({
  pet,
  title,
  shape,
  shapeLabel,
  speech,
  reaction,
  reactionKey = 0,
  sleepGlyph = 'z',
  gradient,
  petSize = 240,
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

  useEffect(() => {
    if (!reaction || reduced) return;
    const sp = motion.pop;
    if (reaction === 'feed') {
      sy.value = withSequence(withTiming(0.9, { duration: 120 }), withSpring(1.06, sp), withSpring(1, sp));
      sx.value = withSequence(withTiming(1.08, { duration: 120 }), withSpring(0.97, sp), withSpring(1, sp));
    } else if (reaction === 'play') {
      const hop = withSequence(withTiming(-46, { duration: 200, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }));
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

  return (
    <Panel gradient={gradient ?? speciesGradient[pet.species]} padding="lg" style={[styles.panel, style]}>
      <View style={[layout.rowBetween, styles.head]}>
        <Title text={title ?? pet.name} size={48} numberOfLines={1} style={layout.shrink} />
        {shapeLabel ? <Sticker label={shapeLabel} tone={shape ? SHAPE_TONE[shape] : 'white'} rotate={4} /> : null}
      </View>
      {speech ? <SpeechBubble text={speech} tail="left" rotate={-2} style={styles.speech} /> : null}
      <View style={[styles.stage, { height: Math.round(petSize / 0.9) }]}>
        <View style={[styles.ground, { width: petSize * 0.62, left: (petSize * 0.38) / 2 }]} />
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
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: 'center', paddingBottom: 0 },
  head: { alignSelf: 'stretch', gap: space.md, zIndex: 2 },
  speech: { alignSelf: 'flex-end', maxWidth: 200, marginTop: space.sm, marginBottom: -space.xl, zIndex: 2 },
  stage: { alignSelf: 'center', justifyContent: 'flex-end' },
  ground: { position: 'absolute', bottom: 8, height: 22, borderRadius: radius.pill, backgroundColor: veil.darkGlass },
  origin: { transformOrigin: '50% 100%' },
  particle: { position: 'absolute' },
});
