import { type Gauges, dominantTrait } from './gauges';

/** Espèces disponibles à la création : chacune a sa couleur et son jeu d'images. */
export const SPECIES = ['nino', 'suzie', 'gaston', 'pia'] as const;
export type Species = (typeof SPECIES)[number];

export const MOODS = ['neutre', 'joie', 'triste', 'amour', 'surpris', 'smug', 'salut'] as const;
export type Mood = (typeof MOODS)[number];

/** Forme du pet selon son trait dominant (trois crans visuels par pôle à terme). */
export type PetForm = 'equilibre' | 'casanier' | 'sociable' | 'joueur' | 'piquant' | 'tendre';

export function formOf(g: Gauges): PetForm {
  const t = dominantTrait(g);
  switch (t?.pole) {
    case 'casanier':
    case 'sociable':
    case 'joueur':
    case 'piquant':
    case 'tendre':
      return t.pole;
    default:
      return 'equilibre';
  }
}

/** Humeur affichée dans un lien selon ses vies. */
export function moodForLives(lives: number): Mood {
  if (lives >= 6) return 'joie';
  if (lives >= 3) return 'neutre';
  return 'triste';
}

export const PET_NAME_MAX = 14;
export const cleanPetName = (raw: string): string => raw.replace(/\s+/g, ' ').trim().slice(0, PET_NAME_MAX);
