/** Contrats /v1/me, /v1/preferences, /v1/verifications, /v1/pauses (propriétaire : agent C). */
import { z } from 'zod';
import { GENDERS, INTENTIONS, VERIFICATION_STATUSES } from '@blowy/domain';
import { IntegrationModeSchema, IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const GenderSchema = z.enum(GENDERS);
export const IntentionSchema = z.enum(INTENTIONS);
export const PhotoPreferenceSchema = z.enum(['FROM_LEVEL_4_WITH_CONSENT', 'NEVER']);
export const AgeDisplaySchema = z.enum(['EXACT', 'RANGE']);

/** Date civile YYYY-MM-DD. */
export const CivilDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const MatchPreferencesSchema = z
  .object({
    ageMin: z.number().int().min(18).max(99),
    ageMax: z.number().int().min(18).max(99),
    maxDistanceKm: z.number().int().min(1).max(200),
    seekingGenders: z.array(GenderSchema).max(4),
    intention: IntentionSchema,
    widenConsented: z.boolean(),
  })
  .refine((p) => p.ageMin <= p.ageMax, { message: 'ageMin > ageMax', path: ['ageMin'] });
export type MatchPreferences = z.infer<typeof MatchPreferencesSchema>;

export const PrivacySettingsSchema = z.object({
  photoPreference: PhotoPreferenceSchema,
  ageDisplay: AgeDisplaySchema,
  mapVisible: z.boolean(),
});
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;

export const VerificationViewSchema = z.object({
  status: z.enum(VERIFICATION_STATUSES),
  kind: z.enum(['SELFIE_QUALITY', 'SELFIE_HUMAN_REVIEW', 'LIVENESS', 'IDENTITY_AGE']).nullable(),
  provenance: z.enum(['PROVIDER', 'STAFF', 'LOCAL_DEMO']).nullable(),
  /** LOCAL_DEMO = badge de démonstration, jamais « majorité vérifiée ». */
  mode: IntegrationModeSchema,
  expiresAt: IsoDateTimeSchema.nullable(),
});
export type VerificationView = z.infer<typeof VerificationViewSchema>;

export const PauseViewSchema = z.object({
  id: UuidSchema,
  relationshipId: UuidSchema.nullable(),
  startsAt: IsoDateTimeSchema,
  endsAt: IsoDateTimeSchema,
});

/** Profil de soi (SelfProfile) : seule vue contenant des données privées du titulaire. */
export const SelfProfileSchema = z.object({
  userId: UuidSchema,
  displayName: z.string().nullable(),
  gender: GenderSchema,
  /** Âge calculé serveur ; la date de naissance n'est renvoyée qu'à son titulaire. */
  birthDate: CivilDateSchema.nullable(),
  age: z.number().int().nullable(),
  timezone: z.string(),
  zoneCode: z.string().nullable(),
  reliability: z.number().int(),
  onboarded: z.boolean(),
  primaryPetId: UuidSchema.nullable(),
  preferences: MatchPreferencesSchema.nullable(),
  privacy: PrivacySettingsSchema,
  verification: VerificationViewSchema,
  activePause: PauseViewSchema.nullable(),
  isFictional: z.boolean(),
});
export type SelfProfile = z.infer<typeof SelfProfileSchema>;

export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(40).optional(),
  gender: GenderSchema.optional(),
  /** Modifiable uniquement avant la fin de l'onboarding. */
  birthDate: CivilDateSchema.optional(),
  timezone: z.string().min(3).max(64).optional(),
  zoneCode: z.string().min(2).max(64).optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const StartPauseRequestSchema = z.object({
  /** null/absent = pause globale. */
  relationshipId: UuidSchema.optional(),
  days: z.number().int().min(1).max(14),
});
export type StartPauseRequest = z.infer<typeof StartPauseRequestSchema>;

export const StartVerificationRequestSchema = z.object({
  kind: z.enum(['SELFIE_QUALITY', 'LIVENESS', 'IDENTITY_AGE']).default('SELFIE_QUALITY'),
});
