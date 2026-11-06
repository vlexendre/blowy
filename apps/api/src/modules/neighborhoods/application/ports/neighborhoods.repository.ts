import type { NeighborhoodStatus } from '@blowy/domain';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';

export interface NeighborhoodRow {
  id: string;
  slug: string;
  name: string;
  city: string;
  status: NeighborhoodStatus;
  densityThreshold: number;
  estimatedLaunchAt: Date | null;
  timezone: string;
  cityZoneId: string;
}

export interface NeighborhoodsRepository {
  list(): Promise<NeighborhoodRow[]>;
  byId(scope: TxScope | null, id: string): Promise<NeighborhoodRow | null>;
  userState(scope: TxScope | null, userId: string, at: Date): Promise<{ neighborhoodId: string | null; changedAt: Date | null; verified: boolean; hasPhoto: boolean; hasActiveSeat: boolean } | null>;
  /** Vérifiés en attente : quartier choisi, onboardés, selfie vérifié valide, non supprimés (jamais gonflé). */
  verifiedWaiting(neighborhoodId: string, at: Date): Promise<number>;
  setUserNeighborhood(scope: TxScope, userId: string, neighborhoodId: string, changed: boolean): Promise<void>;
  /** Liste d'attente : entrée unique si le quartier n'est pas LIVE ; supprimée sinon. */
  syncWaitlist(scope: TxScope, userId: string, neighborhood: NeighborhoodRow): Promise<void>;
  /** Quartiers acceptables initialisés au quartier choisi s'ils sont vides (ou s'ils ne contiennent pas le nouveau quartier). */
  ensureAcceptable(scope: TxScope, userId: string, neighborhoodId: string): Promise<void>;
  /**
   * V5.2 (A.2) : créneaux de la personne (semaine dont la fenêtre de demande est ouverte, sinon la
   * suivante) et nombre d'AUTRES demandes vérifiées de la ville sur chacun (vrais nombres).
   */
  slotDemand(userId: string, weekKey: string, at: Date): Promise<{ startsAt: Date; others: number }[]>;
  /** Génère les créneaux des lieux actifs (idempotent par (venueId, startsAt)). */
  /**
   * Crée les créneaux des lieux pour les semaines à venir — V5.6 (E12) : seulement ceux que `covered` accepte
   * (astreinte couvrant le créneau, du check-in à la fin prévue) ; sans `covered`, tous.
   */
  generateSlots(at: Date, weeksAhead: number, covered?: (timezone: string, startsAt: Date) => Promise<boolean>): Promise<number>;
  /**
   * V5.6 (E12, §10.1) : créneaux publiés à venir qui ont perdu leur couverture — retirés s'ils n'ont aucune
   * sortie, sinon signalés aux ops (outbox `ops.oncall_coverage_lost`, une fois par créneau).
   */
  watchCoverage(at: Date, horizonDays: number, covered: (timezone: string, startsAt: Date) => Promise<boolean>): Promise<{ removed: number; escalated: number }>;
}
export const NEIGHBORHOODS_REPOSITORY = Symbol('NeighborhoodsRepository');
