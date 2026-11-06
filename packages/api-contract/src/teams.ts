/**
 * Contrats /v1/teams — « Viens avec ta team » (concept-v5.1 B.7, D-032 amendé) : 1 à 3 personnes
 * qui viennent ensemble, composées comme une unité indivisible ; pas de vote entre membres d'une
 * team. Dans une ville fermée, une team de 3 vérifiés déclenche une sortie d'amorçage avec une
 * autre team. Propriétaire : C (module `outings`).
 */
import { z } from 'zod';
import { TEAM_SIZE_CAP, TEAM_STATUSES } from '@blowy/domain';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';
import { PetCardSchema } from './pets.js';

export const TeamStatusSchema = z.enum(TEAM_STATUSES);
export const TEAM_FAILURE_REASONS = ['TEAM_FULL', 'ALREADY_IN_TEAM', 'TEAM_INVITE_INVALID', 'NOT_SAME_CITY', 'TEAM_LOCKED_IN_OUTING'] as const;
export const TeamFailureReasonSchema = z.enum(TEAM_FAILURE_REASONS);

/** Ma team (membres vus par les autres membres : prénom, pet, vérifié·e oui/non). */
export const TeamViewSchema = z
  .object({
    id: UuidSchema,
    status: TeamStatusSchema,
    members: z.array(z.object({ userId: UuidSchema, firstName: z.string(), pet: PetCardSchema, verified: z.boolean(), me: z.boolean() }).strict()).min(1).max(TEAM_SIZE_CAP),
    /** Ville fermée : la team peut déclencher une sortie d'amorçage (3 vérifiés). */
    seedingEligible: z.boolean(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();
export type TeamView = z.infer<typeof TeamViewSchema>;

/** `POST /v1/teams` → lien d'invitation (montré à la création). */
export const CreateTeamResponseSchema = z.object({ team: TeamViewSchema, inviteUrl: z.string().url() });
/** `POST /v1/teams/join`. */
export const JoinTeamRequestSchema = z.object({ inviteRef: z.string().min(6).max(128) });
/** `POST /v1/teams/:id/leave` : sans motif ni pénalité. */
export const LeaveTeamResponseSchema = z.object({ left: z.literal(true) });
