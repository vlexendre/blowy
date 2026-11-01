/** Contrats /v1/matches, /v1/match-proposals (propriétaire : agent C). */
import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';
import { PublicPetProfileSchema } from './pets.js';

export const MatchProposalViewSchema = z.object({
  id: UuidSchema,
  kind: z.enum(['STRONG', 'DISCOVERY', 'ONBOARDING']),
  /** Score public de vision [0,100]. */
  visionScore: z.number().int().min(0).max(100),
  otherPet: PublicPetProfileSchema,
  expiresAt: IsoDateTimeSchema,
  /** L'utilisateur courant a déjà accepté (jamais l'état de l'autre). */
  acceptedByMe: z.boolean(),
});
export type MatchProposalView = z.infer<typeof MatchProposalViewSchema>;

export const MatchFeedSchema = z.object({
  items: z.array(MatchProposalViewSchema),
  /** Raison d'une liste vide, honnête (P-5.10, §7). */
  emptyReason: z.enum(['NONE', 'NOT_VERIFIED', 'NO_PRIMARY_PET', 'ZONE_EMPTY', 'NO_CAPACITY', 'EXCLUSIVE', 'WAITING_NEXT_BATCH', 'PAUSED']).nullable(),
  nextBatchAt: IsoDateTimeSchema.nullable(),
});
export type MatchFeed = z.infer<typeof MatchFeedSchema>;

export const AcceptProposalResultSchema = z.object({
  status: z.enum(['WAITING_OTHER', 'MATCHED']),
  relationshipId: UuidSchema.nullable(),
});
export type AcceptProposalResult = z.infer<typeof AcceptProposalResultSchema>;
