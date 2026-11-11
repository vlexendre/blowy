export type EncounterStatus = 'waved' | 'accepted' | 'declined';

export interface EncounterRecord {
  id: string;
  fromUser: string;
  toUser: string;
  status: EncounterStatus;
  /** Ce que le pet de `fromUser` disait de la rencontre au moment du coucou. */
  intro: string | null;
  createdAt: string;
}

export interface EncountersRepository {
  findById(id: string): Promise<EncounterRecord | null>;
  findPair(fromUser: string, toUser: string): Promise<EncounterRecord | null>;
  /** Null si la paire existe déjà. */
  create(encounter: EncounterRecord): Promise<EncounterRecord | null>;
  setStatus(id: string, status: EncounterStatus): Promise<void>;
  /** Toutes les rencontres où la personne est d'un côté ou de l'autre. */
  listInvolving(userId: string): Promise<EncounterRecord[]>;
}
