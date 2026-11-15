/** Monde de démonstration (mode mémoire, BLOWY_DEMO=1) : huit personnes fixes, leurs minimoas, leur vision et leur zone. */
import type { Gauges, Gender, GeoPoint, Needs, Outfit, Seeking, Species, VisionAxis, Whom } from '@blowy/domain';

export const DEMO_LEA = '00000000-0000-4000-8000-00000000000a';
export const DEMO_MALO = '00000000-0000-4000-8000-00000000000b';
export const DEMO_SASHA = '00000000-0000-4000-8000-00000000000c';
export const DEMO_INES = '00000000-0000-4000-8000-00000000000d';
export const DEMO_YANIS = '00000000-0000-4000-8000-00000000000e';
export const DEMO_CHLOE = '00000000-0000-4000-8000-00000000000f';
export const DEMO_NOE = '00000000-0000-4000-8000-000000000010';
export const DEMO_JADE = '00000000-0000-4000-8000-000000000011';

export interface DemoPerson {
  id: string;
  displayName: string;
  birthdate: string;
  /** Qui la personne est et ce qu'elle cherche (vision). */
  identity: { gender: Gender; seeking: Seeking; whom: Whom | null; discreet: boolean };
  /** Zone du domicile (null : pas de position, donc ni carte ni rencontres proches). */
  place: GeoPoint | null;
  /** Vision posée au démarrage (réponses de test et questions du jour sur chaque axe). */
  vision: Record<VisionAxis, number>;
  inviteCode: string;
  wordsCode: string;
  pet: { name: string; species: Species; gauges: Gauges };
  /** Besoins remis à ces valeurs au démarrage et à chaque inscription (le monde de démo reste vivant). */
  needs: Needs;
  /** Tenue portée ; ses objets sont offerts au pet (en plus de ceux de départ). */
  outfit: Outfit;
}

export const DEMO_PEOPLE: readonly DemoPerson[] = [
  {
    id: DEMO_LEA,
    displayName: 'Léa',
    birthdate: '1998-04-12',
    identity: { gender: 'femme', seeking: 'les_deux', whom: 'tout_le_monde', discreet: false },
    place: { lat: 48.861, lng: 2.379 },
    vision: { foyer: 40, ancrage: -30, elan: 30, rythme: 40, cap: 30 },
    inviteCode: 'LEADEMO2',
    wordsCode: 'LEAMOTS2',
    pet: { name: 'Suzie', species: 'suzie', gauges: { social: 40, play: 20, tender: 30, talk: 10 } },
    needs: { hunger: 90, energy: 85, mood: 95, sociability: 85 },
    outfit: { head: 'noeud', face: 'lunettes_coeur' },
  },
  {
    id: DEMO_MALO,
    displayName: 'Malo',
    birthdate: '1996-09-30',
    identity: { gender: 'homme', seeking: 'potes', whom: null, discreet: false },
    place: { lat: 45.764, lng: 4.8357 },
    vision: { foyer: -20, ancrage: 60, elan: 70, rythme: 50, cap: -30 },
    inviteCode: 'MALODEMO',
    wordsCode: 'MALOMOTS',
    pet: { name: 'Gaston', species: 'gaston', gauges: { social: -10, play: 55, tender: -20, talk: 35 } },
    needs: { hunger: 35, energy: 70, mood: 60, sociability: 55 },
    outfit: { head: 'casquette', body: 'echarpe' },
  },
  {
    id: DEMO_SASHA,
    displayName: 'Sasha',
    birthdate: '2000-01-21',
    identity: { gender: 'non_binaire', seeking: 'potes', whom: null, discreet: false },
    place: { lat: 48.853, lng: 2.349 },
    vision: { foyer: 0, ancrage: 10, elan: -30, rythme: -50, cap: 20 },
    inviteCode: 'SASHADEM',
    wordsCode: 'SASHAMOT',
    pet: { name: 'Pia', species: 'pia', gauges: { social: -35, play: -10, tender: 45, talk: -25 } },
    needs: { hunger: 70, energy: 95, mood: 75, sociability: 70 },
    outfit: { head: 'cornes', toy: 'skate' },
  },
  // Visions variées autour de Paris : certaines proches d'un projet « foyer, ici, calme, prévoyant », d'autres opposées.
  {
    id: DEMO_INES,
    displayName: 'Inès',
    birthdate: '1994-06-02',
    identity: { gender: 'femme', seeking: 'potes', whom: null, discreet: false },
    place: { lat: 48.859, lng: 2.37 },
    vision: { foyer: 70, ancrage: -40, elan: 20, rythme: -30, cap: 60 },
    inviteCode: 'INESDEMO',
    wordsCode: 'INESMOTS',
    pet: { name: 'Mona', species: 'suzie', gauges: { social: 15, play: -10, tender: 40, talk: 20 } },
    needs: { hunger: 80, energy: 80, mood: 85, sociability: 75 },
    outfit: {},
  },
  {
    id: DEMO_YANIS,
    displayName: 'Yanis',
    birthdate: '1992-02-17',
    identity: { gender: 'homme', seeking: 'les_deux', whom: 'tout_le_monde', discreet: false },
    place: { lat: 48.872, lng: 2.36 },
    vision: { foyer: 60, ancrage: -20, elan: 40, rythme: -10, cap: 50 },
    inviteCode: 'YANISDEM',
    wordsCode: 'YANISMOT',
    pet: { name: 'Basile', species: 'gaston', gauges: { social: 30, play: 35, tender: 0, talk: -10 } },
    needs: { hunger: 85, energy: 75, mood: 80, sociability: 70 },
    outfit: {},
  },
  {
    id: DEMO_CHLOE,
    displayName: 'Chloé',
    birthdate: '1999-11-08',
    identity: { gender: 'femme', seeking: 'plus', whom: 'hommes', discreet: false },
    place: { lat: 48.854, lng: 2.357 },
    vision: { foyer: -70, ancrage: 70, elan: 60, rythme: 70, cap: -60 },
    inviteCode: 'CHLOEDEM',
    wordsCode: 'CHLOEMOT',
    pet: { name: 'Olga', species: 'pia', gauges: { social: 60, play: 50, tender: -10, talk: 45 } },
    needs: { hunger: 75, energy: 90, mood: 80, sociability: 85 },
    outfit: {},
  },
  {
    id: DEMO_NOE,
    displayName: 'Noé',
    birthdate: '1990-08-23',
    identity: { gender: 'homme', seeking: 'potes', whom: null, discreet: false },
    place: { lat: 48.8638, lng: 2.4485 },
    vision: { foyer: 50, ancrage: -50, elan: 0, rythme: -40, cap: 40 },
    inviteCode: 'NOEDEMO2',
    wordsCode: 'NOEMOTS2',
    pet: { name: 'Plume', species: 'nino', gauges: { social: -20, play: 10, tender: 30, talk: -15 } },
    needs: { hunger: 70, energy: 85, mood: 75, sociability: 60 },
    outfit: {},
  },
  {
    id: DEMO_JADE,
    displayName: 'Jade',
    birthdate: '1997-03-14',
    // Mode discret : proposée en rencontre si compatible, jamais sur la carte.
    identity: { gender: 'femme', seeking: 'les_deux', whom: 'femmes', discreet: true },
    place: { lat: 48.8397, lng: 2.2399 },
    vision: { foyer: -50, ancrage: 60, elan: 50, rythme: 60, cap: -40 },
    inviteCode: 'JADEDEMO',
    wordsCode: 'JADEMOTS',
    pet: { name: 'Ziggy', species: 'nino', gauges: { social: 45, play: 25, tender: 10, talk: 30 } },
    needs: { hunger: 80, energy: 80, mood: 90, sociability: 80 },
    outfit: {},
  },
];

/** Messages de Malo à la personne qui arrive. */
export const DEMO_MALO_MESSAGES: readonly { body: string; tone?: 'sweet' | 'tease' }[] = [
  { body: 'Salut ! Gaston n’arrêtait pas de parler de ton minimoa.' },
  { body: 'Il paraît que ton minimoa est très bien élevé. J’ai des doutes.', tone: 'tease' },
  { body: 'Photo du jour ce soir ? Ça nous rend une vie.' },
];
