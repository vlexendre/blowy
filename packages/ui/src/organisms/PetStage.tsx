import type { Shape } from '@blowy/domain';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { Panel } from '../atoms/Panel';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { ease, fadeTo, useReducedMotion } from '../lib/motion';
import { SpeechBubble } from '../molecules/SpeechBubble';
import type { PetLure } from '../motion/pets/lure';
import { PetActor, type PetActorHandle, type PetActorReaction, type PetTouch } from '../motion/pets/PetActor';
import { alpha, color, type GradientName, motion, speciesGradient } from '../theme';
import type { PetLook, TitleContent } from '../types';

/** Réaction jouée par le pet : les quatre soins, plus `joy`, `no` (refus), `wave`, `surprise`. */
export type PetReaction = PetActorReaction;

export interface PetStageAction {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  /** Pastille jaune en coin du bouton (« 2 » objets nouveaux dans la garde-robe). */
  badge?: string;
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
  /** Toucher la puce de forme (« Il boude » : il dit dans sa bulle ce que ça change). */
  onShapePress?: () => void;
  /** Libellé lu de la puce touchable. */
  shapeA11y?: string;
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
  /** Soin porté vers le pet (`usePetLure`, partagé avec `CareBar`) : le pet le suit des yeux et ouvre la bouche quand il approche. */
  lure?: PetLure;
  /** Décor posé sur la tête du pet et qui le suit (la mèche de la série : `StreakFlame`). */
  crest?: ReactNode;
  /** Jauge vedette en bas à gauche du panneau (la sociabilité : `HeroMeter`). La bulle remonte un peu. */
  meter?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pet qui boude : `filter: saturate(.55) brightness(.8)` de V6-Boude, sur le web seulement.
 * Sur iPhone, `filter` ne sait pas désaturer, et `brightness` pose un rectangle gris opaque sur toute la toile
 * (le fond transparent du pet devient gris clair). On l'éteint donc par l'opacité : il se fond dans le panneau sombre.
 */
const SULK_STYLE = Platform.OS === 'web' ? { filter: 'saturate(0.55) brightness(0.8)' } : { opacity: 0.78 };

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
  onShapePress,
  shapeA11y,
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
  lure,
  crest,
  meter,
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
      <View ref={lure?.target} collapsable={false} style={[styles.pet, { width: petSize, height: Math.round(petSize / 0.9) }, sulking && styles.sulk]}>
        <PetActor
          ref={actor}
          species={pet.species}
          outfit={pet.outfit}
          size={petSize}
          seed={pet.id ?? pet.name}
          sulking={sulking}
          grabbable={grabbable}
          onGrabChange={setLifted}
          lure={lure}
          crest={crest}
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
          {shapeLabel ? (
            <Chip label={shapeLabel} tone="dark" left={<View style={styles.dot} />} onPress={onShapePress} accessibilityLabel={shapeA11y} style={styles.chip} />
          ) : null}
        </View>
        {action ? (
          <View>
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
            {action.badge ? (
              <View pointerEvents="none" style={styles.actionBadge}>
                <Text variant="bodyHeavy" size={11} color={color.dark}>
                  {action.badge}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      {speech ? (
        <View style={[styles.speech, meter ? styles.speechHigh : null]} pointerEvents="none">
          <SpeechBubble text={speech} tone="dark" tail="left" typing />
        </View>
      ) : null}
      {meter ? <View style={styles.meter}>{meter}</View> : null}
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
  actionBadge: {
    position: 'absolute',
    top: -5,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.accent,
    borderWidth: 2,
    borderColor: color.dark,
  },
  // `.bubble` : à 16 du bord, 112 du haut, 150 de large au plus.
  speech: { position: 'absolute', left: 16, top: 112, maxWidth: 168, zIndex: 2 },
  // Avec une jauge vedette en bas : la bulle remonte sous la puce de forme.
  speechHigh: { top: 98 },
  // V6-GAccueil : jauge dans un verre sombre, à 14 du bas et 16 du bord gauche.
  meter: { position: 'absolute', left: 16, bottom: 14, width: 168, zIndex: 2 },
  // `.sq` : à 6 du bord droit, 6 sous le bas du panneau.
  pet: { position: 'absolute', right: 6, bottom: -6 },
  sulk: SULK_STYLE,
});
