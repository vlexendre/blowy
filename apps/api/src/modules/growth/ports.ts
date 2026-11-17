import type { AcquisitionSource, CounterRow, Day, EventRow, GrowthCounterMetric, GrowthEventKind, MemberSpan } from '@blowy/domain';

/** Jetons des dépôts de la croissance (globaux : l'inscription, les liens, Minimoa+ et la garde-robe s'en servent). */
export const CREATORS = Symbol('CREATORS');
export const ACQUISITIONS = Symbol('ACQUISITIONS');
export const GROWTH_EVENTS = Symbol('GROWTH_EVENTS');
export const GROWTH_COUNTERS = Symbol('GROWTH_COUNTERS');
export const GROWTH_READS = Symbol('GROWTH_READS');

export interface CreatorRecord {
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorsRepository {
  find(code: string): Promise<CreatorRecord | null>;
  list(): Promise<CreatorRecord[]>;
  /** Faux si le code existe déjà. */
  create(c: CreatorRecord): Promise<boolean>;
  update(code: string, patch: Partial<Pick<CreatorRecord, 'name' | 'active' | 'updatedAt'>>): Promise<CreatorRecord | null>;
}

export interface AcquisitionRecord {
  userId: string;
  source: AcquisitionSource;
  ref: string | null;
  referredBy: string | null;
  /** Jour (Paris) de l'inscription : jour 0 des J1, J7, J30. */
  cohortOn: Day;
  createdAt: string;
}

export interface AcquisitionsRepository {
  find(userId: string): Promise<AcquisitionRecord | null>;
  /** Faux si la personne a déjà sa source (la première gagne : une inscription reprise ne la change pas). */
  create(a: AcquisitionRecord): Promise<boolean>;
  /** Personnes arrivées grâce à `userId` (invitation, lien « 3 mots »). */
  countReferredBy(userId: string): Promise<number>;
  /** Comptes arrivés avec chaque code de créateur depuis `since` (jour d'inscription). */
  countByCreator(since: Day): Promise<Map<string, number>>;
}

export interface GrowthEventRecord {
  userId: string | null;
  kind: GrowthEventKind;
  source: AcquisitionSource;
  cohortOn: Day;
  createdAt: string;
}

export interface GrowthEventsRepository {
  /** Faux si la personne a déjà franchi cette étape (une fois chacune). */
  record(e: GrowthEventRecord): Promise<boolean>;
  /** Étapes des comptes inscrits depuis `from` (inclus). */
  listSince(from: Day): Promise<EventRow[]>;
}

export interface GrowthCountersRepository {
  /** +1 sur le compteur du jour (sans course). */
  bump(day: Day, metric: GrowthCounterMetric, source: string, ref: string): Promise<void>;
  listSince(from: Day): Promise<CounterRow[]>;
}

/** Lectures des autres tables pour le tableau : groupes créés et leurs membres. */
export interface GrowthReads {
  groupsCreatedSince(sinceIso: string): Promise<{ createdAt: string; members: MemberSpan[] }[]>;
}
