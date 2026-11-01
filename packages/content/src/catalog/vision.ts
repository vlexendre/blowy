/** Référentiels de vision : écoles, dimanches (+ matrice dans @blowy/tuning), passions, limites, mots positifs. */
import { ANONYMOUS_WORDS, LIMITS, PASSIONS, SCHOOLS, SUNDAYS, type AnonymousWord, type Limit, type Passion, type School, type Sunday } from '@blowy/domain';
import type { I18nEntry } from './types.js';

const entries = <Id extends string>(ns: string, ids: readonly Id[], fr: Record<Id, string>): I18nEntry<Id>[] => ids.map((id) => ({ id, key: `${ns}.${id.toLowerCase()}`, fr: fr[id] }));

export const SCHOOL_ENTRIES = entries<School>('school', SCHOOLS, { BEAUX_ARTS: 'Beaux-Arts', POLYTECHNIQUE: 'Polytechnique', CIRQUE: 'École du cirque', AUTODIDACTE: 'Autodidacte' });

export const SUNDAY_ENTRIES = entries<Sunday>('sunday', SUNDAYS, { BRUNCH: 'Brunch qui s’éternise', MUSEE: 'Expo ou musée', RANDO: 'Rando au grand air', CANAPE: 'Canapé, plaid et série' });

export const PASSION_ENTRIES = entries<Passion>('passion', PASSIONS, {
  SPORT: 'Sport',
  MUSIQUE: 'Musique',
  CUISINE: 'Cuisine',
  CINEMA: 'Cinéma',
  JEUX: 'Jeux',
  LECTURE: 'Lecture',
  ART: 'Art',
  VOYAGE: 'Voyage',
  NATURE: 'Nature',
  DANSE: 'Danse',
});

export const LIMIT_ENTRIES = entries<Limit>('limit', LIMITS, { GHOSTER: 'Ghoster', MENTIR: 'Mentir', RETARD: 'Être en retard', JUGER: 'Juger' });

export const ANONYMOUS_WORD_ENTRIES = entries<AnonymousWord>('word', ANONYMOUS_WORDS, {
  DROLE: 'drôle',
  LOYAL: 'loyal·e',
  SOLAIRE: 'solaire',
  CURIEUX: 'curieux·se',
  BIENVEILLANT: 'bienveillant·e',
  CREATIF: 'créatif·ve',
  COURAGEUX: 'courageux·se',
  APAISANT: 'apaisant·e',
  GENEREUX: 'généreux·se',
  INSPIRANT: 'inspirant·e',
  FIABLE: 'fiable',
  PETILLANT: 'pétillant·e',
});

/** Lieu attitré dérivé du dimanche idéal (§5.3 « tiré du dimanche idéal des deux visions »). */
export const DATE_SPOT_BY_SUNDAY: Record<Sunday, I18nEntry> = {
  BRUNCH: { id: 'CAFE', key: 'spot.cafe', fr: 'au café' },
  MUSEE: { id: 'GALLERY', key: 'spot.gallery', fr: 'à la galerie' },
  RANDO: { id: 'PARK', key: 'spot.park', fr: 'au parc' },
  CANAPE: { id: 'LIVING_ROOM', key: 'spot.living_room', fr: 'au salon cosy' },
};
