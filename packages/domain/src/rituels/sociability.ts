/**
 * Sociabilité : ce qui la fait monter, et la question du jour « Tu es sorti aujourd'hui ? ».
 * La règle honnête : la réponse est déclarative et on la croit ; une position hors de la zone du domicile,
 * envoyée par l'app ouverte, la confirme (sans rien changer aux points : on ne pénalise pas qui n'a pas partagé sa position).
 */
import type { PetEventKind } from '../gauges';

/** Points de sociabilité gagnés par événement (en plus de l'effet sur le caractère). Plafonds par jour : ceux des événements. */
export const SOCIABILITY_GAIN: Partial<Record<PetEventKind, number>> = {
  waved: 4,
  met_new_pet: 12,
  message_sent: 2,
  sweet_word: 1,
  photo_sent: 8,
};

export const OUTING_ANSWERS = ['saw_people', 'walk', 'not_yet'] as const;
/** saw_people : « Oui, j'ai vu du monde » · walk : « Oui, un tour » · not_yet : « Pas encore ». */
export type OutingAnswer = (typeof OUTING_ANSWERS)[number];

export const OUTING_GAIN: Record<OutingAnswer, number> = { saw_people: 40, walk: 20, not_yet: 0 };

export interface OutingVerdict {
  /** La sortie compte pour aujourd'hui (une seule fois par jour). */
  out: boolean;
  /** Une position hors de la zone du domicile l'a confirmée. */
  confirmed: boolean;
  gain: number;
}

/**
 * Réponse à « Tu es sorti aujourd'hui ? ». `awayFromHome` : true si une position (app ouverte) est hors de la zone
 * du domicile, false si elle est dedans, null si on ne sait pas (pas de position ou pas de domicile connu).
 */
export function outingVerdict(answer: OutingAnswer, awayFromHome: boolean | null): OutingVerdict {
  const out = answer !== 'not_yet';
  return { out, confirmed: out && awayFromHome === true, gain: OUTING_GAIN[answer] };
}

/** La question peut être posée : pas encore de sortie comptée aujourd'hui (« pas encore » laisse la porte ouverte). */
export const canAnswerOuting = (outToday: boolean): boolean => !outToday;

// Zone du domicile et distance : `isAwayFromHome` et `GeoPoint` de la vision (vision.ts).
