import type { Day, Gauges, PetEventKind, Species } from '@blowy/domain';

export interface PetRecord {
  id: string;
  ownerId: string;
  name: string;
  species: Species;
  gauges: Gauges;
  /** Dernier jour où l'usure des jauges a été appliquée. */
  decayedOn: Day;
  createdAt: string;
}

export interface PetEventRecord {
  id: string;
  petId: string;
  kind: PetEventKind;
  delta: Partial<Gauges>;
  createdAt: string;
}

export interface PetsRepository {
  findByOwner(ownerId: string): Promise<PetRecord | null>;
  findByOwners(ownerIds: readonly string[]): Promise<PetRecord[]>;
  create(pet: PetRecord): Promise<void>;
  /** Enregistre nom, jauges et jour d'usure. */
  save(pet: PetRecord): Promise<void>;
  appendEvent(event: Omit<PetEventRecord, 'id'>): Promise<PetEventRecord>;
  /** Derniers événements, du plus récent au plus ancien. */
  listEvents(petId: string, limit: number): Promise<PetEventRecord[]>;
  /** Événements d'un type depuis un instant (ISO), pour les plafonds du jour. */
  listEventsSince(petId: string, kind: PetEventKind, sinceIso: string): Promise<PetEventRecord[]>;
}

/** Votes « 3 mots » : ils font partie du caractère du pet. */
export interface WordVotesRepository {
  /** Faux si cette personne a déjà voté pour cette cible. */
  add(vote: { targetUser: string; words: readonly string[]; voterHash: string; createdAt: string }): Promise<boolean>;
  count(targetUser: string): Promise<number>;
}
