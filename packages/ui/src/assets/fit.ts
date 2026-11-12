/**
 * Habillage des pets : où poser chaque objet sur la pose `debout` (toile 900×1000) de chaque espèce.
 * Les données vivent dans `fit.json` (ancres mesurées par espèce, réglage par objet, exceptions par espèce),
 * lues telles quelles par ce module et par le script de calibration qui produit les planches de contrôle.
 *
 * Calcul (identique dans le script) :
 *   M = sizes[size] × 900 ; largeur = w × M ; hauteur = largeur / ratio
 *   pivot P = points[anchor] × (900, 1000) + (dx, dy) × M
 *   l'image est posée pour que son point `pivot` tombe sur P, puis tournée de `rot`° (sens horaire)
 *   et écrasée de `sy` verticalement autour de ce point.
 */
import { type ItemSlot, itemById, type Outfit, type Species } from '@blowy/domain';

import fitData from './fit.json';

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

interface FitSpecies {
  points: Record<string, number[]>;
  sizes: Record<string, number>;
  /** Médaillon (tête + épaules) : centre x, centre y, côté — normalisés. */
  badge: number[];
}

interface FitData {
  canvas: number[];
  species: Record<string, FitSpecies>;
  items: Record<string, FitItem>;
  overrides: Record<string, Record<string, Partial<FitItem>>>;
}

const FIT: FitData = fitData;

/** Toile des corps entiers (px) : toutes les mesures de placement s'y rapportent. */
export const FIT_CANVAS = { width: FIT.canvas[0] ?? 900, height: FIT.canvas[1] ?? 1000 } as const;

/** Ordre de dessin devant le pet : la tenue, le visage, la tête, puis l'objet posé au sol. */
const FRONT_ORDER: readonly ItemSlot[] = ['body', 'face', 'head', 'toy'];

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
}

function settings(species: Species, id: string): FitItem | null {
  const base = FIT.items[id];
  if (!base) return null;
  const override = FIT.overrides[species]?.[id];
  return override ? { ...base, ...override } : base;
}

/** Placement d'un objet sur une espèce ; `null` si l'objet ou l'ancre est inconnu. */
export function placeItem(species: Species, id: string): ItemPlacement | null {
  const s = settings(species, id);
  const sp = FIT.species[species];
  const slot = itemById(id)?.slot;
  if (!s || !sp || !slot) return null;
  const point = sp.points[s.anchor];
  const measure = sp.sizes[s.size];
  if (!point || measure === undefined) return null;
  const m = measure * FIT_CANVAS.width;
  const width = s.w * m;
  const height = width / s.ratio;
  const px = (point[0] ?? 0) * FIT_CANVAS.width + (s.dx ?? 0) * m;
  const py = (point[1] ?? 0) * FIT_CANVAS.height + (s.dy ?? 0) * m;
  const originX = s.pivot[0] ?? 0.5;
  const originY = s.pivot[1] ?? 0.5;
  return {
    id,
    slot,
    left: px - originX * width,
    top: py - originY * height,
    width,
    height,
    rotate: s.rot ?? 0,
    scaleY: s.sy ?? 1,
    originX,
    originY,
    back: s.z === 'back',
  };
}

/** Les objets d'une tenue en deux couches, chacune dans l'ordre de dessin. */
export function outfitLayers(species: Species, outfit: Outfit | null | undefined, slots: readonly ItemSlot[] = FRONT_ORDER): { back: ItemPlacement[]; front: ItemPlacement[] } {
  const back: ItemPlacement[] = [];
  const front: ItemPlacement[] = [];
  if (!outfit) return { back, front };
  for (const slot of FRONT_ORDER) {
    const id = outfit[slot];
    if (!id || !slots.includes(slot)) continue;
    const p = placeItem(species, id);
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

/** Cadre du médaillon (tête + objets du visage et de la tête), en px de la toile. */
export function badgeFrame(species: Species): { cx: number; cy: number; side: number } {
  const b = FIT.species[species]?.badge ?? [0.5, 0.45, 0.75];
  return { cx: (b[0] ?? 0.5) * FIT_CANVAS.width, cy: (b[1] ?? 0.45) * FIT_CANVAS.height, side: (b[2] ?? 0.75) * FIT_CANVAS.width };
}

/** Ancres mesurées sur la pose `debout` (`fit.json` → `species.<s>.points`). */
export type FitAnchor = 'headTop' | 'crown' | 'eyes' | 'eyeL' | 'eyeR' | 'nose' | 'lip' | 'mouth' | 'cheeks' | 'neck' | 'torso' | 'ground' | 'toy';

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
};

/** Une ancre du pet en fraction de la toile `[x/900, y/1000]` (pour poser une bulle, des « z », un cœur…). */
export function fitAnchor(species: Species, anchor: FitAnchor): { x: number; y: number } {
  const p = FIT.species[species]?.points[anchor];
  const f = ANCHOR_FALLBACK[anchor];
  return { x: p?.[0] ?? f[0], y: p?.[1] ?? f[1] };
}
