/** Monde de démonstration (mode mémoire, BLOWY_DEMO=1) : trois personnes fixes et leurs pets. */
import type { Gauges, Species } from '@blowy/domain';

export const DEMO_LEA = '00000000-0000-4000-8000-00000000000a';
export const DEMO_MALO = '00000000-0000-4000-8000-00000000000b';
export const DEMO_SASHA = '00000000-0000-4000-8000-00000000000c';

export interface DemoPerson {
  id: string;
  displayName: string;
  birthdate: string;
  city: string;
  inviteCode: string;
  wordsCode: string;
  pet: { name: string; species: Species; gauges: Gauges };
}

export const DEMO_PEOPLE: readonly DemoPerson[] = [
  {
    id: DEMO_LEA,
    displayName: 'Léa',
    birthdate: '1998-04-12',
    city: 'Paris',
    inviteCode: 'LEADEMO2',
    wordsCode: 'LEAMOTS2',
    pet: { name: 'Suzie', species: 'suzie', gauges: { social: 40, play: 20, tender: 30, talk: 10 } },
  },
  {
    id: DEMO_MALO,
    displayName: 'Malo',
    birthdate: '1996-09-30',
    city: 'Lyon',
    inviteCode: 'MALODEMO',
    wordsCode: 'MALOMOTS',
    pet: { name: 'Gaston', species: 'gaston', gauges: { social: -10, play: 55, tender: -20, talk: 35 } },
  },
  {
    id: DEMO_SASHA,
    displayName: 'Sasha',
    birthdate: '2000-01-21',
    city: 'Paris',
    inviteCode: 'SASHADEM',
    wordsCode: 'SASHAMOT',
    pet: { name: 'Pia', species: 'pia', gauges: { social: -35, play: -10, tender: 45, talk: -25 } },
  },
];

/** Messages de Malo à la personne qui arrive. */
export const DEMO_MALO_MESSAGES: readonly { body: string; tone?: 'sweet' | 'tease' }[] = [
  { body: 'salut ! gaston n’arrêtait pas de parler de ton pet' },
  { body: 'il paraît que tu as un pet très bien élevé. j’ai des doutes', tone: 'tease' },
  { body: 'photo du jour ce soir ? ça nous rend une vie' },
];
