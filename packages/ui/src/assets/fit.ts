/**
 * Habillage des minimoas : où poser chaque objet sur chaque pose en pied (toile 900×1000).
 * Les données vivent dans `fit.json` : ancres mesurées sur la pose `debout` (historique) et, pour chaque pose du pack
 * (`species.<s>.poses.<pose>`), les mêmes ancres mesurées par le script de calibration
 * (`apps/mobile/scripts/fit-poses/`), l'inclinaison et la taille de la tête ; puis le réglage de chaque objet
 * (`items`), les exceptions par espèce (`overrides`) et le rendu « porté » (`wear`).
 *
 * Calcul (identique dans le script) :
 *   M = sizes[size] × scale(pose) × 900 ; largeur = w × M ; hauteur = largeur / ratio
 *   pivot P = points[anchor] + rot(tilt) · (dx, dy) × M
 *   l'image est posée pour que son point `pivot` tombe sur P, puis tournée de `rot + tilt`° (sens horaire)
 *   et écrasée de `sy` verticalement autour de ce point.
 * Les objets de main se posent dans la main libre (`points.hand`) quand la pose en a une, sinon au sol à côté.
 * De profil (`face: false`), les objets du visage ne sont pas dessinés.
 */
import { type ItemSlot, itemById, type Outfit, type Species } from '@blowy/domain';

import fitData from './fit.json';
import { type BodyPose, bodyPoseFor } from './pets';

interface FitItem {
  anchor: string;
  size: string;
  w: number;
  pivot: number[];
  ratio: number;
  dx?: number;
  dy?: number;
  rot?: number;
  sy?: number;
  /** `back` : derrière le pet (ailes, cape, sac à dos, serre-têtes). */
  z?: string;
}

interface FitPose {
  points: Record<string, number[]>;
  /** Inclinaison de la tête (degrés, sens horaire). */
  tilt: number;
  /** Taille de la tête par rapport à `debout`. */
  scale: number;
  /** Faux de profil : les objets du visage ne sont pas dessinés. */
  face: boolean;
}

interface FitSpecies {
  points: Record<string, number[]>;
  sizes: Record<string, number>;
  /** Médaillon (tête + épaules) : centre x, centre y, côté — normalisés. */
  badge: number[];
  poses?: Record<string, FitPose>;
}

interface FitWear {
  tuck?: number;
  split?: (number | string)[];
  shadow?: number;
}

interface FitData {
  canvas: number[];
  species: Record<string, FitSpecies>;
  items: Record<string, FitItem>;
  overrides: Record<string, Record<string, Partial<FitItem>>>;
  wear?: Record<string, FitWear>;
}

const FIT = fitData as FitData;

/** Toile des corps entiers (px) : toutes les mesures de placement s'y rapportent. */
export const FIT_CANVAS = { width: FIT.canvas[0] ?? 900, height: FIT.canvas[1] ?? 1000 } as const;

/** Ordre de dessin devant le pet : la tenue, le visage, la tête, puis l'objet posé au sol ou tenu. */
const FRONT_ORDER: readonly ItemSlot[] = ['body', 'face', 'head', 'toy'];

/** Rendu « porté » d'un objet (voir `DressedPet`). */
export interface ItemWear {
  /** Part basse du couvre-chef recouverte par la fourrure du front (0 : rien). */
  tuck: number;
  /** Objet enveloppant : au-dessus de `at` (part de la hauteur de l'image), la partie passe `top` du minimoa. */
  split: { at: number; top: 'back' | 'front' } | null;
  /** Force de l'ombre portée sur le minimoa (0 : aucune). */
  shadow: number;
}

/** Un objet posé, en px de la toile 900×1000. */
export interface ItemPlacement {
  id: string;
  slot: ItemSlot;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Degrés, sens horaire. */
  rotate: number;
  scaleY: number;
  /** Point de rotation dans l'image (0–1). */
  originX: number;
  originY: number;
  back: boolean;
  /** Tenu dans la main (sinon, pour un objet de main, posé au sol). */
  held: boolean;
  wear: ItemWear;
}

const SHADOW_BY_SLOT: Record<ItemSlot, number> = { head: 1, face: 0.7, body: 0.9, toy: 0.8 };

function settings(species: Species, id: string): FitItem | null {
  const base = FIT.items[id];
  if (!base) return null;
  const override = FIT.overrides[species]?.[id];
  return override ? { ...base, ...override } : base;
}

function wearOf(id: string, slot: ItemSlot): ItemWear {
  const w = FIT.wear?.[id];
  const at = w?.split?.[0];
  const top = w?.split?.[1];
  return {
    tuck: w?.tuck ?? 0,
    split: typeof at === 'number' && (top === 'back' || top === 'front') ? { at, top } : null,
    shadow: w?.shadow ?? SHADOW_BY_SLOT[slot],
  };
}

/** Données de la pose (mesurées) ; `null` : pose `debout` historique. */
function poseFit(species: Species, pose: BodyPose | undefined): FitPose | null {
  if (!pose) return null;
  return FIT.species[species]?.poses?.[pose] ?? null;
}

/** Les objets de la tête, du visage et du cou suivent l'inclinaison de la tête ; la tenue en suit la moitié. */
const TILT_SHARE: Record<ItemSlot, number> = { head: 1, face: 1, body: 0.5, toy: 0 };

/**
 * Placement d'un objet sur une espèce, dans une pose du pack (défaut : la pose `debout` historique) ;
 * `null` si l'objet ou l'ancre est inconnu, ou un objet du visage sur une pose de profil.
 */
export function placeItem(species: Species, id: string, pose?: BodyPose): ItemPlacement | null {
  const s = settings(species, id);
  const sp = FIT.species[species];
  const slot = itemById(id)?.slot;
  if (!s || !sp || !slot) return null;
  const pf = poseFit(species, pose);
  if (pf && !pf.face && slot === 'face') return null;
  const hand = pf && slot === 'toy' && s.anchor === 'toy' ? pf.points.hand : undefined;
  const point = hand ?? (pf ? pf.points[s.anchor] : sp.points[s.anchor]);
  const measure = sp.sizes[s.size];
  if (!point || measure === undefined) return null;
  const scale = pf ? pf.scale : 1;
  const tilt = pf ? pf.tilt * TILT_SHARE[slot] : 0;
  // Tenu : un peu plus petit, pris par le bas (la main le serre), sans le décalage vers le côté.
  const m = measure * FIT_CANVAS.width * (slot === 'toy' ? 1 : scale) * (hand ? 0.82 : 1);
  const width = s.w * m;
  const height = width / s.ratio;
  const dx = hand ? 0 : (s.dx ?? 0) * m;
  const dy = hand ? 0 : (s.dy ?? 0) * m;
  const t = (tilt * Math.PI) / 180;
  const px = (point[0] ?? 0) * FIT_CANVAS.width + dx * Math.cos(t) - dy * Math.sin(t);
  const py = (point[1] ?? 0) * FIT_CANVAS.height + dx * Math.sin(t) + dy * Math.cos(t);
  const originX = s.pivot[0] ?? 0.5;
  const originY = hand ? 0.78 : (s.pivot[1] ?? 0.5);
  return {
    id,
    slot,
    left: px - originX * width,
    top: py - originY * height,
    width,
    height,
    rotate: (hand ? 0 : (s.rot ?? 0)) + tilt,
    scaleY: s.sy ?? 1,
    originX,
    originY,
    back: s.z === 'back',
    held: !!hand,
    wear: wearOf(id, slot),
  };
}

/** Les objets d'une tenue en deux couches, chacune dans l'ordre de dessin. */
export function outfitLayers(
  species: Species,
  outfit: Outfit | null | undefined,
  slots: readonly ItemSlot[] = FRONT_ORDER,
  pose?: BodyPose,
): { back: ItemPlacement[]; front: ItemPlacement[] } {
  const back: ItemPlacement[] = [];
  const front: ItemPlacement[] = [];
  if (!outfit) return { back, front };
  for (const slot of FRONT_ORDER) {
    const id = outfit[slot];
    if (!id || !slots.includes(slot)) continue;
    const p = placeItem(species, id, pose);
    if (p) (p.back ? back : front).push(p);
  }
  return { back, front };
}

/** Vrai si la tenue contient au moins un objet dessinable. */
export function hasOutfit(outfit: Outfit | null | undefined): outfit is Outfit {
  if (!outfit) return false;
  return FRONT_ORDER.some((slot) => {
    const id = outfit[slot];
    return !!id && !!FIT.items[id];
  });
}

/** Cadre du médaillon (tête + objets du visage et de la tête), en px de la toile, sur une pose (défaut `debout`). */
export function badgeFrame(species: Species, pose?: BodyPose): { cx: number; cy: number; side: number } {
  const sp = FIT.species[species];
  const b = sp?.badge ?? [0.5, 0.45, 0.75];
  const pf = poseFit(species, pose);
  // Sur une pose du pack : le même cadre, recalé sur les yeux et à la taille de la tête.
  const from = sp?.points.eyes;
  const to = pf?.points.eyes;
  const dx = from && to ? (to[0] ?? 0) - (from[0] ?? 0) : 0;
  const dy = from && to ? (to[1] ?? 0) - (from[1] ?? 0) : 0;
  const k = pf?.scale ?? 1;
  return { cx: ((b[0] ?? 0.5) + dx) * FIT_CANVAS.width, cy: ((b[1] ?? 0.45) + dy) * FIT_CANVAS.height, side: (b[2] ?? 0.75) * k * FIT_CANVAS.width };
}

/** Ancres mesurées (`fit.json` → `species.<s>.points`, ou `poses.<pose>.points`). */
export type FitAnchor = 'headTop' | 'crown' | 'eyes' | 'eyeL' | 'eyeR' | 'nose' | 'lip' | 'mouth' | 'cheeks' | 'neck' | 'torso' | 'ground' | 'toy' | 'hand';

const ANCHOR_FALLBACK: Record<FitAnchor, readonly [number, number]> = {
  headTop: [0.5, 0.27],
  crown: [0.5, 0.33],
  eyes: [0.5, 0.45],
  eyeL: [0.4, 0.45],
  eyeR: [0.62, 0.45],
  nose: [0.5, 0.54],
  lip: [0.5, 0.57],
  mouth: [0.5, 0.61],
  cheeks: [0.5, 0.58],
  neck: [0.5, 0.69],
  torso: [0.5, 0.79],
  ground: [0.5, 0.955],
  toy: [0.78, 0.955],
  hand: [0.78, 0.72],
};

/**
 * Une ancre du pet en fraction de la toile `[x/900, y/1000]` (pour poser une bulle, des « z », un cœur…),
 * sur une pose du pack (ou une humeur, ramenée à sa pose) ; sans pose : la pose `debout` historique.
 */
export function fitAnchor(species: Species, anchor: FitAnchor, pose?: BodyPose | string): { x: number; y: number } {
  const pf = pose ? poseFit(species, bodyPoseFor(pose)) : null;
  const p = pf?.points[anchor] ?? FIT.species[species]?.points[anchor];
  const f = ANCHOR_FALLBACK[anchor];
  return { x: p?.[0] ?? f[0], y: p?.[1] ?? f[1] };
}

/** Inclinaison de la tête dans une pose (degrés, sens horaire). */
export const poseTilt = (species: Species, pose: BodyPose): number => poseFit(species, pose)?.tilt ?? 0;
