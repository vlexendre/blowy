/**
 * Registre typé des images de pets (packages/ui/assets/pets/*.webp).
 * Metro exige des chemins littéraux : chaque `require` est écrit en dur.
 */
import type { Mood, PetForm, Species } from '@blowy/domain';

/** Module d'asset Metro (`require` statique). */
export type Src = number;

/** Humeurs du domaine + poses d'illustration (face = visage carré pour les avatars, cote = profil). */
export type PetPose = Mood | 'face' | 'cote' | 'colere' | 'dodo' | 'malade' | 'fantome';

const SPECIES_IMAGES: Record<Species, Partial<Record<PetPose, Src>>> = {
  nino: {
    neutre: require('../../assets/pets/nino_neutre.webp'),
    joie: require('../../assets/pets/nino_joie.webp'),
    triste: require('../../assets/pets/nino_triste.webp'),
    amour: require('../../assets/pets/nino_amour.webp'),
    surpris: require('../../assets/pets/nino_surpris.webp'),
    smug: require('../../assets/pets/nino_smug.webp'),
    salut: require('../../assets/pets/nino_salut.webp'),
    face: require('../../assets/pets/nino_face.webp'),
    cote: require('../../assets/pets/nino_cote.webp'),
    colere: require('../../assets/pets/nino_colere.webp'),
    dodo: require('../../assets/pets/nino_dodo.webp'),
    malade: require('../../assets/pets/nino_malade.webp'),
    fantome: require('../../assets/pets/nino_fantome.webp'),
  },
  suzie: {
    neutre: require('../../assets/pets/suzie_neutre.webp'),
    joie: require('../../assets/pets/suzie_joie.webp'),
    triste: require('../../assets/pets/suzie_triste.webp'),
    amour: require('../../assets/pets/suzie_amour.webp'),
    surpris: require('../../assets/pets/suzie_surpris.webp'),
    smug: require('../../assets/pets/suzie_smug.webp'),
    salut: require('../../assets/pets/suzie_salut.webp'),
    face: require('../../assets/pets/suzie_face.webp'),
    cote: require('../../assets/pets/suzie_cote.webp'),
  },
  gaston: {
    neutre: require('../../assets/pets/gaston_neutre.webp'),
    joie: require('../../assets/pets/gaston_joie.webp'),
    triste: require('../../assets/pets/gaston_triste.webp'),
    amour: require('../../assets/pets/gaston_amour.webp'),
    surpris: require('../../assets/pets/gaston_surpris.webp'),
    smug: require('../../assets/pets/gaston_smug.webp'),
    salut: require('../../assets/pets/gaston_salut.webp'),
    face: require('../../assets/pets/gaston_face.webp'),
    cote: require('../../assets/pets/gaston_cote.webp'),
  },
  pia: {
    neutre: require('../../assets/pets/pia_neutre.webp'),
    joie: require('../../assets/pets/pia_joie.webp'),
    triste: require('../../assets/pets/pia_triste.webp'),
    amour: require('../../assets/pets/pia_amour.webp'),
    surpris: require('../../assets/pets/pia_surpris.webp'),
    smug: require('../../assets/pets/pia_smug.webp'),
    salut: require('../../assets/pets/pia_salut.webp'),
    face: require('../../assets/pets/pia_face.webp'),
    cote: require('../../assets/pets/pia_cote.webp'),
  },
};

const FORM_IMAGES: Record<PetForm, Src> = {
  equilibre: require('../../assets/pets/nino_evo_equilibre.webp'),
  casanier: require('../../assets/pets/nino_evo_casanier.webp'),
  sociable: require('../../assets/pets/nino_evo_sociable.webp'),
  joueur: require('../../assets/pets/nino_evo_joueur.webp'),
  piquant: require('../../assets/pets/nino_evo_piquant.webp'),
  tendre: require('../../assets/pets/nino_evo_tendre.webp'),
};

export const CRAFT_COLOURS = ['corail', 'lime', 'menthe', 'orange', 'rose', 'violet'] as const;
export type CraftColour = (typeof CRAFT_COLOURS)[number];
const CRAFT_IMAGES: Record<CraftColour, Src> = {
  corail: require('../../assets/pets/craft_corail.webp'),
  lime: require('../../assets/pets/craft_lime.webp'),
  menthe: require('../../assets/pets/craft_menthe.webp'),
  orange: require('../../assets/pets/craft_orange.webp'),
  rose: require('../../assets/pets/craft_rose.webp'),
  violet: require('../../assets/pets/craft_violet.webp'),
};

export const ICON_NAMES = ['balle', 'cadeau', 'coeurs', 'confettis', 'eclair', 'etoiles', 'flamme', 'gel', 'piece'] as const;
export type IconName = (typeof ICON_NAMES)[number];
const ICON_IMAGES: Record<IconName, Src> = {
  balle: require('../../assets/pets/ic_balle.webp'),
  cadeau: require('../../assets/pets/ic_cadeau.webp'),
  coeurs: require('../../assets/pets/ic_coeurs.webp'),
  confettis: require('../../assets/pets/ic_confettis.webp'),
  eclair: require('../../assets/pets/ic_eclair.webp'),
  etoiles: require('../../assets/pets/ic_etoiles.webp'),
  flamme: require('../../assets/pets/ic_flamme.webp'),
  gel: require('../../assets/pets/ic_gel.webp'),
  piece: require('../../assets/pets/ic_piece.webp'),
};

/** Illustrations hors espèce : œuf, bébé, la bande, duos. */
export const ART_NAMES = ['oeuf', 'bebe', 'bande', 'duo_gaston_pia', 'duo_nino_suzie'] as const;
export type ArtName = (typeof ART_NAMES)[number];
const ART_IMAGES: Record<ArtName, Src> = {
  oeuf: require('../../assets/pets/oeuf.webp'),
  bebe: require('../../assets/pets/bebe.webp'),
  bande: require('../../assets/pets/bande.webp'),
  duo_gaston_pia: require('../../assets/pets/duo_gaston_pia.webp'),
  duo_nino_suzie: require('../../assets/pets/duo_nino_suzie.webp'),
};

/** Image d'une espèce dans une pose ; pose absente → `fantome` générique (Nino) ou `neutre`. */
export function petImage(species: Species, pose: PetPose = 'neutre'): Src {
  const set = SPECIES_IMAGES[species];
  const found = set[pose];
  if (found) return found;
  if (pose === 'fantome') return SPECIES_IMAGES.nino.fantome ?? SPECIES_IMAGES.nino.neutre ?? FORM_IMAGES.equilibre;
  return set.neutre ?? FORM_IMAGES.equilibre;
}

/** Vrai si l'espèce possède réellement cette pose (sans repli). */
export const hasPetPose = (species: Species, pose: PetPose): boolean => SPECIES_IMAGES[species][pose] !== undefined;

/** Image d'une forme d'évolution (rendus disponibles pour Nino). */
export const petFormImage = (form: PetForm): Src => FORM_IMAGES[form];

/** Pet de l'écran de création, par couleur. */
export const craftImage = (colour: CraftColour): Src => CRAFT_IMAGES[colour];

/** Icônes 3D (ic_*). */
export const iconImage = (name: IconName): Src => ICON_IMAGES[name];

export const artImage = (name: ArtName): Src => ART_IMAGES[name];

/** Rapport largeur / hauteur des rendus : 900×1000 pour les pets, 1:1 pour visages et icônes. */
export const RENDER_RATIO = 0.9;
export const ART_RATIO: Record<ArtName, number> = { oeuf: 0.9, bebe: 0.9, bande: 2.2, duo_gaston_pia: 1.3636, duo_nino_suzie: 1.3636 };
