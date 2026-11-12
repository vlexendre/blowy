import { SPECIES, type Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { type PetPose, petImage, RENDER_RATIO } from '../assets/pets';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { SpeechBubble } from '../molecules/SpeechBubble';
import { hapticFor } from '../lib/haptics';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { hitSlopFor, layout } from '../lib/styles';
import { PopIn } from '../motion/PopIn';
import { alpha, color, craft, motion, radius, shadow, space } from '../theme';

export interface SpeciesPickerProps {
  value: Species;
  onChange: (species: Species) => void;
  species?: readonly Species[];
  /** Nom lu de chaque espèce (accessibilité). */
  names: Record<Species, string>;
  /** Ce que dit le pet choisi (« salut, moi c'est nino 👋 »). */
  speech?: string;
  /** Mot mis en couleur dans la bulle (le nom). */
  speechHighlight?: string;
  /** Autocollant (« exemplaire unique »). */
  badge?: string;
  /** Pose du grand aperçu. Défaut `debout` (corps entier). */
  pose?: PetPose;
  /** Le nom tapé : à chaque changement, le pet hoche la tête (il approuve). */
  nodKey?: string;
}

const SWATCH = 48;
const STAGE = 300;
const PET = 300;
const PET_H = Math.round(PET / RENDER_RATIO);
/** Le grand pet déborde de 18 pt sous la scène. */
const PET_DROP = 18;
/** Centre de la boîte du grand pet et centre des pastilles, depuis le haut de la scène. */
const PET_CY = STAGE + PET_DROP - PET_H / 2;
const SWATCH_CY = STAGE + 30 + SWATCH / 2;
/** Échelle du pet quand il est « dans » sa pastille. */
const TINY = SWATCH / PET + 0.02;
const JUMP = 480;

/** Curieux qui passent la tête par les bords de la scène : côté (rotation de l'image), position le long du bord, penché vers le centre. */
const PEEK = 84;
const PEEK_H = Math.round(PEEK / RENDER_RATIO);
/** Part du buste visible quand il regarde (le haut de l'image est vide sur 17 %). */
const PEEK_SHOWN = 0.62;
const PEEKERS = [
  { edge: 'left', along: 0.66, base: 90, lean: -16 },
  { edge: 'top', along: 0.8, base: 180, lean: 18 },
  { edge: 'right', along: 0.5, base: -90, lean: 16 },
] as const;

/**
 * Choix du pet à la création (V6-Craft) : grand aperçu sur sa couleur + une pastille par espèce.
 * Choisir une espèce : le pet bondit de sa pastille au centre de la scène et s'y pose en s'écrasant, l'ancien
 * rentre dans la sienne, le fond change de couleur en fondu, et les trois autres passent la tête par les bords pour
 * regarder. Taper son nom (`nodKey`) le fait hocher la tête. Animations réduites : fondus seulement.
 */
export function SpeciesPicker({ value, onChange, species = SPECIES, names, speech, speechHighlight, badge, pose = 'debout', nodKey }: SpeciesPickerProps) {
  const reduced = useReducedMotion();
  const look = craft[value];
  const [width, setWidth] = useState(0);
  const [prev, setPrev] = useState<Species | null>(null);
  const [peekKey, setPeekKey] = useState(0);
  const last = useRef(value);
  const lastNod = useRef(nodKey);
  const clearPrev = useRef<ReturnType<typeof setTimeout> | null>(null);
  const landTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Grand pet : saut (x, y, échelle), écrasement à l'arrivée, hochement.
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const s = useSharedValue(1);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const rot = useSharedValue(0);
  const o = useSharedValue(1);
  // Ancien pet qui rentre dans sa pastille ; fond qui change de couleur.
  const out = useSharedValue(0);
  const outX = useSharedValue(0);
  const bg = useSharedValue(1);

  const swatchDx = (sp: Species) => {
    const i = Math.max(0, species.indexOf(sp));
    const span = Math.max(0, width - SWATCH);
    return SWATCH / 2 + (species.length > 1 ? (i / (species.length - 1)) * span : span / 2) - width / 2;
  };

  useEffect(
    () => () => {
      if (clearPrev.current) clearTimeout(clearPrev.current);
      if (landTimer.current) clearTimeout(landTimer.current);
    },
    [],
  );

  // Avant le premier rendu du nouveau pet : on le pose dans sa pastille (pas d'image fantôme au centre).
  useLayoutEffect(() => {
    if (value === last.current) {
      if (nodKey !== lastNod.current && !reduced) {
        // Hochement : la tête plonge et revient, un petit balancement.
        rot.value = withSequence(withTiming(-5, { duration: 80, easing: ease.out }), withTiming(4, { duration: 110, easing: ease.inOut }), withSpring(0, springs.pop));
        y.value = withSequence(withTiming(9, { duration: 80, easing: ease.out }), withSpring(0, springs.pop));
      }
      lastNod.current = nodKey;
      return;
    }
    const from = last.current;
    last.current = value;
    lastNod.current = nodKey;
    setPrev(from);
    if (clearPrev.current) clearTimeout(clearPrev.current);
    clearPrev.current = setTimeout(() => setPrev(null), motion.base + 120);
    bg.value = 0;
    bg.value = fadeTo(1, motion.base);
    if (reduced) {
      o.value = 0;
      o.value = fadeTo(1, motion.fast);
      out.value = 0;
      out.value = fadeTo(1, motion.fast);
      return;
    }
    // L'ancien rentre dans sa pastille.
    out.value = 0;
    outX.value = swatchDx(from);
    out.value = withTiming(1, { duration: motion.base, easing: ease.in });
    // Le nouveau bondit de sa pastille au centre : arc, échelle, puis il s'écrase en se posant.
    const dx = swatchDx(value);
    [x, y, s, sx, sy, rot].forEach((v) => cancelAnimation(v));
    o.value = 1;
    x.value = dx;
    y.value = SWATCH_CY - PET_CY;
    s.value = TINY;
    rot.value = dx > 0 ? 14 : dx < 0 ? -14 : 0;
    sx.value = 1;
    sy.value = 1;
    x.value = withTiming(0, { duration: JUMP, easing: ease.out });
    y.value = withSequence(withTiming(-40, { duration: JUMP * 0.62, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: JUMP * 0.38, easing: Easing.in(Easing.quad) }));
    s.value = withTiming(1, { duration: JUMP * 0.7, easing: ease.out });
    rot.value = withTiming(0, { duration: JUMP, easing: ease.out });
    sy.value = withDelay(JUMP, withSequence(withTiming(0.86, { duration: 90, easing: ease.out }), withSpring(1, springs.plush)));
    sx.value = withDelay(JUMP, withSequence(withTiming(1.1, { duration: 90, easing: ease.out }), withSpring(1, springs.plush)));
    if (landTimer.current) clearTimeout(landTimer.current);
    landTimer.current = setTimeout(() => hapticFor('land'), JUMP);
    setPeekKey((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, nodKey, reduced]);

  const hero = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${rot.value}deg` }, { scale: s.value }],
  }));
  // Écrasement à l'atterrissage, depuis les pieds (le pet ne décolle pas du sol en s'écrasant).
  const squash = useAnimatedStyle(() => ({ transform: [{ scaleX: sx.value }, { scaleY: sy.value }] }));
  const leaving = useAnimatedStyle(() =>
    reduced
      ? { opacity: 1 - out.value }
      : {
          opacity: 1 - Math.max(0, (out.value - 0.6) / 0.4),
          transform: [{ translateX: outX.value * out.value }, { translateY: (SWATCH_CY - PET_CY) * out.value }, { scale: 1 - (1 - TINY) * out.value }],
        },
  );
  const bgIn = useAnimatedStyle(() => ({ opacity: bg.value }));
  const others = species.filter((sp) => sp !== value);

  return (
    <View>
      <View style={styles.stage} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {prev ? <LinearGradient colors={craft[prev].gradient} style={[StyleSheet.absoluteFill, styles.stageFill]} /> : null}
        <Animated.View style={[StyleSheet.absoluteFill, bgIn]}>
          <LinearGradient colors={look.gradient} style={[StyleSheet.absoluteFill, styles.stageFill]} />
        </Animated.View>
        {/* Un calque par espèce, toujours monté (aucune image à charger au moment du saut) : le choisi saute, l'ancien rentre. */}
        {species.map((sp) => {
          const role = sp === value ? 'hero' : sp === prev ? 'leaving' : 'hidden';
          return (
            <View key={sp} pointerEvents="none" style={[styles.petBox, role === 'hero' ? styles.front : role === 'leaving' ? styles.middle : styles.back]}>
              <Animated.View style={role === 'hero' ? hero : role === 'leaving' ? leaving : styles.hidden}>
                <Animated.View style={[styles.feet, role === 'hero' ? squash : null]}>
                  <PetImage
                    species={sp}
                    mood={pose}
                    size={PET}
                    rotate={4}
                    animation={role === 'hero' ? 'breathe' : 'none'}
                    outline
                    accessibilityLabel={role === 'hero' ? names[sp] : undefined}
                    style={shadow.soft}
                  />
                </Animated.View>
              </Animated.View>
            </View>
          );
        })}
        {/* Les curieux passent devant le grand pet, au bord de la scène, le temps de le regarder. */}
        {width && !reduced ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.peekClip]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {PEEKERS.map((p, i) => (
              <Peeker key={p.edge} species={others[i] ?? value} spec={p} index={i} width={width} play={peekKey} />
            ))}
          </View>
        ) : null}
        {speech ? (
          <PopIn trigger={value} onMount={false} delay={reduced ? 0 : JUMP - 60} style={styles.speech}>
            <SpeechBubble text={speech} highlight={speechHighlight} highlightColor={look.swatch} chat />
          </PopIn>
        ) : null}
        {badge ? (
          <View style={styles.badge}>
            <Text variant="bodyHeavy" size={12} color={color.dark} style={styles.badgeText}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      {/* Précharge des curieux (bustes surpris). */}
      <View pointerEvents="none" style={styles.preload} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {species.map((sp) => (
          <Image key={`p${sp}`} source={petImage(sp, 'surpris')} style={styles.preloadImg} />
        ))}
      </View>
      <View accessibilityRole="radiogroup" style={[layout.rowBetween, styles.swatches]}>
        {species.map((sp) => {
          const on = sp === value;
          return (
            <Pressable
              key={sp}
              onPress={() => onChange(sp)}
              haptic="selection"
              scaleTo={0.9}
              bounceKey={on}
              accessibilityRole="radio"
              accessibilityLabel={names[sp]}
              accessibilityState={{ checked: on }}
              hitSlop={hitSlopFor(SWATCH)}
              style={[styles.swatch, { backgroundColor: craft[sp].swatch }, on ? styles.swatchOn : styles.swatchOff]}
            >
              {on ? (
                <PopIn from={0.7} pointerEvents="none" style={styles.ring}>
                  <View />
                </PopIn>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface PeekerProps {
  species: Species;
  spec: (typeof PEEKERS)[number];
  index: number;
  width: number;
  /** Change à chaque nouveau choix : le curieux sort, se penche, puis rentre. */
  play: number;
}

/** Un des trois autres pets : sort d'un bord de la scène, se penche vers le nouveau venu, rentre. */
function Peeker({ species, spec, index, width, play }: PeekerProps) {
  const p = useSharedValue(0);
  const lean = useSharedValue(0);
  useEffect(() => {
    if (!play) return;
    // Ils sortent quand le nouveau s'est posé, l'un après l'autre.
    const wait = JUMP - 60 + index * 110;
    p.value = withSequence(withDelay(wait, withSpring(1, springs.soft)), withDelay(1150, withTiming(0, { duration: 220, easing: ease.in })));
    lean.value = withSequence(withDelay(wait + 260, withSpring(1, springs.pop)), withDelay(900, withTiming(0, { duration: 200 })));
  }, [play, index, p, lean]);
  const center = (shown: SharedValue<number>) => {
    'worklet';
    const depth = PEEK_H / 2 - PEEK_H * PEEK_SHOWN * shown.value;
    if (spec.edge === 'left') return { cx: -depth, cy: STAGE * spec.along };
    if (spec.edge === 'right') return { cx: width + depth, cy: STAGE * spec.along };
    return { cx: width * spec.along, cy: -depth };
  };
  const style = useAnimatedStyle(() => {
    const c = center(p);
    return {
      opacity: p.value > 0.01 ? 1 : 0,
      transform: [{ translateX: c.cx - PEEK / 2 }, { translateY: c.cy - PEEK_H / 2 }, { rotate: `${spec.base + spec.lean * lean.value}deg` }],
    };
  });
  return (
    <Animated.View style={[styles.peeker, style]}>
      <Image source={petImage(species, 'surpris')} contentFit="contain" style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: { height: STAGE, borderRadius: radius.xl - 4 },
  stageFill: { borderRadius: radius.xl - 4 },
  peekClip: { borderRadius: radius.xl - 4, overflow: 'hidden', zIndex: 3 },
  peeker: { position: 'absolute', left: 0, top: 0, width: PEEK, height: PEEK_H },
  feet: { transformOrigin: '50% 94%' },
  front: { zIndex: 2 },
  middle: { zIndex: 1 },
  back: { zIndex: 0 },
  hidden: { opacity: 0 },
  preload: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
  preloadImg: { width: 1, height: 1 },
  petBox: { position: 'absolute', left: 0, right: 0, bottom: -PET_DROP, alignItems: 'center' },
  speech: { position: 'absolute', top: space.lg, left: 14, transformOrigin: 'left bottom', zIndex: 4 },
  badge: { position: 'absolute', zIndex: 4, right: 14, bottom: 14, paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: color.white },
  badgeText: { lineHeight: 16 },
  swatches: { marginTop: 30 },
  swatch: { width: SWATCH, height: SWATCH, borderRadius: radius.pill },
  swatchOff: { borderWidth: 2, borderColor: alpha(color.white, 0.25) },
  swatchOn: { transform: [{ scale: 1.08 }] },
  // `box-shadow: 0 0 0 3px nuit, 0 0 0 6px blanc` : anneau blanc séparé de la pastille par la nuit.
  ring: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: radius.pill, borderWidth: 3, borderColor: color.white },
});
