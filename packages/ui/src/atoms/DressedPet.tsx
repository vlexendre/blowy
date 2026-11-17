import type { ItemSlot, Mood, Outfit, Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { type ComponentProps, memo, useId } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Defs, G, Image as SvgImage, LinearGradient, Mask, Rect, Stop } from 'react-native-svg';

import { type ItemPlacement, FIT_CANVAS, hasOutfit, outfitLayers } from '../assets/fit';
import { itemImage } from '../assets/items';
import { type BodyPose, bodyPoseFor, type PetPose, petBodyImage, RENDER_RATIO, type Src } from '../assets/pets';
import { useLoop } from '../lib/motion';
import { color, speciesColor } from '../theme';

export interface DressedPetProps {
  species: Species;
  /** Tenue portée (`Pet.outfit` / `PublicPet.outfit`). Vide ou absente : le minimoa seul. */
  outfit?: Outfit | null;
  /** Largeur en points de la toile ; la hauteur suit le rapport 900×1000. */
  size: number;
  /** Humeur (ramenée à sa pose en pied : `amour` → `joie`…) quand `pose` n'est pas donnée. */
  mood?: Mood;
  /** Pose en pied du pack (ou humeur / ancienne pose, ramenée à la pose la plus proche). Défaut `neutre`. */
  pose?: PetPose | BodyPose;
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
  /** Rendu simple (sans ombre, voile ni fourrure par-dessus) : médaillons et toutes petites tailles. */
  flat?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const W = FIT_CANVAS.width;
const H = FIT_CANVAS.height;
/** Voile de la couleur de la fourrure posé sur chaque objet (il « appartient » à la scène). */
const VEIL = 0.08;
/** Ombre propre, en bas à droite (même lumière que les minimoas : venue du haut à gauche). */
const SHADE = 0.26;
/** Ombre portée sur le minimoa : opacité et décalage (part de la taille de l'objet). */
const DROP = { opacity: 0.34, x: 0.025, y: 0.06 };

const svgId = (raw: string) => raw.replace(/[^a-zA-Z0-9]/g, '');

function boxStyle(p: ItemPlacement, k: number) {
  const transform = p.rotate || p.scaleY !== 1 ? [{ rotate: `${p.rotate}deg` }, { scaleY: p.scaleY }] : undefined;
  return {
    position: 'absolute' as const,
    left: p.left * k,
    top: p.top * k,
    width: p.width * k,
    height: p.height * k,
    transform,
    transformOrigin: `${p.originX * 100}% ${p.originY * 100}%`,
  };
}

/** Ombre portée de l'objet sur la fourrure : sa silhouette, sombre, floue, décalée en bas à droite. */
function Drop({ p, k, src, part }: { p: ItemPlacement; k: number; src: Src; part: 'all' | 'top' | 'bottom' }) {
  const w = p.width * k;
  const h = p.height * k;
  const at = p.wear.split?.at ?? 0;
  // Une seule partie d'un objet enveloppant ombre le minimoa : on rogne l'ombre à cette partie.
  const clip = part === 'all' ? null : part === 'top' ? { top: 0, height: h * at } : { top: h * at, height: h * (1 - at) };
  const shadow = (
    <Image
      source={src}
      tintColor={color.night}
      blurRadius={Math.max(2, Math.round(w * 0.035))}
      contentFit="fill"
      style={{ position: 'absolute', left: w * DROP.x, top: h * DROP.y - (clip?.top ?? 0), width: w, height: h, opacity: DROP.opacity * p.wear.shadow }}
    />
  );
  if (!clip) return shadow;
  return <View style={{ position: 'absolute', left: -w * 0.2, top: clip.top, width: w * 1.4, height: clip.height + h * 0.1, overflow: 'hidden' }}>
    <View style={{ position: 'absolute', left: w * 0.2, top: 0, width: w, height: h }}>{shadow}</View>
  </View>;
}

/**
 * L'objet dessiné « porté » : l'image, un voile de la couleur de la fourrure et l'ombre propre en bas à droite,
 * limités à la silhouette de l'objet ; `part` n'en garde que le haut ou le bas (objet enveloppant, bord doux).
 */
function WornImage({ p, k, src, tint, part, uid }: { p: ItemPlacement; k: number; src: Src; tint: string; part: 'all' | 'top' | 'bottom'; uid: string }) {
  const w = p.width;
  const h = p.height;
  const at = p.wear.split?.at ?? 0;
  const soft = 0.05;
  const id = `${uid}${svgId(p.id)}${part}`;
  const body = (
    <>
      <SvgImage href={src} x={0} y={0} width={w} height={h} preserveAspectRatio="none" />
      <G mask={`url(#${id}a)`}>
        <Rect x={0} y={0} width={w} height={h} fill={tint} opacity={VEIL} />
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${id}s)`} />
      </G>
    </>
  );
  return (
    <Svg width={w * k} height={h * k} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
      <Defs>
        <Mask id={`${id}a`} maskType="alpha" maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
          <SvgImage href={src} x={0} y={0} width={w} height={h} preserveAspectRatio="none" />
        </Mask>
        <LinearGradient id={`${id}s`} x1="0.1" y1="0.05" x2="0.95" y2="1">
          <Stop offset="0" stopColor={color.white} stopOpacity={0.07} />
          <Stop offset="0.45" stopColor={color.night} stopOpacity={0} />
          <Stop offset="1" stopColor={color.night} stopOpacity={SHADE} />
        </LinearGradient>
        {part !== 'all' ? (
          <>
            <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset={Math.max(0, at - soft)} stopColor={color.white} stopOpacity={part === 'top' ? 1 : 0} />
              <Stop offset={Math.min(1, at + soft)} stopColor={color.white} stopOpacity={part === 'top' ? 0 : 1} />
            </LinearGradient>
            <Mask id={`${id}p`} maskType="alpha" maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
              <Rect x={0} y={0} width={w} height={h} fill={`url(#${id}g)`} />
            </Mask>
          </>
        ) : null}
      </Defs>
      {part === 'all' ? body : <G mask={`url(#${id}p)`}>{body}</G>}
    </Svg>
  );
}

interface LayerProps {
  p: ItemPlacement;
  k: number;
  hidden?: boolean;
  tint: string;
  flat?: boolean;
  /** Partie dessinée : tout, ou la moitié d'un objet enveloppant (`top` / `bottom` de `wear.split`). */
  part?: 'all' | 'top' | 'bottom';
  /** Ombre portée sur le minimoa (objets devant lui). */
  drop?: boolean;
  uid: string;
}

function Layer({ p, k, hidden, tint, flat, part = 'all', drop = false, uid }: LayerProps) {
  const src = itemImage(p.id);
  if (src === undefined) return null;
  if (flat) {
    return <Image source={src} contentFit="fill" style={[boxStyle(p, k), { opacity: hidden ? 0 : 1 }]} />;
  }
  return (
    <View pointerEvents="none" style={[boxStyle(p, k), { opacity: hidden ? 0 : 1 }]}>
      {drop && p.wear.shadow > 0 ? <Drop p={p} k={k} src={src} part={part} /> : null}
      <WornImage p={p} k={k} src={src} tint={tint} part={part} uid={uid} />
    </View>
  );
}

/**
 * Fourrure par-dessus le bas d'un couvre-chef : une bande du minimoa lui-même, recopiée sur le bord du chapeau
 * (bord haut fondu), pour que le chapeau s'enfonce dans les poils au lieu d'être posé dessus. Hors de la tête
 * (bords d'un chapeau plus large), l'image du minimoa est transparente : le bord reste visible.
 */
function Tuck({ p, k, pet, hidden, uid }: { p: ItemPlacement; k: number; pet: Src; hidden?: boolean; uid: string }) {
  const id = `${uid}${svgId(p.id)}t`;
  const px = p.left + p.originX * p.width;
  const py = p.top + p.originY * p.height;
  const bottom = (1 - p.originY) * p.height * p.scaleY;
  const band = p.wear.tuck * p.height * p.scaleY;
  const feather = band * 0.9;
  return (
    <Svg pointerEvents="none" width={W * k} height={H * k} viewBox={`0 0 ${W} ${H}`} style={[StyleSheet.absoluteFill, { opacity: hidden ? 0 : 1 }]}>
      <Defs>
        <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color.white} stopOpacity={0} />
          <Stop offset="0.5" stopColor={color.white} stopOpacity={0.85} />
          <Stop offset="1" stopColor={color.white} stopOpacity={1} />
        </LinearGradient>
        <Mask id={`${id}m`} maskType="alpha" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <Rect
            x={p.left - p.width * 0.1}
            y={py + bottom - band - feather}
            width={p.width * 1.2}
            height={band + feather + p.height * 0.04}
            fill={`url(#${id}g)`}
            transform={p.rotate ? `rotate(${p.rotate} ${px} ${py})` : undefined}
          />
        </Mask>
      </Defs>
      <SvgImage href={pet} x={0} y={0} width={W} height={H} mask={`url(#${id}m)`} />
    </Svg>
  );
}

/** Calques d'objets devant le minimoa, dans l'ordre : ombre, objet, fourrure par-dessus le bas d'un chapeau. */
function FrontLayers({ layers, k, hidden, tint, flat, pet, uid }: { layers: ItemPlacement[]; k: number; hidden?: readonly string[]; tint: string; flat?: boolean; pet: Src; uid: string }) {
  return (
    <>
      {layers.map((p) => {
        const h = hidden?.includes(p.id);
        const part = p.wear.split ? (p.wear.split.top === 'back' ? 'bottom' : 'top') : 'all';
        return (
          <View key={p.id} pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Layer p={p} k={k} hidden={h} tint={tint} flat={flat} part={part} drop uid={uid} />
            {!flat && p.wear.tuck > 0 ? <Tuck p={p} k={k} pet={pet} hidden={h} uid={uid} /> : null}
          </View>
        );
      })}
    </>
  );
}

/**
 * Le minimoa en pied, dans une pose du pack, avec les objets de sa tenue portés, d'après `assets/fit.json` :
 * chaque pose a ses ancres (la tête penchée en `dodo`, tournée en `boude` ; de profil, rien sur le visage), les
 * objets de main se posent dans la main libre (sinon au sol, à côté). Rendu « porté » : ombre portée douce sur la
 * fourrure, voile de la couleur de la fourrure et même lumière (ombre en bas à droite), fourrure qui passe devant le
 * bas des couvre-chefs, objets enveloppants en deux calques (écharpe, casque, cape : une partie derrière, une devant).
 * Certains objets débordent légèrement de la toile (ailes, objet au sol) : le conteneur ne rogne pas.
 */
export const DressedPet = memo(function DressedPet({
  species,
  outfit,
  size,
  mood,
  pose,
  animated = false,
  slots,
  delay = 0,
  hidden,
  headStyle,
  flat = false,
  accessibilityLabel,
  style,
}: DressedPetProps) {
  const uid = svgId(useId());
  const dressed = hasOutfit(outfit);
  const height = Math.round(size / RENDER_RATIO);
  const k = size / W;
  const t = useLoop(1300, animated, delay);
  const breathe = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 * t.value }, { scaleX: 1 - 0.02 * t.value }, { scaleY: 1 + 0.03 * t.value }],
  }));
  const body: BodyPose = bodyPoseFor(pose ?? mood ?? 'neutre');
  const layers = dressed ? outfitLayers(species, outfit, slots, body) : { back: [], front: [] };
  const base = petBodyImage(species, body);
  const tint = speciesColor[species];
  // Un objet enveloppant a sa partie arrière derrière le minimoa (dessinée en entier : le minimoa la couvre).
  const back = [...layers.back, ...layers.front.filter((p) => p.wear.split && !p.back)];
  const front = [...layers.front, ...layers.back.filter((p) => p.wear.split)];
  const isHead = (p: ItemPlacement) => p.slot === 'head' || p.slot === 'face';
  const bodyFront = front.filter((p) => !headStyle || !isHead(p));
  const headFront = headStyle ? front.filter(isHead) : [];
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height }, style]}
    >
      <Animated.View style={[styles.fill, styles.origin, breathe]}>
        {back.map((p) => (
          <Layer key={p.id} p={p} k={k} hidden={hidden?.includes(p.id)} tint={tint} flat={flat} uid={`${uid}b`} />
        ))}
        <Image source={base} contentFit="contain" style={StyleSheet.absoluteFill} />
        <FrontLayers layers={bodyFront} k={k} hidden={hidden} tint={tint} flat={flat} pet={base} uid={uid} />
        {headStyle ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transformOrigin: `${HEAD_PIVOT.x * 100}% ${HEAD_PIVOT.y * 100}%` }, headStyle]}>
            <FrontLayers layers={headFront} k={k} hidden={hidden} tint={tint} flat={flat} pet={base} uid={`${uid}h`} />
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
