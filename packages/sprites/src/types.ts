import type { PetPose, Species, Stage } from '@blowy/domain';

/** Métadonnées mesurées d'un fichier (générées par scripts/scan_assets.py). */
export interface AssetMeta {
  width: number;
  height: number;
  /** Le fichier possède au moins un pixel non opaque (alpha < 255). */
  transparent: boolean;
  /** Boîte englobante des pixels opaques [left, top, right, bottom] en pixels source. */
  opaqueBox: readonly [number, number, number, number];
}

/** Chemin relatif à `packages/sprites/assets` (ex. `nino/young/joyful.webp`). */
export type AssetPath = string;

export interface PoseSpriteEntry {
  path: AssetPath;
  /**
   * Hauteur relative du personnage dans ce dessin par rapport à la pose de présentation
   * (bras levés, couché…). Sert à garder une taille de corps constante entre poses.
   */
  heightRatio?: number;
}

export type SpeciesStageTable = Readonly<Record<Species, Readonly<Record<Stage, Readonly<Partial<Record<PetPose, PoseSpriteEntry>>>>>>>;

/** Effet superposé obligatoire lorsqu'une pose d'état est remplacée par un repli. */
export type StateOverlay = 'sick' | 'sleep' | 'hungry' | 'sad';

export const ACCESSORY_IDS = [
  'HEADPHONES',
  'BEANIE',
  'CROWN',
  'SUNGLASSES',
  'BACKPACK',
  'FLOWER',
  'BALLOON',
  'MUG',
  'BOOK',
  'TROPHY',
  'GIFT',
  'BALL',
] as const;
export type AccessoryId = (typeof ACCESSORY_IDS)[number];

export type AccessorySlot = 'HEAD' | 'EYES' | 'CHEST' | 'BACK' | 'HAND' | 'FLOOR';

export interface AccessoryDefinition {
  id: AccessoryId;
  path: AssetPath;
  slot: AccessorySlot;
  /** Clé i18n du libellé (`accessory.<id>`). */
  labelKey: string;
}

/** Point d'ancrage normalisé dans la boîte opaque du sprite (0..1, origine haut-gauche). */
export interface Anchor {
  x: number;
  y: number;
}

export interface SlotPlacement {
  anchor: Anchor;
  /** Largeur de l'accessoire rapportée à la largeur de la boîte opaque du pet. */
  widthRatio: number;
  /** Rotation en degrés. */
  rotation?: number;
  /** Derrière le pet (sac à dos). */
  behind?: boolean;
}

export type SpeciesPlacements = Readonly<Record<AccessorySlot, SlotPlacement>>;

export type FrameSequenceKind = 'walk' | 'jump';

export interface FrameSequence {
  kind: FrameSequenceKind;
  frames: readonly PoseSpriteEntry[];
  /** Durée d'une frame en ms. */
  frameMs: number;
  /**
   * `dedicated` : 4 frames dessinées pour l'animation ; `composed` : séquence construite à
   * partir de poses existantes (repli déclaré, voir inventaire) ; `procedural` : aucune frame,
   * le renderer anime la pose de présentation (translation/squash).
   */
  source: 'dedicated' | 'composed' | 'procedural';
}

export interface ResolvedSprite {
  /** null => placeholder déclaré (aucun dessin disponible pour l'espèce). */
  path: AssetPath | null;
  meta: AssetMeta | null;
  requested: { species: Species; stage: Stage; pose: PetPose };
  resolvedPose: PetPose;
  resolvedStage: Stage;
  /** Facteur de taille appliqué (repli de stade : bébé plus petit, adulte plus grand). */
  stageScale: number;
  heightRatio: number;
  /** Le rendu n'est pas le dessin exact demandé. */
  degraded: boolean;
  /** Superposition requise pour ne pas perdre l'information d'état (malade, endormi…). */
  overlay: StateOverlay | null;
}

export interface SpriteLayout {
  /** Taille d'affichage de l'image entière. */
  width: number;
  height: number;
  /** Position du coin haut-gauche de l'image par rapport au point (centre du corps, sol). */
  left: number;
  top: number;
  /** Boîte opaque affichée, dans le même repère. */
  body: { left: number; top: number; width: number; height: number };
}
