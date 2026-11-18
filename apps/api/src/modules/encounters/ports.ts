import type { EncounterStatus } from '@blowy/domain';

export type { EncounterStatus };

export interface EncounterRecord {
  id: string;
  fromUser: string;
  toUser: string;
  status: EncounterStatus;
  /** Ce que le pet de `fromUser` disait de la rencontre au moment du coucou. */
  intro: string | null;
  createdAt: string;
  /** Dernier changement de statut (le coucou, puis la réponse) : date montrée et ordre de l'historique. */
  statusAt: string;
}

/**
 * Rencontres proposées par jour et par personne (statistiques de l'administration : propositions, compatibilité
 * moyenne). Une ligne par personne et par jour, réécrite seulement quand le nombre montré augmente ; purgée après 30 jours.
 */
export const ENCOUNTER_PROPOSALS = Symbol('ENCOUNTER_PROPOSALS');
export interface ProposalsRepository {
  /** Garde le plus grand nombre de suggestions montrées ce jour-là (et la somme de leurs compatibilités). */
  record(day: string, userId: string, proposed: number, scoreSum: number): Promise<void>;
  /** Total d'un jour : suggestions montrées et somme des compatibilités. */
  summary(day: string): Promise<{ proposed: number; scoreSum: number }>;
  purgeBefore(day: string): Promise<number>;
}

export interface EncountersRepository {
  findById(id: string): Promise<EncounterRecord | null>;
  findPair(fromUser: string, toUser: string): Promise<EncounterRecord | null>;
  /** Null si la paire existe déjà. */
  create(encounter: EncounterRecord): Promise<EncounterRecord | null>;
  setStatus(id: string, status: EncounterStatus, at: string): Promise<void>;
  /** Toutes les rencontres où la personne est d'un côté ou de l'autre. */
  listInvolving(userId: string): Promise<EncounterRecord[]>;
  /**
   * Historique : rencontres envoyées par la personne (tous statuts) et reçues auxquelles elle a répondu,
   * `statusAt` strictement avant `before`, de la plus récente à la plus ancienne, `limit` au plus.
   */
  listHistory(userId: string, before: string | null, limit: number): Promise<EncounterRecord[]>;
  /** Coucous envoyés par la personne depuis `since` (`createdAt`, tous statuts) : plafonds et repérage des abus. */
  listSentSince(fromUser: string, since: string): Promise<EncounterRecord[]>;
  /** Coucous reçus depuis `since` (`createdAt`, tous statuts) : plafond des e-mails de signe. */
  listReceivedSince(toUser: string, since: string): Promise<EncounterRecord[]>;
}
