import type { ItemSlot, Mood, Outfit, Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { type ComponentProps, memo, useEffect, useId } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, FeColorMatrix, FeGaussianBlur, Filter, G, Image as SvgImage, LinearGradient, Mask, Polygon, Rect, Stop } from 'react-native-svg';

import { type ItemPlacement, type SleevePlacement, FIT_CANVAS, fitAnchor, hasOutfit, outfitLayers, poseArms } from '../assets/fit';
import { itemImage } from '../assets/items';
import { type BodyPose, bodyPoseFor, type PetPose, petBodyImage, RENDER_RATIO, type Src } from '../assets/pets';
import { useLoop, useReducedMotion } from '../lib/motion';
import { Burst } from '../motion/Burst';
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

/** Ombre sur la fourrure : brun très sombre (l'opacité vient de `wear.fur`). */
const furMatrix = (opacity: number) => [0, 0, 0, 0, 0.1, 0, 0, 0, 0, 0.05, 0, 0, 0, 0, 0, 0, 0, 0, opacity, 0].join(' ');

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
  const id = `${uid}${svgId(p.image)}${part}`;
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

/**
 * Ombre portée d'un couvre-chef, limitée à la fourrure : la silhouette de l'objet, assombrie et floutée (filtre SVG),
 * décalée vers le bas, et masquée par l'alpha du minimoa (elle ne déborde jamais sur le fond).
 */
function FurShadow({ p, k, src, pet, hidden, uid }: { p: ItemPlacement; k: number; src: Src; pet: Src; hidden?: boolean; uid: string }) {
  const id = `${uid}${svgId(p.image)}f`;
  const fs = p.wear.fur ?? { blur: 6, x: 3, y: 8, opacity: 0.35 };
  const px = p.left + p.originX * p.width;
  const py = p.top + p.originY * p.height;
  const transform = `translate(${fs.x} ${fs.y}) translate(${px} ${py}) rotate(${p.rotate}) scale(1 ${p.scaleY}) translate(${-px} ${-py})`;
  const pad = fs.blur * 4;
  return (
    <Svg pointerEvents="none" width={W * k} height={H * k} viewBox={`0 0 ${W} ${H}`} style={[StyleSheet.absoluteFill, { opacity: hidden ? 0 : p.wear.shadow }]}>
      <Defs>
        <Filter id={`${id}b`} filterUnits="userSpaceOnUse" x={p.left - pad} y={p.top - pad} width={p.width + pad * 2} height={p.height + pad * 2 + fs.y}>
          <FeColorMatrix type="matrix" values={furMatrix(fs.opacity)} />
          <FeGaussianBlur stdDeviation={fs.blur} />
        </Filter>
        <Mask id={`${id}m`} maskType="alpha" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <SvgImage href={pet} x={0} y={0} width={W} height={H} />
        </Mask>
      </Defs>
      <G mask={`url(#${id}m)`}>
        <G filter={`url(#${id}b)`}>
          <SvgImage href={src} x={p.left} y={p.top} width={p.width} height={p.height} preserveAspectRatio="none" transform={transform} />
        </G>
      </G>
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
  const src = itemImage(p.image);
  if (src === undefined) return null;
  if (flat || p.wear.plain) {
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
  const id = `${uid}${svgId(p.image)}t`;
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

const src = (p: ItemPlacement) => itemImage(p.image);

/** Calques d'objets devant le minimoa, dans l'ordre : ombre, objet, fourrure par-dessus le bas d'un chapeau. */
/** Où couper les vêtements dans la pose : ligne des pieds, et bras passés devant le ventre (px de la toile). */
interface ClothCut {
  feet: number;
  arms: { x: number; y: number; w: number; h: number }[];
}

/**
 * Vêtement porté : coupé par la silhouette du minimoa (masque de son alpha) et effacé au-dessus des pieds (et, pour le
 * tutu, au-dessus de sa ceinture), avec une ombre douce sur la fourrure ; puis le minimoa repasse devant là où un
 * bras croise le ventre (bras croisés, pomme, ballon). Il ne dépasse jamais de la silhouette, quelle que soit la pose.
 */
function Cloth({ p, k, src, pet, cut, hidden, flat, uid }: { p: ItemPlacement; k: number; src: Src; pet: Src; cut: ClothCut; hidden?: boolean; flat?: boolean; uid: string }) {
  const id = `${uid}${svgId(p.image)}c`;
  const px = p.left + p.originX * p.width;
  const py = p.top + p.originY * p.height;
  const pose = `translate(${px} ${py}) rotate(${p.rotate}) scale(1 ${p.scaleY}) translate(${-px} ${-py})`;
  const fs = p.wear.fur;
  const waist = p.wear.clip?.waist;
  // Tutu : sa jupe descend plus bas (le ventre la cache), sa ceinture s'efface dans la fourrure.
  const bottom = waist !== null && waist !== undefined ? cut.feet + 24 : cut.feet;
  const top = waist !== null && waist !== undefined ? p.top + p.height * waist : -1;
  const cloth = <SvgImage href={src} x={p.left} y={p.top} width={p.width} height={p.height} preserveAspectRatio="none" transform={pose} />;
  return (
    <Svg pointerEvents="none" width={W * k} height={H * k} viewBox={`0 0 ${W} ${H}`} style={[StyleSheet.absoluteFill, { opacity: hidden ? 0 : 1 }]}>
      <Defs>
        <LinearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1={0} y1={Math.max(0, top)} x2={0} y2={bottom + 6}>
          <Stop offset={0} stopColor={color.white} stopOpacity={top > 0 ? 0 : 1} />
          <Stop offset={top > 0 ? Math.min(0.5, 14 / Math.max(1, bottom + 6 - top)) : 0} stopColor={color.white} stopOpacity={1} />
          <Stop offset={Math.max(0, 1 - 12 / Math.max(1, bottom + 6 - Math.max(0, top)))} stopColor={color.white} stopOpacity={1} />
          <Stop offset={1} stopColor={color.white} stopOpacity={0} />
        </LinearGradient>
        <Mask id={`${id}f`} maskType="alpha" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <Rect x={0} y={Math.max(0, top)} width={W} height={bottom + 6 - Math.max(0, top)} fill={`url(#${id}g)`} />
        </Mask>
        <Mask id={`${id}m`} maskType="alpha" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <SvgImage href={pet} x={0} y={0} width={W} height={H} />
        </Mask>
        {fs && !flat ? (
          <Filter id={`${id}b`} filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <FeColorMatrix type="matrix" values={furMatrix(fs.opacity)} />
            <FeGaussianBlur stdDeviation={fs.blur} />
          </Filter>
        ) : null}
        {cut.arms.length ? (
          <>
            <LinearGradient id={`${id}ag`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset={0} stopColor={color.white} stopOpacity={0} />
              <Stop offset={0.18} stopColor={color.white} stopOpacity={1} />
              <Stop offset={0.82} stopColor={color.white} stopOpacity={1} />
              <Stop offset={1} stopColor={color.white} stopOpacity={0} />
            </LinearGradient>
            <Mask id={`${id}a`} maskType="alpha" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
              {cut.arms.map((r, i) => (
                <Rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.h * 0.3} fill={`url(#${id}ag)`} />
              ))}
            </Mask>
          </>
        ) : null}
      </Defs>
      <G mask={`url(#${id}m)`}>
        <G mask={`url(#${id}f)`}>
          {fs && !flat ? (
            <G filter={`url(#${id}b)`} transform={`translate(${fs.x} ${fs.y})`}>
              {cloth}
            </G>
          ) : null}
          {cloth}
        </G>
      </G>
      {cut.arms.length ? <SvgImage href={pet} x={0} y={0} width={W} height={H} mask={`url(#${id}a)`} /> : null}
      {p.sleeves ? <Sleeves s={p.sleeves} pet={pet} id={`${id}s`} /> : null}
    </Svg>
  );
}

/** Fourrure → tissu : la luminance de la fourrure, teintée de la couleur du tissu (l'ombre et le relief restent). */
const tintMatrix = ([r, g, b]: readonly [number, number, number]) =>
  [r * 0.3, r * 0.59, r * 0.11, 0, 0, g * 0.3, g * 0.59, g * 0.11, 0, 0, b * 0.3, b * 0.59, b * 0.11, 0, 0, 0, 0, 0, 1, 0].join(' ');

/**
 * Manches d'un vêtement : les bras de la pose (polygones mesurés), redessinés depuis le minimoa lui-même et recolorés
 * en tissu, puis le poignet un ton plus loin ; la patte reste nue. Les manches suivent donc chaque pose (bras levés,
 * coucou, danse) sans image par pose.
 */
function Sleeves({ s, pet, id }: { s: SleevePlacement; pet: Src; id: string }) {
  return (
    <>
      <Defs>
        <Filter id={`${id}c`} filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <FeColorMatrix type="matrix" values={tintMatrix(s.color)} />
        </Filter>
        <Filter id={`${id}k`} filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <FeColorMatrix type="matrix" values={tintMatrix(s.cuff)} />
        </Filter>
        <Mask id={`${id}m`} maskType="alpha" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          {s.arms.map((a, i) => (
            <Polygon key={i} points={a.sleeve} fill={color.white} />
          ))}
        </Mask>
        <Mask id={`${id}n`} maskType="alpha" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          {s.arms.map((a, i) => (
            <Polygon key={i} points={a.cuff} fill={color.white} />
          ))}
        </Mask>
      </Defs>
      <G mask={`url(#${id}m)`}>
        <SvgImage href={pet} x={0} y={0} width={W} height={H} filter={`url(#${id}c)`} />
      </G>
      <G mask={`url(#${id}n)`}>
        <SvgImage href={pet} x={0} y={0} width={W} height={H} filter={`url(#${id}k)`} />
      </G>
    </>
  );
}

function FrontLayers({ layers, k, hidden, tint, flat, pet, cut, uid }: { layers: ItemPlacement[]; k: number; hidden?: readonly string[]; tint: string; flat?: boolean; pet: Src; cut: ClothCut; uid: string }) {
  return (
    <>
      {layers.map((p) => {
        const h = hidden?.includes(p.id);
        const img = src(p);
        if (p.wear.clip && img !== undefined) {
          return (
            <View key={`${p.id}:${p.image}`} pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Cloth p={p} k={k} src={img} pet={pet} cut={cut} hidden={h} flat={flat} uid={uid} />
            </View>
          );
        }
        const part = p.wear.split ? (p.wear.split.top === 'back' ? 'bottom' : 'top') : 'all';
        return (
          <View key={`${p.id}:${p.image}`} pointerEvents="none" style={StyleSheet.absoluteFill}>
            {!flat && p.wear.fur && src(p) !== undefined ? <FurShadow p={p} k={k} src={src(p) as Src} pet={pet} hidden={h} uid={uid} /> : null}
            <Layer p={p} k={k} hidden={h} tint={tint} flat={flat} part={part} drop={!p.wear.fur} uid={uid} />
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
  const cut: ClothCut = { feet: fitAnchor(species, 'feet', body).y * H, arms: poseArms(species, body) };
  const tint = speciesColor[species];
  // Un objet enveloppant a sa partie arrière derrière le minimoa (dessinée en entier : le minimoa la couvre).
  const back = [...layers.back, ...layers.front.filter((p) => p.wear.split && !p.back)];
  const front = [...layers.front, ...layers.back.filter((p) => p.wear.split)];
  const isHead = (p: ItemPlacement) => p.slot === 'head' || p.slot === 'face';
  // Calques arrière de la tête (arceau du casque) : ils suivent la tête avec le même retard que l'avant.
  const bodyBack = back.filter((p) => !headStyle || !isHead(p));
  const headBack = headStyle ? back.filter(isHead) : [];
  const backLayer = (p: ItemPlacement) =>
    p.wear.spin ? (
      <Spinning key={`${p.id}:${p.image}`} p={p} k={k} hidden={hidden?.includes(p.id)} animated={animated} />
    ) : (
      <Layer key={`${p.id}:${p.image}`} p={p} k={k} hidden={hidden?.includes(p.id)} tint={tint} flat={flat} uid={`${uid}b`} />
    );
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
        {bodyBack.map(backLayer)}
        {headBack.length ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transformOrigin: `${HEAD_PIVOT.x * 100}% ${HEAD_PIVOT.y * 100}%` }, headStyle]}>
            {headBack.map(backLayer)}
          </Animated.View>
        ) : null}
        <Image source={base} contentFit="contain" style={StyleSheet.absoluteFill} />
        <FrontLayers layers={bodyFront} k={k} hidden={hidden} tint={tint} flat={flat} pet={base} cut={cut} uid={uid} />
        {headStyle ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transformOrigin: `${HEAD_PIVOT.x * 100}% ${HEAD_PIVOT.y * 100}%` }, headStyle]}>
            <FrontLayers layers={headFront} k={k} hidden={hidden} tint={tint} flat={flat} pet={base} cut={cut} uid={`${uid}h`} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
});

/** Un tour en 30 s (aura). */
const SPIN_MS = 30_000;

/**
 * Objet qui tourne lentement derrière le minimoa (aura de flocons), avec quelques scintillements autour. Immobile avec
 * « réduire les animations » ou sans `animated` (vignettes, planches).
 */
function Spinning({ p, k, hidden, animated }: { p: ItemPlacement; k: number; hidden?: boolean; animated: boolean }) {
  const reduced = useReducedMotion();
  const turn = useSharedValue(0);
  const on = animated && !reduced;
  useEffect(() => {
    if (!on) {
      cancelAnimation(turn);
      return;
    }
    turn.value = withRepeat(withTiming(360, { duration: SPIN_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(turn);
  }, [on, turn]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  const src = itemImage(p.image);
  if (src === undefined) return null;
  return (
    <View pointerEvents="none" style={[boxStyle(p, k), { opacity: hidden ? 0 : 0.85 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, spin]}>
        <Image source={src} contentFit="fill" style={StyleSheet.absoluteFill} />
      </Animated.View>
      {on ? <Burst kind="twinkle" loop seed={`aura:${p.id}`} count={4} spread={p.width * k * 0.42} size={p.width * k * 0.07} style={styles.center} /> : null}
    </View>
  );
}

/** Pivot des objets de la tête : le bas du visage (ils basculent autour du cou). */
const HEAD_PIVOT = { x: 0.5, y: 0.62 };

const styles = StyleSheet.create({
  fill: { flex: 1 },
  origin: { transformOrigin: '50% 100%' },
  center: { position: 'absolute', left: '50%', top: '50%' },
});
