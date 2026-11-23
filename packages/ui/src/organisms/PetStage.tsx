import type { Mood } from '@blowy/domain';
import { Image } from 'expo-image';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { type CareProp, PROP_RATIO, propImage } from '../assets/misc';
import type { BodyPose, PetPose } from '../assets/pets';
import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { Panel } from '../atoms/Panel';
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
}

/**
 * Le pet peut s'endormir au repos (`after`, de `petSleep` : jamais les premières 24 h ni la nuit). Endormi, l'écran le
 * dit : à la place des soins, un bouton blanc « Le réveiller » (`wakeLabel`) ; le toucher le réveille aussi.
 * `onSleepChange` prévient l'écran (puce d'humeur, bulle « Zzz… » hors du panneau).
 */
export interface PetStageSleep {
  /** Délai sans toucher avant qu'il s'endorme (ms) ; `null` : jamais. */
  after: number | null;
  /** Bouton à la place des soins (« Le réveiller »). */
  wakeLabel: string;
  wakeA11y?: string;
  onSleepChange?: (asleep: boolean) => void;
}

export interface PetStageProps {
  /** Le pet (`Pet` du contrat accepté tel quel : nom, espèce, tenue). */
  pet: PetLook & { id?: string };
  /** Titre ; défaut le nom du pet. */
  title?: TitleContent;
  /** Taille de maquette du nom (rendue × 0,74, `displaySize`). Défaut 40. */
  titleSize?: number;
  /** Puce d'humeur sous le nom (« En pleine forme », « Fait la sieste »), inclinée, sur fond sombre. */
  moodLabel?: string;
  /** Ce que dit le pet (bulle sombre dans le panneau) ; chaque nouvelle phrase s'écrit mot à mot. */
  speech?: string;
  /** Sommeil au repos, avec son réveil visible. Absent : il ne s'endort jamais. */
  sleep?: PetStageSleep | null;
  /** Bouton blanc en haut à droite (« Garde-robe »), 44 pt, sans pastille. */
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
  /** Pose de repos du pet (forme d'évolution en pied) ; défaut `neutre`. */
  mood?: Mood | PetPose | BodyPose;
  /**
   * Petit habitat, flou d'arrière-plan : tapis sous le pet, plante et lampe de part et d'autre, cadre au mur, veilleuse la nuit. Absent : rien (petits écrans).
   */
  habitat?: { night?: boolean } | null;
  /** Panneau ; défaut celui de l'espèce. */
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
  /** En bas à gauche du panneau : la pastille des soins (`CareBar compact`, V6-GAccueil `.soins`). Cachée pendant qu'il dort. */
  care?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Panneau du minimoa (V6-GAccueil `.panneau`) : nom en capitales (police des titres), puce d'humeur inclinée, bouton
 * blanc « Garde-robe », le pet vivant (`PetActor`) en bas à droite qui réagit aux soins et au toucher, les soins en bas
 * à gauche. Aucun jaune. Endormi : « Le réveiller » (blanc) à la place des soins. Attrapé, le pet sort du panneau (il
 * passe au premier plan le temps du geste).
 */
export function PetStage({
  pet,
  title,
  titleSize = 40,
  moodLabel,
  speech,
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
  care,
  style,
}: PetStageProps) {
  const reduced = useReducedMotion();
  const actor = useRef<PetActorHandle>(null);
  const [lifted, setLifted] = useState(false);
  const [asleep, setAsleep] = useState(false);
  const dozing = asleep && !!sleep;
  const dim = useSharedValue(0);
  const onSleep = sleep?.onSleepChange;
  const sleepChange = (on: boolean) => {
    setAsleep(on);
    onSleep?.(on);
  };

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
    <View style={[{ height }, lifted && styles.lifted, style]}>
    <Panel
      gradient={gradient ?? speciesGradient[pet.species]}
      radius={32}
      padding="none"
      overflow={lifted}
      style={styles.fill}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.night, night]} />
      {habitat ? <Habitat petSize={petSize} night={!!habitat.night} /> : null}
      <View style={styles.pet} pointerEvents="box-none">
      <View ref={lure?.target} collapsable={false} style={{ width: petSize, height: Math.round(petSize / 0.9) }}>
        <PetActor
          ref={actor}
          species={pet.species}
          outfit={pet.outfit}
          mood={mood}
          size={petSize}
          seed={pet.id ?? pet.name}
          grabbable={grabbable}
          onGrabChange={setLifted}
          lure={lure}
          sleepAfter={sleep?.after ?? null}
          onSleepChange={sleepChange}
          onTouch={(t) => {
            onPetTouch?.(t);
            if (t === 'tap') onPetPress?.();
          }}
          accessibilityLabel={petLabel ?? pet.name}
        />
      </View>
      </View>
      <View style={styles.head} pointerEvents="box-none">
        <View style={styles.name}>
          <Title text={title ?? pet.name.toUpperCase()} size={titleSize} numberOfLines={1} />
          {moodLabel ? (
            <Chip label={moodLabel} tone="dark" left={<View style={styles.dot} />} style={styles.chip} />
          ) : null}
        </View>
        {action ? (
          <Button
            label={action.label}
            onPress={action.onPress}
            accessibilityLabel={action.accessibilityLabel}
            variant="white"
            size="sm"
            labelSize={15}
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
      {dozing ? (
        <View style={styles.care}>
          <Button
            label={sleep.wakeLabel}
            onPress={() => actor.current?.wake()}
            accessibilityLabel={sleep.wakeA11y}
            variant="white"
            size="sm"
            labelSize={17}
            block={false}
            style={styles.wake}
          />
        </View>
      ) : care ? (
        <View style={styles.care} pointerEvents="box-none">
          {care}
        </View>
      ) : null}
    </Panel>
    </View>
  );
}

/** Une pièce de l'habitat : image floue (profondeur de champ), en retrait. */
function Decor({ name, width, style, blur = 2, opacity = 0.7 }: { name: CareProp; width: number; style: object; blur?: number; opacity?: number }) {
  return <Image source={propImage(name)} contentFit="contain" blurRadius={blur} style={[styles.decor, { width, height: width / PROP_RATIO[name], opacity }, style]} />;
}

/**
 * L'habitat de la scène, derrière le pet et discret : le tapis sous ses pieds, la plante à sa gauche, la lampe à sa
 * droite, le cadre au mur, la veilleuse allumée la nuit. Rien ne capte le toucher.
 */
function Habitat({ petSize, night }: { petSize: number; night: boolean }) {
  const frame = petSize * 0.2;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Decor name="cadre" width={frame} blur={1} opacity={0.55} style={{ right: petSize * 0.08, top: 58, transform: [{ rotate: '4deg' }] }} />
      <Decor name="tapis" width={petSize * 0.86} blur={0} opacity={0.5} style={{ right: 6 + petSize * 0.07, bottom: -petSize * 0.04 }} />
      <Decor name="plante" width={petSize * 0.24} style={{ right: petSize * 0.86, bottom: 4 }} />
      <Decor name={night ? 'veilleuse' : 'lampe'} width={petSize * (night ? 0.16 : 0.2)} blur={night ? 0 : 2} opacity={night ? 0.95 : 0.6} style={{ right: 2, bottom: 6 }} />
      {night ? <View style={[styles.glow, { right: -petSize * 0.06, bottom: -petSize * 0.02, width: petSize * 0.36, height: petSize * 0.36, borderRadius: petSize }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  decor: { position: 'absolute' },
  // Halo de la veilleuse : un disque jaune très transparent.
  glow: { position: 'absolute', backgroundColor: alpha(color.accent, 0.12) },
  // Pet attrapé : le panneau passe devant ses voisins et ne le rogne plus.
  lifted: { zIndex: 10, elevation: 10 },
  night: { borderRadius: 32, backgroundColor: alpha(color.night, 1) },
  // `.panneau` : rayon 32, padding 14 16.
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingTop: 14, paddingLeft: 16, paddingRight: 14 },
  name: { flexShrink: 1, minWidth: 0, alignItems: 'flex-start' },
  // `.humeur` : inclinée de −3°, fond sombre opaque (jamais translucide sur un minimoa).
  chip: { marginTop: 6, transform: [{ rotate: '-3deg' }] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.white },
  // `.garde` : 44 pt.
  action: { height: 44, paddingHorizontal: 18 },
  speech: { position: 'absolute', left: 16, top: 96, maxWidth: 168, zIndex: 2 },
  // `.soins` / `.reveil` : à 12 du bord gauche et du bas.
  care: { position: 'absolute', left: 12, bottom: 12, zIndex: 3 },
  wake: { height: 44, paddingHorizontal: 20 },
  // `.moa` : à −6 du bord droit, −12 sous le bas du panneau.
  pet: { position: 'absolute', right: -6, bottom: -12 },
});
