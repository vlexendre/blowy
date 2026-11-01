/** Contrats /v1/relationships (propriétaire : agent C). Aucun vote d'autrui, jamais. */
import { z } from 'zod';
import { CAPABILITIES } from '@blowy/domain';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';
import { PartnerPresenceSchema, PublicPetProfileSchema } from './pets.js';

export const RelationshipStatusSchema = z.enum(['ACTIVE', 'MOVED_IN', 'PAUSED', 'LEGACY', 'ENDED']);
export const BranchSchema = z.enum(['UNDECIDED', 'FRIEND', 'PLUS']);
export const CapabilitySchema = z.enum(CAPABILITIES);

export const ConsentOfferViewSchema = z.object({
  id: UuidSchema,
  scope: z.enum(['MOVE_IN', 'BRANCH_VOTE', 'PHOTO_REVEAL', 'PHOTO_ORIGINAL', 'IRL_DATE', 'EGG', 'TRANSFER_TO_NEIGHBORHOOD']),
  version: z.number().int(),
  proposedByMe: z.boolean(),
  /** Ma propre réponse seulement. */
  myDecision: z.enum(['ACCEPT', 'DECLINE']).nullable(),
  expiresAt: IsoDateTimeSchema,
});

export const BranchRoundViewSchema = z.object({
  id: UuidSchema,
  roundNo: z.number().int(),
  deadlineAt: IsoDateTimeSchema,
  /** Mon propre choix uniquement (consultable par son auteur). */
  myChoice: z.enum(['FRIEND', 'PLUS']).nullable(),
});

/** RelationshipView : vue d'un participant. */
export const RelationshipViewSchema = z.object({
  id: UuidSchema,
  type: z.enum(['DATE', 'NEIGHBORHOOD', 'GROUP', 'COPARENT']),
  status: RelationshipStatusSchema,
  branch: BranchSchema,
  affinity: z.number().int(),
  xp: z.number(),
  eligibleLevel: z.number().int(),
  reachedLevel: z.number().int(),
  complicity: z.number(),
  tension: z.number(),
  capabilities: z.array(CapabilitySchema),
  myPet: PublicPetProfileSchema,
  otherPet: PublicPetProfileSchema,
  /** Présence de l'autre pet au lieu attitré / maison commune. */
  otherPresence: PartnerPresenceSchema,
  myPetHere: z.boolean(),
  dateSpotKey: z.string().nullable(),
  conversationId: UuidSchema.nullable(),
  pausedByMe: z.boolean(),
  paused: z.boolean(),
  legacy: z.boolean(),
  exclusive: z.boolean(),
  pendingOffers: z.array(ConsentOfferViewSchema),
  openBranchRound: BranchRoundViewSchema.nullable(),
  startedAt: IsoDateTimeSchema,
  endedAt: IsoDateTimeSchema.nullable(),
  /** Version de projection propre au lecteur (n'avance pas sur les votes privés de l'autre). */
  viewVersion: z.number().int(),
});
export type RelationshipView = z.infer<typeof RelationshipViewSchema>;

export const RelationshipListSchema = z.object({ items: z.array(RelationshipViewSchema) });

export const LeaveRelationshipRequestSchema = z.object({
  /** Raison intime facultative, jamais transmise à l'autre. */
  reason: z.enum(['CLEAN_LEAVE', 'REPORT_SAFETY_EXIT']).default('CLEAN_LEAVE'),
});

export const PauseRelationshipRequestSchema = z.object({ days: z.number().int().min(1).max(14) });

export const RespondOfferRequestSchema = z.object({
  offerId: UuidSchema,
  decision: z.enum(['ACCEPT', 'DECLINE']),
  /** Version vue par l'utilisateur : refus si l'offre a changé. */
  version: z.number().int(),
});

export const CastBallotRequestSchema = z.object({ choice: z.enum(['FRIEND', 'PLUS']) });

export const MoveInResultSchema = z.object({
  status: z.enum(['PROPOSED', 'WAITING_OTHER', 'MOVED_IN', 'DECLINED', 'SUPERSEDED']),
  relationship: RelationshipViewSchema,
});
