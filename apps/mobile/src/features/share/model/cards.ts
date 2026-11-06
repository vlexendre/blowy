/**
 * Cartes de partage V5 (pur, testé). Règle commune : jamais de visage, de prénom ni de pet d'une
 * autre personne (V5.4 §D20 : « Partager Nino » ne montre que mon pet). Seuls des comptes
 * agrégés sur MA sortie (taille du groupe, nouvelles personnes) apparaissent.
 */
export type ShareCardKind =
  'invitation' | 'confirmation' | 'checkin' | 'jeudi' | 'soiree' | 'dimanche' | 'bande' | 'ville';

export interface ShareStyle {
  gradient: string;
  dot: string;
  titleSize: number;
  ink?: boolean;
  darkTag?: boolean;
  ctaColor?: string;
  /** Actions proposées : l'invitation est personnelle (message seulement, jamais en story). */
  actions: readonly ('story' | 'message' | 'save' | 'textLink' | 'copy')[];
}

export const SHARE_STYLES: Record<ShareCardKind, ShareStyle> = {
  invitation: {
    gradient: 'linear-gradient(170deg, #FFF7EC, #FFE1C2 90%)',
    dot: '#C4341B',
    titleSize: 40,
    ink: true,
    darkTag: true,
    ctaColor: '#C8F542',
    actions: ['message', 'textLink'],
  },
  confirmation: {
    gradient: 'linear-gradient(170deg, #16110D, #2E1065 70%)',
    dot: '#C8F542',
    titleSize: 30,
    actions: ['story', 'message', 'save', 'textLink'],
  },
  checkin: {
    gradient: 'linear-gradient(170deg, #0E5E5A, #16110D 90%)',
    dot: '#FF8A3C',
    titleSize: 50,
    actions: ['story', 'message', 'save', 'textLink'],
  },
  jeudi: {
    gradient: 'linear-gradient(170deg, #FFE36E, #FFB347 90%)',
    dot: '#FF5A3C',
    titleSize: 48,
    ink: true,
    darkTag: true,
    ctaColor: '#C8F542',
    actions: ['story', 'message', 'save', 'textLink'],
  },
  bande: {
    gradient: 'linear-gradient(170deg, #BFE8F7, #DDF5EA 90%)',
    dot: '#FF5A3C',
    titleSize: 48,
    ink: true,
    darkTag: true,
    ctaColor: '#C8F542',
    actions: ['story', 'message', 'save', 'textLink'],
  },
  soiree: {
    gradient: 'linear-gradient(170deg, #C2185B, #C4341B 60%, #FF8A3C)',
    dot: '#FFE36E',
    titleSize: 50,
    actions: ['story', 'message', 'save', 'textLink'],
  },
  dimanche: {
    gradient: 'linear-gradient(170deg, #1E7A47, #3F5A0B 80%)',
    dot: '#C8F542',
    titleSize: 40,
    actions: ['story', 'message', 'save', 'textLink'],
  },
  ville: {
    gradient: 'linear-gradient(170deg, #0E4C6E, #1C7DB0 80%)',
    dot: '#9FE3F5',
    titleSize: 40,
    actions: ['story', 'message', 'save', 'textLink'],
  },
};

export const isShareCard = (s: string | undefined): s is ShareCardKind => !!s && s in SHARE_STYLES;

/** Nouvelles personnes de MA sortie : taille − moi − ma team (jamais négatif). */
export function newPeopleCount(size: number, teamMates: number): number {
  return Math.max(0, size - 1 - teamMates);
}

/** « Citer le lieu : possible à partir de… » : 12 h après la fin de la sortie. */
export function venueCitableAt(endsAtIso: string): number {
  return Date.parse(endsAtIso) + 12 * 3600_000;
}
