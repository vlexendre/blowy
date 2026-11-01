/**
 * Catalogue des sprites Blowy — source : maquette « V4 finale » (design/v4-reference/assets),
 * copiée sous des noms parlants dans packages/sprites/assets. Toute entrée absente ici est
 * résolue par la chaîne de repli de resolve.ts et listée dans docs/mobile/assets-inventory.md.
 */
import type { PetPose, Species, Stage } from '@blowy/domain';
import type {
  AccessoryDefinition,
  AccessoryId,
  AccessorySlot,
  FrameSequence,
  PoseSpriteEntry,
  SpeciesPlacements,
  SpeciesStageTable,
  StateOverlay,
} from './types.js';

const p = (path: string, heightRatio?: number): PoseSpriteEntry => (heightRatio === undefined ? { path } : { path, heightRatio });

export const POSE_SPRITES: SpeciesStageTable = {
  NINO: {
    BABY: { PRESENTATION: p('nino/baby/presentation.webp') },
    YOUNG: {
      PRESENTATION: p('nino/young/presentation.webp'),
      JOYFUL: p('nino/young/joyful.webp'),
      SAD: p('nino/young/sad.webp', 0.95),
      ASLEEP: p('nino/young/asleep.webp', 0.85),
      PROUD: p('nino/young/proud.webp'),
      SURPRISED: p('nino/young/surprised.webp'),
      AFFECTIONATE: p('nino/young/affectionate.webp'),
      LEAP: p('nino/young/leap.webp', 1.05),
      DANCE: p('nino/young/dance.webp', 1.03),
    },
    ADULT: {},
  },
  GASTON: {
    BABY: {},
    YOUNG: {
      PRESENTATION: p('gaston/young/presentation.webp'),
      JOYFUL: p('gaston/young/joyful.webp'),
      POUTING: p('gaston/young/pouting.webp'),
      LEAP: p('gaston/young/leap.webp', 1.05),
    },
    ADULT: {},
  },
  SUZIE: {
    BABY: {},
    YOUNG: {
      PRESENTATION: p('suzie/young/presentation.webp'),
      JOYFUL: p('suzie/young/joyful.webp'),
      PROUD: p('suzie/young/proud.webp'),
      AFFECTIONATE: p('suzie/young/affectionate.webp'),
      LEAP: p('suzie/young/leap.webp', 1.05),
    },
    ADULT: {},
  },
  PIA: {
    BABY: {},
    YOUNG: {
      PRESENTATION: p('pia/young/presentation.webp'),
      JOYFUL: p('pia/young/joyful.webp'),
      PROUD: p('pia/young/proud.webp'),
      LEAP: p('pia/young/leap.webp', 1.05),
    },
    ADULT: {},
  },
};

/**
 * Chaîne de repli de pose (dans le même stade). PRESENTATION est toujours le dernier recours.
 * Les poses d'état (malade, endormi, affamé, triste) exigent une superposition lorsqu'elles
 * sont remplacées, pour que l'état reste perceptible sans la couleur seule.
 */
export const POSE_FALLBACKS: Readonly<Record<PetPose, readonly PetPose[]>> = {
  PRESENTATION: [],
  JOYFUL: ['PRESENTATION'],
  SAD: ['POUTING', 'PRESENTATION'],
  SICK: ['SAD', 'ASLEEP', 'PRESENTATION'],
  ASLEEP: ['PRESENTATION'],
  HUNGRY: ['SAD', 'POUTING', 'PRESENTATION'],
  POUTING: ['SAD', 'PRESENTATION'],
  PROUD: ['JOYFUL', 'PRESENTATION'],
  SURPRISED: ['JOYFUL', 'PRESENTATION'],
  AFFECTIONATE: ['JOYFUL', 'PRESENTATION'],
  LEAP: ['JOYFUL', 'PRESENTATION'],
  DANCE: ['LEAP', 'JOYFUL', 'PRESENTATION'],
};

export const STATE_OVERLAY_FOR_POSE: Readonly<Partial<Record<PetPose, StateOverlay>>> = {
  SICK: 'sick',
  ASLEEP: 'sleep',
  HUNGRY: 'hungry',
  SAD: 'sad',
};

/** Repli de stade : on dessine le stade jeune, réduit ou agrandi. */
export const STAGE_FALLBACKS: Readonly<Record<Stage, readonly { stage: Stage; scale: number }[]>> = {
  YOUNG: [],
  BABY: [{ stage: 'YOUNG', scale: 0.72 }],
  ADULT: [{ stage: 'YOUNG', scale: 1.12 }],
};

/** Taille relative du corps par stade quand le dessin du stade existe. */
export const STAGE_BODY_SCALE: Readonly<Record<Stage, number>> = { BABY: 0.72, YOUNG: 1, ADULT: 1.12 };

/** Séquences d'animation (4 frames attendues par le pack). */
export const FRAME_SEQUENCES: Readonly<Record<Species, Readonly<Record<'walk' | 'jump', FrameSequence>>>> = {
  NINO: {
    walk: {
      kind: 'walk',
      source: 'dedicated',
      frameMs: 140,
      frames: [p('nino/young/walk/walk-1.webp'), p('nino/young/walk/walk-2.webp'), p('nino/young/walk/walk-3.webp'), p('nino/young/walk/walk-4.webp')],
    },
    jump: {
      kind: 'jump',
      source: 'composed',
      frameMs: 160,
      frames: [p('nino/young/presentation.webp'), p('nino/young/jump-pose.webp', 1.05), p('nino/young/leap.webp', 1.05), p('nino/young/presentation.webp')],
    },
  },
  GASTON: {
    walk: { kind: 'walk', source: 'procedural', frameMs: 140, frames: [] },
    jump: { kind: 'jump', source: 'composed', frameMs: 160, frames: [p('gaston/young/presentation.webp'), p('gaston/young/leap.webp', 1.05), p('gaston/young/leap.webp', 1.05), p('gaston/young/presentation.webp')] },
  },
  SUZIE: {
    walk: { kind: 'walk', source: 'procedural', frameMs: 140, frames: [] },
    jump: { kind: 'jump', source: 'composed', frameMs: 160, frames: [p('suzie/young/presentation.webp'), p('suzie/young/leap.webp', 1.05), p('suzie/young/leap.webp', 1.05), p('suzie/young/presentation.webp')] },
  },
  PIA: {
    walk: { kind: 'walk', source: 'procedural', frameMs: 140, frames: [] },
    jump: { kind: 'jump', source: 'composed', frameMs: 160, frames: [p('pia/young/presentation.webp'), p('pia/young/leap.webp', 1.05), p('pia/young/leap.webp', 1.05), p('pia/young/presentation.webp')] },
  },
};

const acc = (id: AccessoryId, path: string, slot: AccessorySlot): AccessoryDefinition => ({ id, path, slot, labelKey: `accessory.${id.toLowerCase()}` });

export const ACCESSORIES: Readonly<Record<AccessoryId, AccessoryDefinition>> = {
  HEADPHONES: acc('HEADPHONES', 'accessories/headphones.webp', 'HEAD'),
  BEANIE: acc('BEANIE', 'accessories/beanie.webp', 'HEAD'),
  CROWN: acc('CROWN', 'accessories/crown.webp', 'HEAD'),
  SUNGLASSES: acc('SUNGLASSES', 'accessories/sunglasses.webp', 'EYES'),
  BACKPACK: acc('BACKPACK', 'accessories/backpack.webp', 'BACK'),
  FLOWER: acc('FLOWER', 'accessories/flower.webp', 'CHEST'),
  BALLOON: acc('BALLOON', 'accessories/balloon.webp', 'HAND'),
  MUG: acc('MUG', 'accessories/mug.webp', 'HAND'),
  BOOK: acc('BOOK', 'accessories/book.webp', 'HAND'),
  TROPHY: acc('TROPHY', 'accessories/trophy.webp', 'FLOOR'),
  GIFT: acc('GIFT', 'accessories/gift.webp', 'FLOOR'),
  BALL: acc('BALL', 'accessories/ball.webp', 'FLOOR'),
};

/**
 * Placement des accessoires par espèce (stade jeune, pose de présentation), mesuré à l'œil sur
 * la maquette. Les ancrages sont relatifs à la boîte opaque du sprite. À affiner quand le pack
 * final fournira des points d'ancrage par pose (voir inventaire).
 */
export const ACCESSORY_PLACEMENTS: Readonly<Record<Species, SpeciesPlacements>> = {
  NINO: {
    HEAD: { anchor: { x: 0.56, y: 0.07 }, widthRatio: 0.62 },
    EYES: { anchor: { x: 0.6, y: 0.25 }, widthRatio: 0.5 },
    CHEST: { anchor: { x: 0.56, y: 0.5 }, widthRatio: 0.2 },
    BACK: { anchor: { x: 0.4, y: 0.5 }, widthRatio: 0.45, behind: true },
    HAND: { anchor: { x: 0.9, y: 0.55 }, widthRatio: 0.3 },
    FLOOR: { anchor: { x: 1.05, y: 1 }, widthRatio: 0.32 },
  },
  GASTON: {
    HEAD: { anchor: { x: 0.6, y: 0.04 }, widthRatio: 0.5 },
    EYES: { anchor: { x: 0.62, y: 0.13 }, widthRatio: 0.42 },
    CHEST: { anchor: { x: 0.45, y: 0.42 }, widthRatio: 0.18 },
    BACK: { anchor: { x: 0.35, y: 0.45 }, widthRatio: 0.42, behind: true },
    HAND: { anchor: { x: 0.92, y: 0.4 }, widthRatio: 0.28 },
    FLOOR: { anchor: { x: 1.05, y: 1 }, widthRatio: 0.3 },
  },
  SUZIE: {
    HEAD: { anchor: { x: 0.45, y: 0.2 }, widthRatio: 0.55 },
    EYES: { anchor: { x: 0.5, y: 0.37 }, widthRatio: 0.48 },
    CHEST: { anchor: { x: 0.5, y: 0.58 }, widthRatio: 0.2 },
    BACK: { anchor: { x: 0.4, y: 0.6 }, widthRatio: 0.42, behind: true },
    HAND: { anchor: { x: 0.85, y: 0.52 }, widthRatio: 0.28 },
    FLOOR: { anchor: { x: 1.05, y: 1 }, widthRatio: 0.3 },
  },
  PIA: {
    HEAD: { anchor: { x: 0.48, y: 0.04 }, widthRatio: 0.45 },
    EYES: { anchor: { x: 0.5, y: 0.16 }, widthRatio: 0.36 },
    CHEST: { anchor: { x: 0.45, y: 0.42 }, widthRatio: 0.16 },
    BACK: { anchor: { x: 0.35, y: 0.5 }, widthRatio: 0.38, behind: true },
    HAND: { anchor: { x: 0.85, y: 0.42 }, widthRatio: 0.26 },
    FLOOR: { anchor: { x: 1.05, y: 1 }, widthRatio: 0.3 },
  },
};

/** Ajustement de placement par stade (le bébé a une tête plus grosse, l'adulte plus petite). */
export const STAGE_PLACEMENT_SCALE: Readonly<Record<Stage, number>> = { BABY: 1.15, YOUNG: 1, ADULT: 0.95 };

/** Poses où les objets tenus en main sont masqués (mains occupées ou couché). */
export const HAND_HIDDEN_POSES: readonly PetPose[] = ['ASLEEP', 'LEAP', 'DANCE', 'AFFECTIONATE'];

export const EFFECTS = {
  hearts: 'effects/hearts.webp',
  confetti: 'effects/confetti.webp',
  spark: 'effects/spark.webp',
} as const;
export type EffectId = keyof typeof EFFECTS;

export const SCENES = {
  HOME: 'scenes/home-room.webp',
  PARK: 'scenes/park.webp',
  CAFE: 'scenes/cafe.webp',
  BEDROOM: 'scenes/bedroom-strip.webp',
  STREET: 'scenes/street.webp',
  CITY_MAP: 'scenes/city-map.webp',
  DATE_SPOT_MAP: 'scenes/date-spot-map.webp',
  HOUSE: 'scenes/house.webp',
  HOUSE_EMPTY: 'scenes/house-empty.webp',
} as const;
export type SceneId = keyof typeof SCENES;

export const ICONS = {
  flame: 'icons/flame.webp',
  coin: 'icons/coin.webp',
  bell: 'icons/bell.webp',
  bellDot: 'icons/bell-dot.png',
  giftBox: 'icons/gift-box.png',
  cookie: 'icons/cookie.webp',
  streakFace: 'icons/streak-face.png',
  hiddenPhoto: 'icons/hidden-photo.webp',
  appIconNino: 'icons/app-icon-nino.webp',
  appIconSuzie: 'icons/app-icon-suzie.webp',
} as const;
export type IconId = keyof typeof ICONS;

/** Œufs : seul Nino a un œuf dédié, les autres espèces utilisent l'œuf générique. */
export const EGGS: Readonly<Record<Species | 'SHARED' | 'CRACKING', string | null>> = {
  NINO: 'eggs/egg-nino.webp',
  GASTON: null,
  SUZIE: null,
  PIA: null,
  SHARED: 'eggs/egg-shared.webp',
  CRACKING: 'eggs/egg-cracking.webp',
};

/** Illustrations narratives hors matrice de poses (stade jeune). */
export const ILLUSTRATIONS = {
  NINO_WAVE: 'nino/young/wave.webp',
  NINO_PHONE: 'nino/young/phone.webp',
  NINO_SUITCASE: 'nino/young/suitcase.webp',
  HUG_NINO_SUZIE: 'hybrid/hug-nino-suzie.webp',
} as const;
export type IllustrationId = keyof typeof ILLUSTRATIONS;

/** Bébés hybrides préfabriqués (corps, détail) — P-5.17. */
export const HYBRID_BABIES: Readonly<Partial<Record<`${Species}_${Species}`, string>>> = {
  NINO_SUZIE: 'hybrid/baby-nino-suzie.webp',
};
