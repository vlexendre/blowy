/** Contrats /v1/media, révélation photo, messages vocaux (propriétaire : agent E). */
import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const MEDIA_PURPOSES = ['PROFILE_PHOTO', 'MISSION_PROOF', 'VOICE_MESSAGE', 'VERIFICATION_SELFIE'] as const;
export const MediaPurposeSchema = z.enum(MEDIA_PURPOSES);
export type MediaPurpose = z.infer<typeof MediaPurposeSchema>;

/** Types acceptés (le type RÉEL est vérifié serveur ; SVG et formats actifs refusés). */
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const;
export const AUDIO_MIME_TYPES = ['audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/x-wav'] as const;

export const CreateUploadRequestSchema = z
  .object({
    purpose: MediaPurposeSchema,
    mimeType: z.enum([...IMAGE_MIME_TYPES, ...AUDIO_MIME_TYPES]),
    bytes: z.number().int().min(1).max(25 * 1024 * 1024),
    /** Relation concernée : requis pour VOICE_MESSAGE, facultatif pour MISSION_PROOF. */
    relationshipId: UuidSchema.optional(),
    /** V5 (D-051) : vocal d'un duo débloqué — conversation DUO visée (alternative à `relationshipId`, vérifiée à l'envoi). */
    conversationId: UuidSchema.optional(),
    /** Mission visée (clé éditoriale @blowy/content) : requis pour MISSION_PROOF. */
    missionKey: z.string().regex(/^[a-z0-9_]{2,40}$/).optional(),
  })
  .refine((r) => r.purpose !== 'MISSION_PROOF' || !!r.missionKey, { message: 'missionKey requis', path: ['missionKey'] })
  .refine((r) => r.purpose !== 'VOICE_MESSAGE' || !!r.relationshipId || !!r.conversationId, { message: 'relationshipId ou conversationId requis', path: ['relationshipId'] });
export type CreateUploadRequest = z.infer<typeof CreateUploadRequestSchema>;

export const UploadSessionSchema = z.object({
  mediaId: UuidSchema,
  /** PUT octets bruts (Authorization requis), avant `expiresAt`. */
  uploadUrl: z.string(),
  method: z.literal('PUT'),
  maxBytes: z.number().int(),
  expiresAt: IsoDateTimeSchema,
});
export type UploadSession = z.infer<typeof UploadSessionSchema>;

export const MediaVariantSchema = z.enum(['thumbnail', 'normalized', 'blurred', 'blurred_medium', 'audio']);
export type MediaVariant = z.infer<typeof MediaVariantSchema>;

export const MissionProofStatusSchema = z.enum(['PENDING', 'CONSISTENT', 'INCONSISTENT', 'UNCERTAIN', 'HUMAN_REVIEW', 'APPROVED', 'REJECTED']);

/** Vue PROPRIÉTAIRE d'un média (jamais servie à un tiers). */
export const MediaViewSchema = z.object({
  id: UuidSchema,
  purpose: MediaPurposeSchema,
  status: z.enum(['UPLOAD_PENDING', 'QUARANTINE', 'PROCESSING', 'READY', 'REJECTED', 'PURGED']),
  /** Raison non sensible (ex. UNSUPPORTED_TYPE, TOO_LARGE, MODERATION, PENDING_REVIEW). */
  reasonCode: z.string().nullable(),
  visibility: z.enum(['PRIVATE', 'SHARED_WITH_CONTEXT']),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  durationMs: z.number().int().nullable(),
  variants: z.array(MediaVariantSchema),
  createdAt: IsoDateTimeSchema,
  purgeAfter: IsoDateTimeSchema.nullable(),
  /** Preuve de mission : adéquation VISIBLE (≠ récompense). */
  missionProof: z
    .object({
      missionKey: z.string(),
      status: MissionProofStatusSchema,
      visibleEvidence: z.array(z.string()),
      missingEvidence: z.array(z.string()),
      /** Proposer de refaire la photo / alternative accessible / recours. */
      canRetry: z.boolean(),
    })
    .nullable(),
});
export type MediaView = z.infer<typeof MediaViewSchema>;

export const ContentQuerySchema = z.object({
  variant: MediaVariantSchema.default('thumbnail'),
  /** Contexte d'accès (photo de profil vue dans une relation). */
  relationshipId: UuidSchema.optional(),
  /** Jeton court révocable (alternative à Authorization). */
  token: z.string().max(200).optional(),
});

export const CreateAccessTokenRequestSchema = z.object({ variant: MediaVariantSchema, relationshipId: UuidSchema.optional() });
export const AccessTokenSchema = z.object({ url: z.string(), expiresAt: IsoDateTimeSchema });

/** Partage volontaire d'une preuve de mission dans une relation (§5.5). */
export const ShareMediaRequestSchema = z.object({ relationshipId: UuidSchema, shared: z.boolean() });

/** Révélation photo (P-5.4) : proposition puis accord ; effet simultané au second accord. */
export const PhotoRevealRequestSchema = z.object({
  scope: z.enum(['PHOTO_REVEAL', 'PHOTO_ORIGINAL']),
  decision: z.enum(['ACCEPT', 'DECLINE']).default('ACCEPT'),
});
export const PhotoRevealStateSchema = z.object({
  scope: z.enum(['PHOTO_REVEAL', 'PHOTO_ORIGINAL']),
  status: z.enum(['OPEN', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'SUPERSEDED', 'CANCELLED']),
  version: z.number().int(),
  myDecision: z.enum(['ACCEPT', 'DECLINE']).nullable(),
  /** Variante photo de l'autre désormais accessible (null = aucune). */
  otherVariant: MediaVariantSchema.nullable(),
});

/** Message vocal (≥ N3 avec droits VOICE) : média VOICE_MESSAGE finalisé. */
export const SendVoiceMessageRequestSchema = z.object({
  clientMessageId: z.string().min(8).max(64),
  mediaId: UuidSchema,
});
export type SendVoiceMessageRequest = z.infer<typeof SendVoiceMessageRequestSchema>;

/** Limites par usage (miroir des règles serveur, à titre informatif pour l'UI). */
export const MEDIA_LIMITS = {
  PROFILE_PHOTO: { maxBytes: 12 * 1024 * 1024, maxPixels: 40_000_000 },
  MISSION_PROOF: { maxBytes: 12 * 1024 * 1024, maxPixels: 40_000_000 },
  VERIFICATION_SELFIE: { maxBytes: 12 * 1024 * 1024, maxPixels: 40_000_000 },
  VOICE_MESSAGE: { maxBytes: 3 * 1024 * 1024, maxDurationMs: 60_000 },
} as const;
