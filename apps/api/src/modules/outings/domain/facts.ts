/**
 * Faits d'une sortie chargés par le repository, entrée des règles pures (projection par acteur,
 * annulation, votes). Aucune dépendance Nest/Prisma.
 */
import type { ActivityKind, Gender, OutingCancelReason, OutingStatus, RefundState, SeatCancelKind, SeatFunding, SeatStatus } from '@blowy/domain';
import type { PetCard } from '@blowy/api-contract';

export interface PersonFacts {
  firstName: string;
  /** Âge calculé serveur (jamais exposé tel quel : tranche seulement). */
  age: number;
  gender: Gender;
  reliability: { attended: number; noShows: number; lateCancels: number };
  pet: PetCard;
  threeWords: string[];
  /** V5.7 (E32) : « Montrer au groupe : je préfère le calme » (opt-in). */
  calmBadge?: boolean;
}

export interface SeatFacts {
  seatId: string;
  userId: string;
  status: SeatStatus;
  teamId: string | null;
  funding: SeatFunding | null;
  holdExpiresAt: Date | null;
  acceptDeadline: Date;
  confirmedAt: Date | null;
  cancelKind: SeatCancelKind | null;
  refundState: RefundState;
  person: PersonFacts;
}

export interface VenueFacts {
  id: string;
  name: string;
  address: string;
  offerLabel: string;
  photoUrl: string | null;
  lat: number;
  lng: number;
}

export interface OutingFacts {
  id: string;
  status: OutingStatus;
  weekKey: string;
  neighborhoodName: string;
  timezone: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  activity: ActivityKind;
  acceptDeadline: Date;
  lockAt: Date;
  photoRevealAt: Date;
  checkinOpensAt: Date;
  checkinClosesAt: Date;
  votesCloseAt: Date;
  votesClosedAt: Date | null;
  cancelReason: OutingCancelReason | null;
  venue: VenueFacts;
  conversationId: string | null;
  seats: SeatFacts[];
}
