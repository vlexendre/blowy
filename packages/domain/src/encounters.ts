/** Rencontres : statut d'un coucou et ce qu'en voit chacun dans son historique. */
export const ENCOUNTER_STATUSES = ['waved', 'accepted', 'declined'] as const;
export type EncounterStatus = (typeof ENCOUNTER_STATUSES)[number];

/**
 * Issue d'une rencontre vue par une des deux personnes :
 * - `linked` : acceptée, le lien existe toujours (actif ou fantôme) ;
 * - `ended` : acceptée, mais le lien a été archivé depuis ;
 * - `declined` : tu as reçu ce coucou et tu as passé ton tour ;
 * - `waiting` : tu as salué, pas (encore) de oui (et pas de lien par ailleurs).
 */
export const ENCOUNTER_OUTCOMES = ['linked', 'ended', 'declined', 'waiting'] as const;
export type EncounterOutcome = (typeof ENCOUNTER_OUTCOMES)[number];

export interface EncounterSide {
  status: EncounterStatus;
  /** Vrai si la personne qui regarde a envoyé le coucou. */
  sent: boolean;
  /** Le lien entre les deux existe encore (pas archivé). */
  linkOpen: boolean;
}

/**
 * Issue montrée dans l'historique, ou null si la rencontre n'y a pas sa place (coucou reçu sans réponse :
 * il est dans « reçus », en haut des rencontres). Un refus n'est jamais montré à celui qui a salué :
 * pour lui, son coucou reste « en attente ».
 */
export function encounterOutcome({ status, sent, linkOpen }: EncounterSide): EncounterOutcome | null {
  if (status === 'accepted') return linkOpen ? 'linked' : 'ended';
  // Coucou envoyé resté sans oui, mais vous êtes liés autrement (invitation) : le lien compte.
  if (sent) return linkOpen ? 'linked' : 'waiting';
  return status === 'declined' ? 'declined' : null;
}
