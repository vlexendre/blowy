import type { Day, Gauges, Needs, Outfit, PetEventKind, Species } from '@blowy/domain';

export interface PetRecord {
  id: string;
  ownerId: string;
  name: string;
  species: Species;
  gauges: Gauges;
  /** Dernier jour où l'usure des jauges a été appliquée. */
  decayedOn: Day;
  /**
   * Besoins. Lus en base : valeurs à l'instant `needsAt`. Rendus par `PetCharacter.load` ou `livePet` :
   * valeurs à l'instant présent (usure rattrapée).
   */
  needs: Needs;
  /** Instant (ISO) auquel les besoins enregistrés correspondent. */
  needsAt: string;
  /** Jours où la personne s'est occupée de son pet, et le dernier. */
  careDays: number;
  lastCareOn: Day | null;
  /** Plus longue série de photos du jour à deux, tous liens confondus (conservée quand une série retombe). */
  bestStreak: number;
  outfit: Outfit;
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
  /**
   * Enregistre nom, jauges, jour d'usure, tenue et jours de soin.
   * Jamais les besoins : ils passent par `saveNeeds`, pour ne pas réécrire des valeurs « à l'instant » avec un ancien `needsAt`.
   */
  save(pet: PetRecord): Promise<void>;
  saveNeeds(petId: string, needs: Needs, needsAt: string): Promise<void>;
  /** Monte `bestStreak` à `streak` pour les pets de ces personnes, s'il était plus bas. */
  raiseBestStreak(ownerIds: readonly string[], streak: number): Promise<void>;
  appendEvent(event: Omit<PetEventRecord, 'id'>): Promise<PetEventRecord>;
  /** Derniers événements, du plus récent au plus ancien. */
  listEvents(petId: string, limit: number): Promise<PetEventRecord[]>;
  /** Événements d'un type depuis un instant (ISO), pour les plafonds du jour. */
  listEventsSince(petId: string, kind: PetEventKind, sinceIso: string): Promise<PetEventRecord[]>;
  countEvents(petId: string, kind: PetEventKind): Promise<number>;
}

export type ItemSource = 'start' | 'milestone' | 'purchase';

/** Objets possédés par un pet (table `pet_items`). */
export interface PetItemsRepository {
  list(petId: string): Promise<string[]>;
  /** Ajoute les objets absents (idempotent) et rend ceux réellement ajoutés. */
  addMany(petId: string, items: readonly { itemId: string; source: ItemSource }[], acquiredAt: string): Promise<string[]>;
}

/** Votes « 3 mots » : ils font partie du caractère du pet. */
export interface WordVotesRepository {
  /** Faux si cette personne a déjà voté pour cette cible. */
  add(vote: { targetUser: string; words: readonly string[]; voterHash: string; createdAt: string }): Promise<boolean>;
  count(targetUser: string): Promise<number>;
}
