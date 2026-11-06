/**
 * Art des pets V5 (pur, testé) : espèce + humeur → chemin de sprite du manifest @blowy/sprites.
 * Les 4 espèces du domaine (D-010) ; « Lutin » (5ᵉ espèce des maquettes V5) n'existe pas dans
 * `@blowy/domain` : affiché dans le choix comme « bientôt », jamais envoyé à l'API.
 */
import type { Species } from '@blowy/domain';

export type PetMood =
  | 'presentation'
  | 'joyful'
  | 'leap'
  | 'dance'
  | 'proud'
  | 'affectionate'
  | 'wave'
  | 'sad'
  | 'asleep'
  | 'surprised'
  | 'phone'
  | 'suitcase';

const DIR: Record<Species, string> = { NINO: 'nino', SUZIE: 'suzie', GASTON: 'gaston', PIA: 'pia' };

/** Poses réellement dessinées par espèce (les autres retombent sur `presentation`). */
const AVAILABLE: Record<Species, readonly PetMood[]> = {
  NINO: [
    'presentation',
    'joyful',
    'leap',
    'dance',
    'proud',
    'affectionate',
    'wave',
    'sad',
    'asleep',
    'surprised',
    'phone',
    'suitcase',
  ],
  SUZIE: ['presentation', 'joyful', 'leap', 'proud', 'affectionate'],
  GASTON: ['presentation', 'joyful', 'leap'],
  PIA: ['presentation', 'joyful', 'leap', 'proud'],
};

export function petSprite(species: Species, mood: PetMood = 'presentation'): string {
  const m = AVAILABLE[species].includes(mood)
    ? mood
    : mood === 'dance' && AVAILABLE[species].includes('leap')
      ? 'leap'
      : 'presentation';
  return `${DIR[species]}/young/${m}.webp`;
}

/** Choix d'espèce de l'onboarding V5 (ordre des maquettes). */
export const SPECIES_CHOICES: readonly {
  key: Species | 'LUTIN';
  sprite: string;
  available: boolean;
}[] = [
  { key: 'NINO', sprite: 'nino/young/presentation.webp', available: true },
  { key: 'SUZIE', sprite: 'suzie/young/presentation.webp', available: true },
  { key: 'GASTON', sprite: 'gaston/young/presentation.webp', available: true },
  { key: 'PIA', sprite: 'pia/young/joyful.webp', available: true },
  { key: 'LUTIN', sprite: 'lutin/young/presentation.png', available: false },
];

/** Fond de vignette par espèce (maquettes : Tom #FFE1C2, duo #FDE6EE…). */
export const SPECIES_TILE: Record<Species, string> = {
  NINO: 'lime',
  SUZIE: 'rosePale',
  GASTON: 'peach',
  PIA: 'violetPale',
};

/** Pet d'une autre personne (groupe, chat, visages) : pose « joyeuse » des maquettes, le mien reste en présentation. */
export const otherPetSprite = (species: Species): string => petSprite(species, 'joyful');
