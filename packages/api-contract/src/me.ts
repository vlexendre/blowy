/** Contrats /v1/me, /v1/preferences, /v1/verifications, /v1/pauses (propriétaire : agent C). */
import { z } from 'zod';
import { ACTIVITY_KINDS, GENDERS, INTENTIONS, KIDS_SOMEDAY, LOOKING_FOR, MEETING_MODES, ONBOARDING_STEPS_V5, STORY_SERIOUSNESS, TRAVEL_MINUTES, VERIFICATION_STATUSES } from '@blowy/domain';
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
  /** Lien de reprise de la session fournisseur (titulaire seulement ; ajout agent E). */
  sessionUrl: z.string().url().nullable().default(null),
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

// ============================================================================ V5 / V5.1 (spec-v5 §2.15, §7.1 ; concept-v5.1 B.8, C.9–C.11, D.13–D.14, F.17)

export const LookingForSchema = z.enum(LOOKING_FOR);
export const StorySeriousnessSchema = z.enum(STORY_SERIOUSNESS);
export const KidsSomedaySchema = z.enum(KIDS_SOMEDAY);
export const MeetingModeSchema = z.enum(MEETING_MODES);
export const ActivityKindSchema = z.enum(ACTIVITY_KINDS);
const uniq = (a: readonly unknown[]) => new Set(a).size === a.length;

/**
 * Intentions secrètes (jamais exposées) : potes / histoire / les deux, sous-choix secrets
 * (sérieuse / on verra ; enfants un jour), mode préféré (groupe / duo / les deux), genres.
 * `romanceGenders` exige le consentement `SENSITIVE_PREFERENCES` (sinon 403 `CONSENT_REQUIRED {purpose}`).
 */
export const IntentionsV5Schema = z
  .object({
    lookingFor: LookingForSchema,
    storySeriousness: StorySeriousnessSchema.nullable(),
    kidsSomeday: KidsSomedaySchema.nullable(),
    meetingMode: MeetingModeSchema,
    /** « Qui je veux rencontrer » en groupe ; vide = tout le monde. */
    meetGenders: z.array(GenderSchema).max(4),
    romanceGenders: z.array(GenderSchema).max(4),
  })
  .refine((p) => p.lookingFor === 'FRIENDS' || p.romanceGenders.length > 0, { message: 'romanceGenders requis', path: ['romanceGenders'] })
  .refine((p) => p.lookingFor !== 'FRIENDS' || (p.storySeriousness === null && p.kidsSomeday === null), { message: 'sous-choix réservés à « une histoire »', path: ['storySeriousness'] })
  .refine((p) => uniq(p.meetGenders) && uniq(p.romanceGenders), { message: 'genre en double' });
export type IntentionsV5Dto = z.infer<typeof IntentionsV5Schema>;
/** `PUT /v1/preferences/intentions` (lecture : `GET`, titulaire seulement). */
export const UpdateIntentionsV5RequestSchema = IntentionsV5Schema;

/** Tranche d'âge souhaitée (curseur ; défaut âge ± 4). */
export const GroupAgeSchema = z.object({ min: z.number().int().min(18).max(99), max: z.number().int().min(18).max(99) }).refine((a) => a.min <= a.max, { message: 'min > max' });

/** Préférences de sortie : disponibilités, semaines off, activités, quartiers acceptables, trajet. Jamais de géolocalisation. */
export const OutingPreferencesV5Schema = z.object({
  groupAge: GroupAgeSchema,
  availableSlotTemplateIds: z.array(UuidSchema).max(21).refine(uniq, { message: 'créneau en double' }),
  weeksOff: z.array(z.string().regex(/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/)).max(26).refine(uniq, { message: 'semaine en double' }),
  /** Vide = toutes les activités. */
  activities: z.array(ActivityKindSchema).max(ACTIVITY_KINDS.length).refine(uniq, { message: 'activité en double' }),
  neighborhoodIds: z.array(UuidSchema).min(1).max(5).refine(uniq, { message: 'quartier en double' }),
  /** 20 / 30 / 45 min (`TRAVEL_MINUTES`). */
  maxTravelMinutes: z.number().int().refine((m) => (TRAVEL_MINUTES as readonly number[]).includes(m), { message: 'trajet : 20, 30 ou 45 min' }),
});
export type OutingPreferencesV5Dto = z.infer<typeof OutingPreferencesV5Schema>;
/** `PUT /v1/preferences/outings`. */
export const UpdateOutingPreferencesV5RequestSchema = OutingPreferencesV5Schema;

/** `PUT /v1/preferences/privacy` (V5) : + mode discret ; `mapVisible` ignoré ; `photoPreference=NEVER` bloque sorties/duos. */
export const PrivacySettingsV5Schema = z.object({
  photoPreference: PhotoPreferenceSchema,
  ageDisplay: AgeDisplaySchema,
  discreetMode: z.boolean(),
});
export type PrivacySettingsV5 = z.infer<typeof PrivacySettingsV5Schema>;
export const UpdatePrivacyV5RequestSchema = PrivacySettingsV5Schema.partial().extend({
  /** @deprecated V4, ignoré. */
  mapVisible: z.boolean().optional(),
});

export const OnboardingStepV5Schema = z.enum(ONBOARDING_STEPS_V5);
/** `412 ONBOARDING_INCOMPLETE {missing}` (V5.1 : ville/quartier d'abord, intentions, mode). */
export const OnboardingIncompleteDetailsSchema = z.object({ reason: z.literal('ONBOARDING_INCOMPLETE'), missing: z.array(OnboardingStepV5Schema).min(1) });

export const PREFERENCES_FAILURE_REASONS_V5 = ['PHOTO_REQUIRED', 'ONBOARDING_INCOMPLETE', 'NEIGHBORHOOD_NOT_FOUND', 'SLOT_TEMPLATE_NOT_FOUND'] as const;
