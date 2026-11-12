import type { Shape } from '@blowy/domain';
import { useEffect, useRef, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { Panel } from '../atoms/Panel';
import { Title } from '../atoms/Title';
import { ease, fadeTo, useReducedMotion } from '../lib/motion';
import { SpeechBubble } from '../molecules/SpeechBubble';
import { PetActor, type PetActorHandle, type PetActorReaction, type PetTouch } from '../motion/pets/PetActor';
import { alpha, color, type GradientName, motion, speciesGradient } from '../theme';
import type { PetLook, TitleContent } from '../types';

/** Réaction jouée par le pet : les quatre soins, plus `joy`, `no` (refus), `wave`, `surprise`. */
export type PetReaction = PetActorReaction;

export interface PetStageAction {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export interface PetStageProps {
  /** Le pet (`Pet` du contrat accepté tel quel : nom, espèce, tenue). */
  pet: PetLook & { id?: string };
  /** Titre ; défaut le nom du pet. */
  title?: TitleContent;
  /** Forme du pet (`Pet.shape`) : un pet qui boude passe sur le panneau lie-de-vin, couleurs éteintes. */
  shape?: Shape;
  /** Puce sous le nom (`shapeLabel[shape].title` : « en pleine forme »). */
  shapeLabel?: string;
  /** Ce que dit le pet (bulle sombre) ; chaque nouvelle phrase s'écrit mot à mot. */
  speech?: string;
  /** Bouton blanc en haut à droite (« garde-robe »). */
  action?: PetStageAction;
  /**
   * Réaction à jouer : `feed` (une fraise tombe, il croque), `play` (une balle rebondit, il saute après),
   * `nap` (la lumière baisse, des « z » montent), `cuddle` (cœurs), et `joy`, `no`, `wave`, `surprise`.
   */
  reaction?: PetReaction | null;
  /** À incrémenter pour rejouer la même réaction. */
  reactionKey?: number;
  /** @deprecated Les « z » sont dessinés par `PetActor`. */
  sleepGlyph?: string;
  /** Panneau ; défaut celui de l'espèce, lie-de-vin quand il boude. */
  gradient?: GradientName;
  /** Largeur du pet. Défaut 236. */
  petSize?: number;
  /** Hauteur du panneau. Défaut 318. */
  height?: number;
  /** On peut attraper le pet et le lancer (il revient en rebondissant). Défaut vrai. */
  grabbable?: boolean;
  /** Tap sur le pet (après sa réaction). */
  onPetPress?: () => void;
  /** Tout geste sur le pet (tap, double tap, câlin, attrapé, lancé). */
  onPetTouch?: (touch: PetTouch) => void;
  petLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Pet qui boude : `filter: saturate(.55) brightness(.8)` de V6-Boude. */
const SULK_FILTER = 'saturate(0.55) brightness(0.8)';

/**
 * Scène de l'accueil (V6-Accueil, V6-Boude) : grand panneau, nom en Anton, puce de forme, bouton garde-robe,
 * bulle du pet (qui s'écrit), et le pet vivant (`PetActor`) en bas à droite qui réagit aux soins et au toucher.
 * Attrapé, le pet sort du panneau (il passe au premier plan le temps du geste).
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
  gradient,
  petSize = 236,
  height = 318,
  grabbable = true,
  onPetPress,
  onPetTouch,
  petLabel,
  style,
}: PetStageProps) {
  const reduced = useReducedMotion();
  const actor = useRef<PetActorHandle>(null);
  const [lifted, setLifted] = useState(false);
  const dim = useSharedValue(0);
  const sulking = shape === 'boude';

  // Chaque nouvelle réaction (même identique) rejoue la chorégraphie ; la sieste baisse la lumière.
  const played = useRef(reactionKey);
  useEffect(() => {
    if (!reaction || played.current === reactionKey) return;
    played.current = reactionKey;
    actor.current?.react(reaction);
    if (reaction === 'nap') {
      dim.value = reduced
        ? withSequence(fadeTo(0.4, motion.base), withDelay(2200, fadeTo(0, motion.base)))
        : withSequence(withTiming(0.46, { duration: 520, easing: ease.inOut }), withDelay(2000, withTiming(0, { duration: 650, easing: ease.inOut })));
    }
  }, [reaction, reactionKey, reduced, dim]);
  const night = useAnimatedStyle(() => ({ opacity: dim.value }));

  return (
    <Panel
      gradient={gradient ?? (sulking ? 'wine' : speciesGradient[pet.species])}
      radius={32}
      padding="none"
      overflow={lifted}
      style={[styles.panel, { height }, lifted && styles.lifted, style]}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.night, night]} />
      <View style={[styles.pet, { width: petSize, height: Math.round(petSize / 0.9) }, sulking && styles.sulk]}>
        <PetActor
          ref={actor}
          species={pet.species}
          outfit={pet.outfit}
          size={petSize}
          seed={pet.id ?? pet.name}
          sulking={sulking}
          grabbable={grabbable}
          onGrabChange={setLifted}
          onTouch={(t) => {
            onPetTouch?.(t);
            if (t === 'tap') onPetPress?.();
          }}
          accessibilityLabel={petLabel ?? pet.name}
        />
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
        <View style={styles.speech} pointerEvents="none">
          <SpeechBubble text={speech} tone="dark" tail="left" typing />
        </View>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: {},
  // Pet attrapé : le panneau passe devant ses voisins et ne le rogne plus.
  lifted: { zIndex: 10, elevation: 10 },
  night: { borderRadius: 32, backgroundColor: alpha(color.night, 1) },
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
  sulk: { filter: SULK_FILTER },
});
