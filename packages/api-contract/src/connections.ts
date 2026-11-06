/**
 * Contrats /v1/band, /v1/duos, voie Duo (/v1/matches, /v1/match-proposals) — spec-v5 §2.11–2.12,
 * §7.3, §7.6. Propriétaire : C2. On ne voit jamais la bande d'autrui ; toute fin non mutuelle
 * produit le même message neutre des deux côtés (D-017).
 */
import { z } from 'zod';
import { BAND_LINK_STATUSES, BAND_ORIGINS, CONNECTION_SOURCES, DATE_RESPONSES, DUO_DATE_STATUSES, DUO_ORIGINS, DUO_STATUSES, SEAT_CANCEL_REQUEST_KINDS } from '@blowy/domain';
import { IsoDateTimeSchema, UuidSchema, pageOf } from './core/common.js';
import { PetCardSchema } from './pets.js';
import { MemberReliabilitySchema, MutualConnectionSchema, RevealedPhotoSchema, VoteChoiceSchema } from './outings.js';

export const BandOriginSchema = z.enum(BAND_ORIGINS);
export const BandLinkStatusSchema = z.enum(BAND_LINK_STATUSES);
export const DuoStatusSchema = z.enum(DUO_STATUSES);
export const DuoOriginSchema = z.enum(DUO_ORIGINS);
export const DuoDateStatusSchema = z.enum(DUO_DATE_STATUSES);
export const ConnectionSourceSchema = z.enum(CONNECTION_SOURCES);

export const CONNECTION_FAILURE_REASONS = [
  // 412
  'ALREADY_LEFT',
  'ALREADY_CLOSED',
  'PROPOSAL_NOT_OPEN',
  'VERIFICATION_REQUIRED',
  'PHOTO_REQUIRED',
  'RELIABILITY_PAUSED',
  'DUO_NOT_UNLOCKED',
  'DATE_ALREADY_PROPOSED',
  'VENUE_NOT_IN_NEIGHBORHOOD',
  'DATE_OUT_OF_RANGE',
  'DATE_NOT_PROPOSED',
  'OWN_PROPOSAL',
  'DATE_NOT_CONFIRMED',
  'VOTE_WINDOW_CLOSED',
  'EGG_NOT_ELIGIBLE',
  'CHECKIN_NOT_OPEN',
  'CHECKIN_TOO_FAR',
  'CHECKIN_LOW_ACCURACY',
  'CHECKIN_CODE_INVALID',
  // 409
  'DUO_LIMIT_REACHED',
] as const;
export type ConnectionFailureReason = (typeof CONNECTION_FAILURE_REASONS)[number];
export const ConnectionFailureReasonSchema = z.enum(CONNECTION_FAILURE_REASONS);

// ---------------------------------------------------------------- bande
/** Un lien de MA bande (jamais celle d'autrui). */
export const BandMemberViewSchema = z
  .object({
    linkId: UuidSchema,
    user: z.object({ id: UuidSchema, firstName: z.string(), photo: RevealedPhotoSchema.optional() }).strict(),
    pet: PetCardSchema,
    reliability: MemberReliabilitySchema,
    conversationId: UuidSchema,
    origin: BandOriginSchema,
    since: IsoDateTimeSchema,
  })
  .strict();
export type BandMemberView = z.infer<typeof BandMemberViewSchema>;
export const BandPageSchema = pageOf(BandMemberViewSchema);

// ---------------------------------------------------------------- duos
export const DuoVenueViewSchema = z.object({ id: UuidSchema, name: z.string(), address: z.string().optional() }).strict();

export const DuoDateViewSchema = z
  .object({
    id: UuidSchema,
    status: DuoDateStatusSchema,
    venue: DuoVenueViewSchema,
    startsAt: IsoDateTimeSchema,
    proposedByMe: z.boolean(),
    /** Mon check-in seulement. */
    myCheckedIn: z.boolean().optional(),
    votesCloseAt: IsoDateTimeSchema.optional(),
    /** Mon bulletin seulement. */
    myVote: VoteChoiceSchema.optional(),
  })
  .strict();
export type DuoDateView = z.infer<typeof DuoDateViewSchema>;

/** `GET /v1/duos/:id` ; `GET /v1/duos` = liste. Photo seulement à partir de UNLOCKED. */
export const DuoViewSchema = z
  .object({
    id: UuidSchema,
    status: DuoStatusSchema,
    origin: DuoOriginSchema,
    other: z
      .object({ firstName: z.string(), pet: PetCardSchema, photo: RevealedPhotoSchema.optional(), reliability: MemberReliabilitySchema })
      .strict(),
    /** Voie Duo en EXCHANGE uniquement (texte d'abord ; visages débloqués à 48 h si les deux ont écrit ; vocal facultatif). Progression = la mienne seulement. */
    exchange: z.object({ endsAt: IsoDateTimeSchema, mineCount: z.number().int().nonnegative(), unlockProgress: z.number().min(0).max(1) }).strict().optional(),
    dateDeadline: IsoDateTimeSchema.optional(),
    currentDate: DuoDateViewSchema.optional(),
    /** V5.1 (F.18) : indice « projet compatible » si les sous-choix secrets concordent (jamais les sous-choix). */
    projectCompatible: z.literal(true).optional(),
    conversationId: UuidSchema,
  })
  .strict();
export type DuoView = z.infer<typeof DuoViewSchema>;
export const DuoListSchema = z.object({ items: z.array(DuoViewSchema) });

/** `GET /v1/matches` (V5) : propositions DUO_LANE ouvertes (≤ 3 actives). */
export const DuoLaneProposalViewSchema = z
  .object({ proposalId: UuidSchema, pet: PetCardSchema, visionScore: z.number().int().min(0).max(100), expiresAt: IsoDateTimeSchema, acceptedByMe: z.boolean() })
  .strict();
export type DuoLaneProposalView = z.infer<typeof DuoLaneProposalViewSchema>;
export const DuoLaneFeedSchema = z.object({
  items: z.array(DuoLaneProposalViewSchema),
  emptyReason: z.enum(['NONE', 'LANE_DISABLED', 'NOT_VERIFIED', 'PHOTO_REQUIRED', 'PAUSED', 'LIMIT_REACHED', 'WAITING_NEXT_BATCH']).nullable(),
  nextBatchAt: IsoDateTimeSchema.nullable(),
});

/** `POST /v1/match-proposals/:id/accept` (branche DUO_LANE) : au 2ᵉ accord, `Duo(EXCHANGE)`. */
export const AcceptDuoProposalResultSchema = z.object({ status: z.enum(['WAITING_OTHER', 'MATCHED']), duoId: UuidSchema.nullable() });
export type AcceptDuoProposalResult = z.infer<typeof AcceptDuoProposalResultSchema>;

export const ProposeDuoDateRequestSchema = z.object({ venueId: UuidSchema, startsAt: IsoDateTimeSchema });
export type ProposeDuoDateRequest = z.infer<typeof ProposeDuoDateRequestSchema>;
export const RespondDuoDateRequestSchema = z.object({ decision: z.enum(DATE_RESPONSES) });
export type RespondDuoDateRequest = z.infer<typeof RespondDuoDateRequestSchema>;
/** ≥ 24 h : neutre ; < 24 h : compté `lateCancel`. */
export const CancelDuoDateRequestSchema = z.object({ kind: z.enum(SEAT_CANCEL_REQUEST_KINDS) });
export const CastDuoVoteRequestSchema = z.object({ choice: VoteChoiceSchema });
export type CastDuoVoteRequest = z.infer<typeof CastDuoVoteRequestSchema>;
export const CastDuoVoteResponseSchema = z.object({ myChoice: VoteChoiceSchema }).strict();

// ---------------------------------------------------------------- événements WS (§7.6)
/** Aux deux seuls intéressés, au palier de révélation (jamais à l'instant du vote). */
export const ConnectionRevealedEventSchema = z
  .object({
    kind: MutualConnectionSchema,
    other: z.object({ userId: UuidSchema, firstName: z.string(), pet: PetCardSchema }).strict(),
    linkId: UuidSchema.optional(),
    duoId: UuidSchema.optional(),
    source: ConnectionSourceSchema,
  })
  .strict()
  .refine((e) => (e.kind === 'FRIEND' ? e.linkId !== undefined && e.duoId === undefined : e.duoId !== undefined && e.linkId === undefined), { message: 'FRIEND → linkId, PLUS → duoId' });
export const BandUpdatedEventSchema = z.object({ linkId: UuidSchema, status: BandLinkStatusSchema });
export const DuoUpdatedEventSchema = z.object({ duoId: UuidSchema, status: DuoStatusSchema, changed: z.enum(['STATUS', 'UNLOCKED', 'DATE', 'VOTE', 'ENDED']) });
