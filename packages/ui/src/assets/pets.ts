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

/**
 * Poses en corps entier du pack (toile 900×1000 commune, pieds sur la ligne y = 958) : `<espèce>_corps_<pose>.webp`.
 * Elles servent partout où le minimoa est montré en grand (scène de l'accueil, garde-robe, rencontre, défi, série) ;
 * les bustes restent pour les petites tailles (avatars, listes, badges). Toutes se remplacent l'une l'autre sans saut :
 * même échelle par espèce, même ligne de sol. L'habillage a ses ancres mesurées pour chacune (`fit.json` → `poses`).
 */
export const BODY_POSES = [
  'neutre', 'joie', 'triste', 'surpris', 'boude', 'dodo', 'mange', 'joue', 'marche', 'coucou', 'check', 'pense',
  // Planche 2 : colère, malade (plaid et thermomètre), timide, fier, rit, danse, bras ouverts, assis, bâille, bain
  // (bac et mousse), applaudit, fête (saut). Les bulles du bain et les confettis de la fête sont des particules (`PetActor`).
  'colere', 'malade', 'timide', 'fier', 'rit', 'danse', 'accueil', 'assis', 'baille', 'bain', 'applaudit', 'fete',
  // Variantes : les formes d'évolution en pied (`equilibre` = `neutre` ; mêmes fichiers que `petFormImage`), le bébé,
  // l'œuf, l'œuf fêlé, l'éclosion, le fantôme (lien à 0 vie) et « en danger » (lien à 1–2 vies, minimoa délaissé).
  'evo_sociable', 'evo_joueur', 'evo_casanier', 'evo_tendre', 'evo_piquant',
  'bebe', 'oeuf', 'oeuf_fele', 'eclosion', 'fantome', 'danger',
] as const;
export type BodyPose = (typeof BODY_POSES)[number];

const BODY_IMAGES: Record<Species, Record<BodyPose, Src>> = {
  nino: {
    neutre: require('../../assets/pets/nino_corps_neutre.webp'),
    joie: require('../../assets/pets/nino_corps_joie.webp'),
    triste: require('../../assets/pets/nino_corps_triste.webp'),
    surpris: require('../../assets/pets/nino_corps_surpris.webp'),
    boude: require('../../assets/pets/nino_corps_boude.webp'),
    dodo: require('../../assets/pets/nino_corps_dodo.webp'),
    mange: require('../../assets/pets/nino_corps_mange.webp'),
    joue: require('../../assets/pets/nino_corps_joue.webp'),
    marche: require('../../assets/pets/nino_corps_marche.webp'),
    coucou: require('../../assets/pets/nino_corps_coucou.webp'),
    check: require('../../assets/pets/nino_corps_check.webp'),
    pense: require('../../assets/pets/nino_corps_pense.webp'),
    colere: require('../../assets/pets/nino_corps_colere.webp'),
    malade: require('../../assets/pets/nino_corps_malade.webp'),
    timide: require('../../assets/pets/nino_corps_timide.webp'),
    fier: require('../../assets/pets/nino_corps_fier.webp'),
    rit: require('../../assets/pets/nino_corps_rit.webp'),
    danse: require('../../assets/pets/nino_corps_danse.webp'),
    accueil: require('../../assets/pets/nino_corps_accueil.webp'),
    assis: require('../../assets/pets/nino_corps_assis.webp'),
    baille: require('../../assets/pets/nino_corps_baille.webp'),
    bain: require('../../assets/pets/nino_corps_bain.webp'),
    applaudit: require('../../assets/pets/nino_corps_applaudit.webp'),
    fete: require('../../assets/pets/nino_corps_fete.webp'),
    evo_sociable: require('../../assets/pets/nino_evo_sociable.webp'),
    evo_joueur: require('../../assets/pets/nino_evo_joueur.webp'),
    evo_casanier: require('../../assets/pets/nino_evo_casanier.webp'),
    evo_tendre: require('../../assets/pets/nino_evo_tendre.webp'),
    evo_piquant: require('../../assets/pets/nino_evo_piquant.webp'),
    bebe: require('../../assets/pets/nino_corps_bebe.webp'),
    oeuf: require('../../assets/pets/nino_corps_oeuf.webp'),
    oeuf_fele: require('../../assets/pets/nino_corps_oeuf_fele.webp'),
    eclosion: require('../../assets/pets/nino_corps_eclosion.webp'),
    fantome: require('../../assets/pets/nino_corps_fantome.webp'),
    danger: require('../../assets/pets/nino_corps_danger.webp'),
  },
  suzie: {
    neutre: require('../../assets/pets/suzie_corps_neutre.webp'),
    joie: require('../../assets/pets/suzie_corps_joie.webp'),
    triste: require('../../assets/pets/suzie_corps_triste.webp'),
    surpris: require('../../assets/pets/suzie_corps_surpris.webp'),
    boude: require('../../assets/pets/suzie_corps_boude.webp'),
    dodo: require('../../assets/pets/suzie_corps_dodo.webp'),
    mange: require('../../assets/pets/suzie_corps_mange.webp'),
    joue: require('../../assets/pets/suzie_corps_joue.webp'),
    marche: require('../../assets/pets/suzie_corps_marche.webp'),
    coucou: require('../../assets/pets/suzie_corps_coucou.webp'),
    check: require('../../assets/pets/suzie_corps_check.webp'),
    pense: require('../../assets/pets/suzie_corps_pense.webp'),
    colere: require('../../assets/pets/suzie_corps_colere.webp'),
    malade: require('../../assets/pets/suzie_corps_malade.webp'),
    timide: require('../../assets/pets/suzie_corps_timide.webp'),
    fier: require('../../assets/pets/suzie_corps_fier.webp'),
    rit: require('../../assets/pets/suzie_corps_rit.webp'),
    danse: require('../../assets/pets/suzie_corps_danse.webp'),
    accueil: require('../../assets/pets/suzie_corps_accueil.webp'),
    assis: require('../../assets/pets/suzie_corps_assis.webp'),
    baille: require('../../assets/pets/suzie_corps_baille.webp'),
    bain: require('../../assets/pets/suzie_corps_bain.webp'),
    applaudit: require('../../assets/pets/suzie_corps_applaudit.webp'),
    fete: require('../../assets/pets/suzie_corps_fete.webp'),
    evo_sociable: require('../../assets/pets/suzie_evo_sociable.webp'),
    evo_joueur: require('../../assets/pets/suzie_evo_joueur.webp'),
    evo_casanier: require('../../assets/pets/suzie_evo_casanier.webp'),
    evo_tendre: require('../../assets/pets/suzie_evo_tendre.webp'),
    evo_piquant: require('../../assets/pets/suzie_evo_piquant.webp'),
    bebe: require('../../assets/pets/suzie_corps_bebe.webp'),
    oeuf: require('../../assets/pets/suzie_corps_oeuf.webp'),
    oeuf_fele: require('../../assets/pets/suzie_corps_oeuf_fele.webp'),
    eclosion: require('../../assets/pets/suzie_corps_eclosion.webp'),
    fantome: require('../../assets/pets/suzie_corps_fantome.webp'),
    danger: require('../../assets/pets/suzie_corps_danger.webp'),
  },
  gaston: {
    neutre: require('../../assets/pets/gaston_corps_neutre.webp'),
    joie: require('../../assets/pets/gaston_corps_joie.webp'),
    triste: require('../../assets/pets/gaston_corps_triste.webp'),
    surpris: require('../../assets/pets/gaston_corps_surpris.webp'),
    boude: require('../../assets/pets/gaston_corps_boude.webp'),
    dodo: require('../../assets/pets/gaston_corps_dodo.webp'),
    mange: require('../../assets/pets/gaston_corps_mange.webp'),
    joue: require('../../assets/pets/gaston_corps_joue.webp'),
    marche: require('../../assets/pets/gaston_corps_marche.webp'),
    coucou: require('../../assets/pets/gaston_corps_coucou.webp'),
    check: require('../../assets/pets/gaston_corps_check.webp'),
    pense: require('../../assets/pets/gaston_corps_pense.webp'),
    colere: require('../../assets/pets/gaston_corps_colere.webp'),
    malade: require('../../assets/pets/gaston_corps_malade.webp'),
    timide: require('../../assets/pets/gaston_corps_timide.webp'),
    fier: require('../../assets/pets/gaston_corps_fier.webp'),
    rit: require('../../assets/pets/gaston_corps_rit.webp'),
    danse: require('../../assets/pets/gaston_corps_danse.webp'),
    accueil: require('../../assets/pets/gaston_corps_accueil.webp'),
    assis: require('../../assets/pets/gaston_corps_assis.webp'),
    baille: require('../../assets/pets/gaston_corps_baille.webp'),
    bain: require('../../assets/pets/gaston_corps_bain.webp'),
    applaudit: require('../../assets/pets/gaston_corps_applaudit.webp'),
    fete: require('../../assets/pets/gaston_corps_fete.webp'),
    evo_sociable: require('../../assets/pets/gaston_evo_sociable.webp'),
    evo_joueur: require('../../assets/pets/gaston_evo_joueur.webp'),
    evo_casanier: require('../../assets/pets/gaston_evo_casanier.webp'),
    evo_tendre: require('../../assets/pets/gaston_evo_tendre.webp'),
    evo_piquant: require('../../assets/pets/gaston_evo_piquant.webp'),
    bebe: require('../../assets/pets/gaston_corps_bebe.webp'),
    oeuf: require('../../assets/pets/gaston_corps_oeuf.webp'),
    oeuf_fele: require('../../assets/pets/gaston_corps_oeuf_fele.webp'),
    eclosion: require('../../assets/pets/gaston_corps_eclosion.webp'),
    fantome: require('../../assets/pets/gaston_corps_fantome.webp'),
    danger: require('../../assets/pets/gaston_corps_danger.webp'),
  },
  pia: {
    neutre: require('../../assets/pets/pia_corps_neutre.webp'),
    joie: require('../../assets/pets/pia_corps_joie.webp'),
    triste: require('../../assets/pets/pia_corps_triste.webp'),
    surpris: require('../../assets/pets/pia_corps_surpris.webp'),
    boude: require('../../assets/pets/pia_corps_boude.webp'),
    dodo: require('../../assets/pets/pia_corps_dodo.webp'),
    mange: require('../../assets/pets/pia_corps_mange.webp'),
    joue: require('../../assets/pets/pia_corps_joue.webp'),
    marche: require('../../assets/pets/pia_corps_marche.webp'),
    coucou: require('../../assets/pets/pia_corps_coucou.webp'),
    check: require('../../assets/pets/pia_corps_check.webp'),
    pense: require('../../assets/pets/pia_corps_pense.webp'),
    colere: require('../../assets/pets/pia_corps_colere.webp'),
    malade: require('../../assets/pets/pia_corps_malade.webp'),
    timide: require('../../assets/pets/pia_corps_timide.webp'),
    fier: require('../../assets/pets/pia_corps_fier.webp'),
    rit: require('../../assets/pets/pia_corps_rit.webp'),
    danse: require('../../assets/pets/pia_corps_danse.webp'),
    accueil: require('../../assets/pets/pia_corps_accueil.webp'),
    assis: require('../../assets/pets/pia_corps_assis.webp'),
    baille: require('../../assets/pets/pia_corps_baille.webp'),
    bain: require('../../assets/pets/pia_corps_bain.webp'),
    applaudit: require('../../assets/pets/pia_corps_applaudit.webp'),
    fete: require('../../assets/pets/pia_corps_fete.webp'),
    evo_sociable: require('../../assets/pets/pia_evo_sociable.webp'),
    evo_joueur: require('../../assets/pets/pia_evo_joueur.webp'),
    evo_casanier: require('../../assets/pets/pia_evo_casanier.webp'),
    evo_tendre: require('../../assets/pets/pia_evo_tendre.webp'),
    evo_piquant: require('../../assets/pets/pia_evo_piquant.webp'),
    bebe: require('../../assets/pets/pia_corps_bebe.webp'),
    oeuf: require('../../assets/pets/pia_corps_oeuf.webp'),
    oeuf_fele: require('../../assets/pets/pia_corps_oeuf_fele.webp'),
    eclosion: require('../../assets/pets/pia_corps_eclosion.webp'),
    fantome: require('../../assets/pets/pia_corps_fantome.webp'),
    danger: require('../../assets/pets/pia_corps_danger.webp'),
  },
};

/** Pose en corps entier qui exprime une humeur ou une ancienne pose (`amour` → `joie`, `salut` → `coucou`…). */
const BODY_FOR: Record<PetPose, BodyPose> = {
  neutre: 'neutre',
  joie: 'joie',
  triste: 'triste',
  amour: 'joie',
  surpris: 'surpris',
  smug: 'pense',
  salut: 'coucou',
  colere: 'colere',
  dodo: 'dodo',
  fantome: 'triste',
  malade: 'malade',
  debout: 'neutre',
  trois_quarts: 'neutre',
  cote: 'marche',
  dos: 'neutre',
  face: 'neutre',
};

export const isBodyPose = (v: string): v is BodyPose => (BODY_POSES as readonly string[]).includes(v);

/** Pose du corps pour une humeur, une ancienne pose ou une pose du pack ; inconnue → `neutre`. */
export function bodyPoseFor(pose: string | null | undefined): BodyPose {
  if (!pose) return 'neutre';
  if (isBodyPose(pose)) return pose;
  return (BODY_FOR as Record<string, BodyPose>)[pose] ?? 'neutre';
}

/** Pose de repos en pied d'une forme d'évolution (`equilibre` : `neutre`). */
export const formBodyPose = (form: PetForm | null | undefined): BodyPose => (!form || form === 'equilibre' ? 'neutre' : (`evo_${form}` as BodyPose));

/** Image du minimoa en pied dans une pose du pack (ou l'équivalent d'une humeur). */
export const petBodyImage = (species: Species, pose: string = 'neutre'): Src => BODY_IMAGES[species][bodyPoseFor(pose)];

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

/** Haut et hauteur du dessin dans chaque forme d'évolution en pied (fractions de la hauteur, mesurées sur les fichiers) : sert à cadrer la tête. */
export const FORM_BOX: Record<Species, Record<PetForm, { top: number; height: number }>> = {
  nino: {
    equilibre: { top: 0.062, height: 0.894 },
    casanier: { top: 0.057, height: 0.899 },
    sociable: { top: 0.063, height: 0.893 },
    joueur: { top: 0.13, height: 0.826 },
    piquant: { top: 0.049, height: 0.907 },
    tendre: { top: 0.017, height: 0.939 },
  },
  suzie: {
    equilibre: { top: 0.062, height: 0.894 },
    casanier: { top: 0.062, height: 0.893 },
    sociable: { top: 0.066, height: 0.89 },
    joueur: { top: 0.101, height: 0.854 },
    piquant: { top: 0.05, height: 0.906 },
    tendre: { top: 0.022, height: 0.934 },
  },
  gaston: {
    equilibre: { top: 0.186, height: 0.77 },
    casanier: { top: 0.159, height: 0.797 },
    sociable: { top: 0.139, height: 0.817 },
    joueur: { top: 0.232, height: 0.724 },
    piquant: { top: 0.121, height: 0.835 },
    tendre: { top: 0.129, height: 0.827 },
  },
  pia: {
    equilibre: { top: 0.224, height: 0.732 },
    casanier: { top: 0.194, height: 0.761 },
    sociable: { top: 0.199, height: 0.757 },
    joueur: { top: 0.272, height: 0.685 },
    piquant: { top: 0.159, height: 0.797 },
    tendre: { top: 0.165, height: 0.792 },
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
