import type { Mood, Shape } from '@blowy/domain';
import { Image } from 'expo-image';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { type CareProp, PROP_RATIO, propImage } from '../assets/misc';
import type { BodyPose, PetPose } from '../assets/pets';
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

/** Un bouton sous la bulle : ce que le pet propose (« Voir qui »), ou « Le réveiller » quand il dort. */
export interface PetStageSpeechAction {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

/**
 * Le pet peut s'endormir au repos (`after`, de `petSleep` : jamais les premières 24 h ni la nuit). Endormi, l'écran le
 * dit : sa bulle (`speech`) et un bouton visible pour le réveiller (`wakeLabel`) ; le toucher le réveille aussi.
 */
export interface PetStageSleep {
  /** Délai sans toucher avant qu'il s'endorme (ms) ; `null` : jamais. */
  after: number | null;
  /** Sa bulle pendant qu'il dort (« Zzz… Je fais un somme. Réveille-moi ! »). */
  speech: string;
  /** Bouton sous la bulle (« Le réveiller »). */
  wakeLabel: string;
  wakeA11y?: string;
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
  /** Bouton sous la bulle : ce que propose le pet (la nuit, « Voir qui » : les présentations). */
  speechAction?: PetStageSpeechAction | null;
  /** Sommeil au repos, avec son réveil visible. Absent : il ne s'endort jamais. */
  sleep?: PetStageSleep | null;
  /** Bouton blanc en haut à droite (« garde-robe »). */
  action?: PetStageAction;
  /**
   * Réaction à jouer : `feed` (une fraise tombe, il croque), `play` (une balle rebondit, il saute après),
   * `nap` (la lumière baisse, des « z » montent), `cuddle` (cœurs), et `joy`, `no`, `wave`, `surprise`.
   */
  reaction?: PetReaction | null;
  /** À incrémenter pour rejouer la même réaction. */
  reactionKey?: number;
  /** Objet du soin joué (la nourriture, le jouet glissé jusqu'au pet) : tenu dans la pose `mange` / `joue`. */
  reactionItem?: CareProp | null;
  /** Pose de repos du pet (forme d'évolution en pied, `malade`, `danger`) ; défaut `neutre` (`boude` quand il boude). */
  mood?: Mood | PetPose | BodyPose;
  /**
   * Petit habitat, flou d'arrière-plan : tapis sous le pet, plante et lampe de part et d'autre, cadre au mur (la
   * dernière photo des souvenirs dedans, s'il y en a), veilleuse la nuit. Absent : rien (petits écrans).
   */
  habitat?: { photo?: string | null; night?: boolean } | null;
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
  /** En bas à gauche de la carte : la pastille des soins (`CareBar compact`, V6-GAccueil). */
  care?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pet qui boude : `filter: saturate(.55) brightness(.8)` de V6-Boude, sur le web seulement.
 * Sur iPhone, `filter` ne sait pas désaturer, et `brightness` pose un rectangle gris opaque sur toute la toile
 * (le fond transparent du pet devient gris clair). On l'éteint donc par l'opacité : il se fond dans le panneau sombre.
 */
const SULK_STYLE = Platform.OS === 'web' ? { filter: 'saturate(0.55) brightness(0.8)' } : { opacity: 0.78 };

/**
 * Scène de l'accueil (V6-Accueil, V6-Boude) : grand panneau, nom en capitales (police des titres), puce de forme, bouton garde-robe,
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
  speechAction,
  sleep,
  action,
  reaction,
  reactionKey = 0,
  reactionItem,
  mood,
  habitat,
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
  care,
  style,
}: PetStageProps) {
  const reduced = useReducedMotion();
  const actor = useRef<PetActorHandle>(null);
  const [lifted, setLifted] = useState(false);
  const [asleep, setAsleep] = useState(false);
  const dozing = asleep && !!sleep;
  const said = dozing ? sleep.speech : speech;
  const button: PetStageSpeechAction | null = dozing
    ? { label: sleep.wakeLabel, accessibilityLabel: sleep.wakeA11y, onPress: () => actor.current?.wake() }
    : (speechAction ?? null);
  const dim = useSharedValue(0);
  const sulking = shape === 'boude';

  // Chaque nouvelle réaction (même identique) rejoue la chorégraphie ; la sieste baisse la lumière.
  const played = useRef(reactionKey);
  useEffect(() => {
    if (!reaction || played.current === reactionKey) return;
    played.current = reactionKey;
    actor.current?.react(reaction, reactionItem);
    if (reaction === 'nap') {
      dim.value = reduced
        ? withSequence(fadeTo(0.4, motion.base), withDelay(2200, fadeTo(0, motion.base)))
        : withSequence(withTiming(0.46, { duration: 520, easing: ease.inOut }), withDelay(2000, withTiming(0, { duration: 650, easing: ease.inOut })));
    }
    // `reactionItem` accompagne la réaction : lu avec elle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {habitat ? <Habitat petSize={petSize} photo={habitat.photo ?? null} night={!!habitat.night} /> : null}
      <View ref={lure?.target} collapsable={false} style={[styles.pet, { width: petSize, height: Math.round(petSize / 0.9) }, sulking && styles.sulk]}>
        <PetActor
          ref={actor}
          species={pet.species}
          outfit={pet.outfit}
          mood={mood}
          size={petSize}
          seed={pet.id ?? pet.name}
          sulking={sulking}
          grabbable={grabbable}
          onGrabChange={setLifted}
          lure={lure}
          crest={crest}
          sleepAfter={sleep?.after ?? null}
          onSleepChange={setAsleep}
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
      {said || button ? (
        <View style={[styles.speech, meter || care ? styles.speechHigh : null]} pointerEvents="box-none">
          {said ? (
            <View pointerEvents="none">
              <SpeechBubble text={said} tone="dark" tail="left" typing />
            </View>
          ) : null}
          {button ? (
            <Button
              label={button.label}
              onPress={button.onPress}
              accessibilityLabel={button.accessibilityLabel}
              variant="accent"
              size="sm"
              labelSize={13}
              block={false}
              style={styles.speechAction}
            />
          ) : null}
        </View>
      ) : null}
      {meter ? <View style={styles.meter}>{meter}</View> : null}
      {care ? <View style={styles.care}>{care}</View> : null}
    </Panel>
  );
}

/** Une pièce de l'habitat : image floue (profondeur de champ), en retrait. */
function Decor({ name, width, style, blur = 2, opacity = 0.7 }: { name: CareProp; width: number; style: object; blur?: number; opacity?: number }) {
  return <Image source={propImage(name)} contentFit="contain" blurRadius={blur} style={[styles.decor, { width, height: width / PROP_RATIO[name], opacity }, style]} />;
}

/**
 * L'habitat de la scène, derrière le pet et discret : le tapis sous ses pieds, la plante à sa gauche, la lampe à sa
 * droite, le cadre au mur avec la dernière photo des souvenirs, la veilleuse allumée la nuit. Rien ne capte le toucher.
 */
function Habitat({ petSize, photo, night }: { petSize: number; photo: string | null; night: boolean }) {
  const frame = petSize * 0.2;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Decor name="cadre" width={frame} blur={1} opacity={0.55} style={{ right: petSize * 0.08, top: 58, transform: [{ rotate: '4deg' }] }} />
      {photo ? (
        <Image
          source={{ uri: photo }}
          contentFit="cover"
          blurRadius={2}
          style={[styles.decor, { right: petSize * 0.08 + frame * 0.22, top: 58 + frame * 0.22, width: frame * 0.56, height: frame * 0.56, opacity: 0.6, transform: [{ rotate: '4deg' }] }]}
        />
      ) : null}
      <Decor name="tapis" width={petSize * 0.86} blur={0} opacity={0.5} style={{ right: 6 + petSize * 0.07, bottom: -petSize * 0.04 }} />
      <Decor name="plante" width={petSize * 0.24} style={{ right: petSize * 0.86, bottom: 4 }} />
      <Decor name={night ? 'veilleuse' : 'lampe'} width={petSize * (night ? 0.16 : 0.2)} blur={night ? 0 : 2} opacity={night ? 0.95 : 0.6} style={{ right: 2, bottom: 6 }} />
      {night ? <View style={[styles.glow, { right: -petSize * 0.06, bottom: -petSize * 0.02, width: petSize * 0.36, height: petSize * 0.36, borderRadius: petSize }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {},
  decor: { position: 'absolute' },
  // Halo de la veilleuse : un disque jaune très transparent.
  glow: { position: 'absolute', backgroundColor: alpha(color.accent, 0.12) },
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
  // Bouton sous la bulle (« Voir qui », « Le réveiller ») : petit, aligné sur la queue de la bulle.
  speechAction: { alignSelf: 'flex-start', height: 34, marginTop: 8 },
  // V6-GAccueil : jauge dans un verre sombre, à 14 du bas et 16 du bord gauche.
  meter: { position: 'absolute', left: 16, bottom: 14, width: 168, zIndex: 2 },
  // `.sq` : à 6 du bord droit, 6 sous le bas du panneau.
  care: { position: 'absolute', left: 12, bottom: 12, zIndex: 3 },
  pet: { position: 'absolute', right: 6, bottom: -6 },
  sulk: SULK_STYLE,
});
