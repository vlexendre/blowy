/**
 * Registre typé des images de pets (packages/ui/assets/pets/*.webp).
 * Metro exige des chemins littéraux : chaque `require` est écrit en dur.
 * Chaque espèce a le même jeu : bustes d'humeur, corps entier (debout, trois_quarts, cote, dos),
 * visage carré (face), fantôme, malade, et une image par forme d'évolution.
 */
import type { Mood, PetForm, Species } from '@blowy/domain';

/** Module d'asset Metro (`require` statique). */
export type Src = number;

/** Poses d'illustration en plus des 7 humeurs du domaine. */
export const PET_POSES = ['colere', 'dodo', 'fantome', 'malade', 'debout', 'trois_quarts', 'cote', 'dos', 'face'] as const;
export type PetPose = Mood | (typeof PET_POSES)[number];

/** Corps entiers (grands affichages : héros, choix du pet). Les autres poses sont des bustes. */
export const FULL_BODY_POSES = ['debout', 'trois_quarts', 'cote', 'dos'] as const satisfies readonly PetPose[];
export type FullBodyPose = (typeof FULL_BODY_POSES)[number];

const SPECIES_IMAGES: Record<Species, Record<PetPose, Src>> = {
  nino: {
    neutre: require('../../assets/pets/nino_neutre.webp'),
    joie: require('../../assets/pets/nino_joie.webp'),
    triste: require('../../assets/pets/nino_triste.webp'),
    amour: require('../../assets/pets/nino_amour.webp'),
    surpris: require('../../assets/pets/nino_surpris.webp'),
    smug: require('../../assets/pets/nino_smug.webp'),
    salut: require('../../assets/pets/nino_salut.webp'),
    colere: require('../../assets/pets/nino_colere.webp'),
    dodo: require('../../assets/pets/nino_dodo.webp'),
    fantome: require('../../assets/pets/nino_fantome.webp'),
    malade: require('../../assets/pets/nino_malade.webp'),
    debout: require('../../assets/pets/nino_debout.webp'),
    trois_quarts: require('../../assets/pets/nino_trois_quarts.webp'),
    cote: require('../../assets/pets/nino_cote.webp'),
    dos: require('../../assets/pets/nino_dos.webp'),
    face: require('../../assets/pets/nino_face.webp'),
  },
  suzie: {
    neutre: require('../../assets/pets/suzie_neutre.webp'),
    joie: require('../../assets/pets/suzie_joie.webp'),
    triste: require('../../assets/pets/suzie_triste.webp'),
    amour: require('../../assets/pets/suzie_amour.webp'),
    surpris: require('../../assets/pets/suzie_surpris.webp'),
    smug: require('../../assets/pets/suzie_smug.webp'),
    salut: require('../../assets/pets/suzie_salut.webp'),
    colere: require('../../assets/pets/suzie_colere.webp'),
    dodo: require('../../assets/pets/suzie_dodo.webp'),
    fantome: require('../../assets/pets/suzie_fantome.webp'),
    malade: require('../../assets/pets/suzie_malade.webp'),
    debout: require('../../assets/pets/suzie_debout.webp'),
    trois_quarts: require('../../assets/pets/suzie_trois_quarts.webp'),
    cote: require('../../assets/pets/suzie_cote.webp'),
    dos: require('../../assets/pets/suzie_dos.webp'),
    face: require('../../assets/pets/suzie_face.webp'),
  },
  gaston: {
    neutre: require('../../assets/pets/gaston_neutre.webp'),
    joie: require('../../assets/pets/gaston_joie.webp'),
    triste: require('../../assets/pets/gaston_triste.webp'),
    amour: require('../../assets/pets/gaston_amour.webp'),
    surpris: require('../../assets/pets/gaston_surpris.webp'),
    smug: require('../../assets/pets/gaston_smug.webp'),
    salut: require('../../assets/pets/gaston_salut.webp'),
    colere: require('../../assets/pets/gaston_colere.webp'),
    dodo: require('../../assets/pets/gaston_dodo.webp'),
    fantome: require('../../assets/pets/gaston_fantome.webp'),
    malade: require('../../assets/pets/gaston_malade.webp'),
    debout: require('../../assets/pets/gaston_debout.webp'),
    trois_quarts: require('../../assets/pets/gaston_trois_quarts.webp'),
    cote: require('../../assets/pets/gaston_cote.webp'),
    dos: require('../../assets/pets/gaston_dos.webp'),
    face: require('../../assets/pets/gaston_face.webp'),
  },
  pia: {
    neutre: require('../../assets/pets/pia_neutre.webp'),
    joie: require('../../assets/pets/pia_joie.webp'),
    triste: require('../../assets/pets/pia_triste.webp'),
    amour: require('../../assets/pets/pia_amour.webp'),
    surpris: require('../../assets/pets/pia_surpris.webp'),
    smug: require('../../assets/pets/pia_smug.webp'),
    salut: require('../../assets/pets/pia_salut.webp'),
    colere: require('../../assets/pets/pia_colere.webp'),
    dodo: require('../../assets/pets/pia_dodo.webp'),
    fantome: require('../../assets/pets/pia_fantome.webp'),
    malade: require('../../assets/pets/pia_malade.webp'),
    debout: require('../../assets/pets/pia_debout.webp'),
    trois_quarts: require('../../assets/pets/pia_trois_quarts.webp'),
    cote: require('../../assets/pets/pia_cote.webp'),
    dos: require('../../assets/pets/pia_dos.webp'),
    face: require('../../assets/pets/pia_face.webp'),
  },
};

const FORM_IMAGES: Record<Species, Record<PetForm, Src>> = {
  nino: {
    equilibre: require('../../assets/pets/nino_evo_equilibre.webp'),
    casanier: require('../../assets/pets/nino_evo_casanier.webp'),
    sociable: require('../../assets/pets/nino_evo_sociable.webp'),
    joueur: require('../../assets/pets/nino_evo_joueur.webp'),
    piquant: require('../../assets/pets/nino_evo_piquant.webp'),
    tendre: require('../../assets/pets/nino_evo_tendre.webp'),
  },
  suzie: {
    equilibre: require('../../assets/pets/suzie_evo_equilibre.webp'),
    casanier: require('../../assets/pets/suzie_evo_casanier.webp'),
    sociable: require('../../assets/pets/suzie_evo_sociable.webp'),
    joueur: require('../../assets/pets/suzie_evo_joueur.webp'),
    piquant: require('../../assets/pets/suzie_evo_piquant.webp'),
    tendre: require('../../assets/pets/suzie_evo_tendre.webp'),
  },
  gaston: {
    equilibre: require('../../assets/pets/gaston_evo_equilibre.webp'),
    casanier: require('../../assets/pets/gaston_evo_casanier.webp'),
    sociable: require('../../assets/pets/gaston_evo_sociable.webp'),
    joueur: require('../../assets/pets/gaston_evo_joueur.webp'),
    piquant: require('../../assets/pets/gaston_evo_piquant.webp'),
    tendre: require('../../assets/pets/gaston_evo_tendre.webp'),
  },
  pia: {
    equilibre: require('../../assets/pets/pia_evo_equilibre.webp'),
    casanier: require('../../assets/pets/pia_evo_casanier.webp'),
    sociable: require('../../assets/pets/pia_evo_sociable.webp'),
    joueur: require('../../assets/pets/pia_evo_joueur.webp'),
    piquant: require('../../assets/pets/pia_evo_piquant.webp'),
    tendre: require('../../assets/pets/pia_evo_tendre.webp'),
  },
};

/** Images de traits propres à certaines espèces. */
export const PET_TRAITS = ['douce', 'pose', 'calme', 'bavard'] as const;
export type PetTrait = (typeof PET_TRAITS)[number];
const TRAIT_IMAGES: Record<Species, Partial<Record<PetTrait, Src>>> = {
  nino: {},
  suzie: { douce: require('../../assets/pets/suzie_douce.webp') },
  gaston: { pose: require('../../assets/pets/gaston_pose.webp'), calme: require('../../assets/pets/gaston_calme.webp') },
  pia: { bavard: require('../../assets/pets/pia_bavard.webp') },
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

const isPose = (v: string): v is PetPose => v in SPECIES_IMAGES.nino;

/** Image d'une espèce dans une humeur ou une pose ; valeur inconnue → `neutre`. */
export function petImage(species: Species, pose: PetPose | string = 'neutre'): Src {
  const set = SPECIES_IMAGES[species];
  return isPose(pose) ? set[pose] : set.neutre;
}

/** Vrai si la pose est un corps entier (à réserver aux grands affichages). */
export const isFullBody = (pose: PetPose): pose is FullBodyPose => (FULL_BODY_POSES as readonly string[]).includes(pose);

/** Image d'une forme d'évolution pour une espèce. */
export const petFormImage = (species: Species, form: PetForm): Src => FORM_IMAGES[species][form];

/** Haut et hauteur du dessin dans chaque image d'évolution (fractions de la hauteur, mesurées sur les fichiers) : sert à cadrer la tête. */
export const FORM_BOX: Record<Species, Record<PetForm, { top: number; height: number }>> = {
  nino: {
    equilibre: { top: 0.06, height: 0.9 },
    casanier: { top: 0.193, height: 0.613 },
    sociable: { top: 0.258, height: 0.702 },
    joueur: { top: 0.168, height: 0.792 },
    piquant: { top: 0.183, height: 0.634 },
    tendre: { top: 0.12, height: 0.76 },
  },
  suzie: {
    equilibre: { top: 0.06, height: 0.9 },
    casanier: { top: 0.173, height: 0.654 },
    sociable: { top: 0.266, height: 0.694 },
    joueur: { top: 0.149, height: 0.701 },
    piquant: { top: 0.173, height: 0.654 },
    tendre: { top: 0.12, height: 0.76 },
  },
  gaston: {
    equilibre: { top: 0.193, height: 0.767 },
    casanier: { top: 0.479, height: 0.481 },
    sociable: { top: 0.17, height: 0.66 },
    joueur: { top: 0.157, height: 0.686 },
    piquant: { top: 0.165, height: 0.67 },
    tendre: { top: 0.162, height: 0.676 },
  },
  pia: {
    equilibre: { top: 0.274, height: 0.686 },
    casanier: { top: 0.201, height: 0.598 },
    sociable: { top: 0.192, height: 0.616 },
    joueur: { top: 0.249, height: 0.711 },
    piquant: { top: 0.149, height: 0.701 },
    tendre: { top: 0.162, height: 0.676 },
  },
};

/** Image d'un trait propre à l'espèce (suzie douce, gaston posé / calme, pia bavarde), sinon `undefined`. */
export const petTraitImage = (species: Species, trait: PetTrait): Src | undefined => TRAIT_IMAGES[species][trait];

/** Pet de l'écran de création, par couleur. */
export const craftImage = (colour: CraftColour): Src => CRAFT_IMAGES[colour];

/** Icônes 3D (ic_*). */
export const iconImage = (name: IconName): Src => ICON_IMAGES[name];

export const artImage = (name: ArtName): Src => ART_IMAGES[name];

/** Rapport largeur / hauteur : 900×1000 pour les pets, 1:1 pour les visages et icônes. */
export const RENDER_RATIO = 0.9;
export const ART_RATIO: Record<ArtName, number> = { oeuf: 0.9, bebe: 0.9, bande: 2.2, duo_gaston_pia: 1.3636, duo_nino_suzie: 1.3636 };
