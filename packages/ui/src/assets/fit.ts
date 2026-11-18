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
 * De profil (`face: false`), les objets du visage ne sont pas dessinés ; une pose peut cacher des emplacements (`hide` :
 * la tenue sous le plaid ou dans le bain, le couvre-chef reste).
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
  /** Autre image pour cette espèce (`overrides.gaston.lunettes_rondes.image = lunettes_rondes_1`). */
  image?: string;
  /**
   * Calque arrière d'un objet qui entoure le minimoa (écharpe, colliers, casque, cape, sac à dos) : dessiné derrière
   * lui, avec ses propres réglages (les champs absents reprennent ceux de l'objet) ; image par défaut `<id>_dos`.
   */
  back?: Partial<FitItem>;
  /** Compagnon posé au sol à côté (sapin, bonhomme de neige) : jamais tenu dans la main. */
  ground?: boolean;
  /**
   * Réglages remplacés sur une pose de profil (`face: false`, minimoa tourné vers la droite) : le sac passe derrière
   * le dos (à gauche), l'écharpe se resserre sur le cou vu de côté.
   */
  profile?: Partial<Omit<FitItem, 'profile' | 'back'>>;
  /**
   * Ancre `tips` (objet porté SUR un attribut de l'espèce : pompons de Suzie, cornes de Pia) : les deux points de l'image
   * [xG, yG, xD, yD] (fractions) posés sur les deux bouts mesurés de la pose (`poses.<p>.tips`) ; l'image suit leur
   * écart (× `w`) et leur angle. Sans mesure sur la pose : réglage commun de l'objet.
   */
  pair?: number[];
  /**
   * Vêtement à manches longues : sur une pose dont les bras sont mesurés (`poses.<p>.sleeves`), le corps du vêtement
   * prend l'image sans manches `image` et chaque bras est recoloré (fourrure → tissu, l'ombre de la fourrure reste) en
   * `color`, le poignet en `cuff` (RVB 0–255).
   */
  sleeve?: { color: number[]; cuff: number[]; image?: string; ratio?: number };
}

interface FitPose {
  points: Record<string, number[]>;
  /** Inclinaison de la tête (degrés, sens horaire). */
  tilt: number;
  /** Taille de la tête par rapport à `debout`. */
  scale: number;
  /** Faux de profil : les objets du visage ne sont pas dessinés. */
  face: boolean;
  /** Zones [x0, y0, x1, y1] (fractions de la toile) où un bras passe devant le ventre. */
  arms?: number[][];
  /** Emplacements non dessinés dans cette pose (la tenue sous le plaid de `malade`, dans le bain). */
  hide?: string[];
  /** Bouts des pompons (Suzie) ou des cornes (Pia) : [xG, yG, xD, yD] (fractions de la toile). */
  tips?: number[];
  /** Bras hors du ventre (scripts/fit-poses/sleeves.py) : par bras, [manche, poignet], polygones x,y,… (fractions). */
  sleeves?: number[][][];
}

interface FitSpecies {
  points: Record<string, number[]>;
  sizes: Record<string, number>;
  /** Médaillon (tête + épaules) : centre x, centre y, côté — normalisés. */
  badge: number[];
  /** Luminance moyenne de la fourrure (0–1) : ramène la fourrure recolorée en manche à la couleur du tissu. */
  furL?: number;
  poses?: Record<string, FitPose>;
}

interface FitWear {
  plain?: boolean;
  /** Vêtement coupé par la silhouette ; nombre : ceinture effacée au-dessus de cette part de sa hauteur. */
  clip?: boolean | number;
  /** Vrai : ombre des couvre-chefs ; liste : [flou, x, y, opacité] (px de la toile). */
  fur?: boolean | number[];
  tuck?: number;
  split?: (number | string)[];
  shadow?: number;
  /** Tourne lentement sur lui-même, derrière le minimoa (aura). */
  spin?: boolean;
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
  /** Image déjà « portée » (couvre-chefs refaits) : dessinée telle quelle, sans voile ni ombre propre. */
  plain: boolean;
  /** Ombre portée douce limitée à la fourrure (elle ne déborde pas sur le fond) ; `null` : aucune. */
  fur: FurShadowSpec | null;
  /** Vêtement : coupé par la silhouette du minimoa et effacé au-dessus des pieds ; `waist` : haut effacé (tutu). */
  clip: { waist: number | null } | null;
  /** Tourne lentement (aura de la collection Hiver), scintillements autour ; immobile si « réduire les animations ». */
  spin: boolean;
}

/** Ombre portée sur la fourrure : flou, décalage (px de la toile 900×1000) et opacité. */
export interface FurShadowSpec {
  blur: number;
  x: number;
  y: number;
  opacity: number;
}

/** Ombre des couvre-chefs (planche de référence des couvre-chefs). */
const HAT_SHADOW: FurShadowSpec = { blur: 12, x: 4, y: 14, opacity: 0.47 };

/** Un objet posé, en px de la toile 900×1000. */
export interface ItemPlacement {
  id: string;
  /** Nom de l'image à dessiner (`itemImage`) : l'objet, ou sa variante pour l'espèce. */
  image: string;
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
  /** Manches posées sur les bras de la pose (vêtement à manches, pose aux bras mesurés). */
  sleeves?: SleevePlacement;
}

/** Manches d'un vêtement sur une pose : bras en px de la toile, couleurs du tissu et du poignet (0–1, déjà ramenées). */
export interface SleevePlacement {
  arms: { sleeve: string; cuff: string }[];
  color: readonly [number, number, number];
  cuff: readonly [number, number, number];
}

const toPoints = (flat: number[]) => {
  const out: string[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push(`${((flat[i] ?? 0) * FIT_CANVAS.width).toFixed(1)},${((flat[i + 1] ?? 0) * FIT_CANVAS.height).toFixed(1)}`);
  return out.join(' ');
};

function sleevesFor(species: Species, s: FitItem, pf: FitPose | null): SleevePlacement | undefined {
  if (!s.sleeve || !pf?.sleeves?.length) return undefined;
  const gain = 1 / (FIT.species[species]?.furL ?? 0.6);
  const rgb = (c: number[]) => [((c[0] ?? 0) / 255) * gain, ((c[1] ?? 0) / 255) * gain, ((c[2] ?? 0) / 255) * gain] as const;
  return {
    arms: pf.sleeves.map(([sl = [], cu = []]) => ({ sleeve: toPoints(sl), cuff: toPoints(cu) })),
    color: rgb(s.sleeve.color),
    cuff: rgb(s.sleeve.cuff),
  };
}

const SHADOW_BY_SLOT: Record<ItemSlot, number> = { head: 1, face: 0.7, body: 0.9, toy: 0.8 };

function settings(species: Species, id: string, layer: 'front' | 'back' = 'front', own = true): FitItem | null {
  const base = FIT.items[id];
  if (!base) return null;
  const override = own ? FIT.overrides[species]?.[id] : undefined;
  const s = override ? { ...base, ...override, back: base.back || override.back ? { ...base.back, ...override.back } : undefined } : base;
  if (layer === 'front') return s;
  if (!s.back) return null;
  // Le calque arrière ne reprend pas l'image ni le décalage de l'avant (sauf s'il les redonne).
  const { back, image: _image, profile: _profile, ...front } = s;
  return { ...front, ...back, image: back.image ?? `${id}_dos`, z: 'back' };
}

function wearOf(id: string, slot: ItemSlot): ItemWear {
  const w = FIT.wear?.[id];
  const at = w?.split?.[0];
  const top = w?.split?.[1];
  return {
    tuck: w?.tuck ?? 0,
    split: typeof at === 'number' && (top === 'back' || top === 'front') ? { at, top } : null,
    shadow: w?.shadow ?? SHADOW_BY_SLOT[slot],
    plain: w?.plain ?? false,
    clip: w?.clip ? { waist: typeof w.clip === 'number' ? w.clip : null } : null,
    spin: w?.spin ?? false,
    fur: Array.isArray(w?.fur) ? { blur: w.fur[0] ?? 6, x: w.fur[1] ?? 3, y: w.fur[2] ?? 8, opacity: w.fur[3] ?? 0.35 } : w?.fur ? HAT_SHADOW : null,
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
export function placeItem(species: Species, id: string, pose?: BodyPose, layer: 'front' | 'back' = 'front'): ItemPlacement | null {
  const set = settings(species, id, layer);
  const sp = FIT.species[species];
  const slot = itemById(id)?.slot;
  if (!set || !sp || !slot) return null;
  const pf = poseFit(species, pose);
  const own = pf && !pf.face && set.profile ? { ...set, ...set.profile } : set;
  if (own.anchor === 'tips') {
    const at = pf?.tips ? placeOnTips(id, slot, own, pf.tips) : null;
    if (at) return at;
  }
  // Ancre `tips` sans mesure sur cette pose : le réglage commun de l'objet.
  const s0 = own.anchor === 'tips' ? settings(species, id, layer, false) : own;
  if (!s0) return null;
  const s = pf && !pf.face && s0.profile ? { ...s0, ...s0.profile } : s0;
  if (pf && !pf.face && slot === 'face') return null;
  if (pf?.hide?.includes(slot)) return null;
  const hand = pf && slot === 'toy' && s.anchor === 'toy' && !s.ground ? pf.points.hand : undefined;
  const point = hand ?? (pf ? pf.points[s.anchor] : sp.points[s.anchor]);
  const measure = sp.sizes[s.size];
  if (!point || measure === undefined) return null;
  const scale = pf ? pf.scale : 1;
  const tilt = pf ? pf.tilt * TILT_SHARE[slot] : 0;
  // Tenu : un peu plus petit, pris par le bas (la main le serre), sans le décalage vers le côté.
  const m = measure * FIT_CANVAS.width * (slot === 'toy' ? 1 : scale);
  const sleeves = layer === 'front' ? sleevesFor(species, s, pf) : undefined;
  const width = s.w * m;
  const height = width / ((sleeves && s.sleeve?.ratio) || s.ratio);
  const dx = hand ? 0 : (s.dx ?? 0) * m;
  const dy = hand ? 0 : (s.dy ?? 0) * m;
  const t = (tilt * Math.PI) / 180;
  const px = (point[0] ?? 0) * FIT_CANVAS.width + dx * Math.cos(t) - dy * Math.sin(t);
  const py = (point[1] ?? 0) * FIT_CANVAS.height + dx * Math.sin(t) + dy * Math.cos(t);
  const originX = s.pivot[0] ?? 0.5;
  const originY = hand ? 0.78 : (s.pivot[1] ?? 0.5);
  return {
    id,
    image: (sleeves && s.sleeve?.image) || (s.image ?? id),
    sleeves,
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

/** Objet posé sur les deux bouts mesurés (pompons, cornes) : écart, angle et milieu de l'image sur ceux de la pose. */
function placeOnTips(id: string, slot: ItemSlot, s: FitItem, tips: number[]): ItemPlacement | null {
  const pair = s.pair;
  if (!pair || pair.length < 4 || tips.length < 4) return null;
  const [ax = 0, ay = 0, bx = 0, by = 0] = tips.map((v, i) => v * (i % 2 ? FIT_CANVAS.height : FIT_CANVAS.width));
  const [ix0 = 0.2, iy0 = 0.5, ix1 = 0.8, iy1 = 0.5] = pair;
  const span = ix1 - ix0;
  if (span <= 0) return null;
  const width = (Math.hypot(bx - ax, by - ay) / span) * s.w;
  const height = width / s.ratio;
  const originX = (ix0 + ix1) / 2;
  const originY = (iy0 + iy1) / 2;
  const px = (ax + bx) / 2 + (s.dx ?? 0) * width;
  const py = (ay + by) / 2 + (s.dy ?? 0) * width;
  return {
    id,
    image: s.image ?? id,
    slot,
    left: px - originX * width,
    top: py - originY * height,
    width,
    height,
    rotate: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI + (s.rot ?? 0),
    scaleY: s.sy ?? 1,
    originX,
    originY,
    back: s.z === 'back',
    held: false,
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
    const b = placeItem(species, id, pose, 'back');
    if (b) back.push(b);
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

/**
 * Cadre du médaillon qui garde en entier ce qui dépasse de la tête (couronne, chapeau pointu, oreilles de lapin,
 * cornes) : le haut du cadre remonte jusqu'à l'objet le plus haut (plus une marge), le bas ne bouge pas, le cadre
 * reste carré et centré sur la tête. Sans objet qui dépasse : `badgeFrame`. Agrandi au plus de `maxGrow`.
 */
export function badgeFrameFitting(species: Species, outfit: Outfit | null | undefined, pose?: BodyPose, maxGrow = 1.3): { cx: number; cy: number; side: number } {
  const f = badgeFrame(species, pose);
  if (!hasOutfit(outfit)) return f;
  const { back, front } = outfitLayers(species, outfit, ['head', 'face'], pose);
  const tops = [...back, ...front].map((p) => p.top);
  if (!tops.length) return f;
  const margin = f.side * 0.04;
  const top = f.cy - f.side / 2;
  const bottom = f.cy + f.side / 2;
  const wanted = Math.min(...tops) - margin;
  if (wanted >= top) return f;
  const side = Math.min(f.side * maxGrow, bottom - wanted);
  return { cx: f.cx, cy: bottom - side / 2, side };
}

/** Ancres mesurées (`fit.json` → `species.<s>.points`, ou `poses.<pose>.points`). */
export type FitAnchor = 'headTop' | 'crown' | 'brow' | 'chest' | 'feet' | 'eyes' | 'eyeL' | 'eyeR' | 'nose' | 'lip' | 'mouth' | 'cheeks' | 'neck' | 'torso' | 'ground' | 'toy' | 'hand';

const ANCHOR_FALLBACK: Record<FitAnchor, readonly [number, number]> = {
  headTop: [0.5, 0.27],
  crown: [0.5, 0.33],
  brow: [0.5, 0.36],
  chest: [0.5, 0.67],
  feet: [0.5, 0.9],
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

/** Zones de la pose où un bras passe devant le ventre (px de la toile) : le minimoa y repasse devant sa tenue. */
export function poseArms(species: Species, pose: BodyPose): { x: number; y: number; w: number; h: number }[] {
  return (poseFit(species, pose)?.arms ?? []).map((r) => ({
    x: (r[0] ?? 0) * FIT_CANVAS.width,
    y: (r[1] ?? 0) * FIT_CANVAS.height,
    w: ((r[2] ?? 0) - (r[0] ?? 0)) * FIT_CANVAS.width,
    h: ((r[3] ?? 0) - (r[1] ?? 0)) * FIT_CANVAS.height,
  }));
}

/** Inclinaison de la tête dans une pose (degrés, sens horaire). */
export const poseTilt = (species: Species, pose: BodyPose): number => poseFit(species, pose)?.tilt ?? 0;
