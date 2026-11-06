/**
 * Contrats /v1/safety, page publique gardien /v1/public/guardian/:token (spec-v5 §2.9, §7.4, D-024).
 * Propriétaire : E. Le jeton n'est rendu qu'une fois ; la page gardien ne montre jamais les autres
 * participants, le chat, la fiabilité ni une position (sauf position jointe à une alerte).
 * Jeton inconnu, expiré ou révoqué : MÊME réponse 404.
 */
import { z } from 'zod';
import { EMERGENCY_NUMBERS, REPORT_CATEGORIES_V5, GUARDIAN_LABEL_MAX, GUARDIAN_SUBJECT_KINDS, GUARDIAN_TIMELINE_TYPES, SAFETY_ALERT_STATUSES } from '@blowy/domain';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const GuardianSubjectKindSchema = z.enum(GUARDIAN_SUBJECT_KINDS);
export const SafetyAlertStatusSchema = z.enum(SAFETY_ALERT_STATUSES);
export const GuardianTimelineTypeSchema = z.enum(GUARDIAN_TIMELINE_TYPES);
export const EmergencyNumbersSchema = z.array(z.enum(EMERGENCY_NUMBERS)).min(1);

export const SAFETY_FAILURE_REASONS = ['SUBJECT_NOT_CONFIRMED', 'SUBJECT_NOT_ACTIVE', 'GUARDIAN_LINK_LIMIT'] as const;
export const SafetyFailureReasonSchema = z.enum(SAFETY_FAILURE_REASONS);

/** Motifs de signalement V5.1 (G.19) : + menace d'outing, comportement pendant la sortie. */
export const ReportCategoryV5Schema = z.enum(REPORT_CATEGORIES_V5);

export const SafetySubjectSchema = z.object({ kind: GuardianSubjectKindSchema, id: UuidSchema });
export type SafetySubject = z.infer<typeof SafetySubjectSchema>;

/** Jeton base64url de 32 octets (43 caractères). */
export const GuardianTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

/** Position ponctuelle jointe à une alerte, par choix explicite uniquement. */
export const AlertPositionSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracyM: z.number().min(0).max(100_000) });

// ---------------------------------------------------------------- liens gardien
export const CreateGuardianLinkRequestSchema = z.object({
  subject: SafetySubjectSchema,
  label: z.string().trim().min(1).max(GUARDIAN_LABEL_MAX).optional(),
});
export type CreateGuardianLinkRequest = z.infer<typeof CreateGuardianLinkRequestSchema>;
/** L'URL (avec le jeton) n'est rendue qu'ici, une seule fois. */
export const CreateGuardianLinkResponseSchema = z.object({ id: UuidSchema, url: z.string().url(), activeFrom: IsoDateTimeSchema, expiresAt: IsoDateTimeSchema });
export type CreateGuardianLinkResponse = z.infer<typeof CreateGuardianLinkResponseSchema>;

export const GuardianLinksQuerySchema = z.object({ subjectKind: GuardianSubjectKindSchema, subjectId: UuidSchema });
/** Liste (sans URL ni jeton). */
export const GuardianLinkListSchema = z.object({
  items: z.array(z.object({ id: UuidSchema, label: z.string().nullable(), createdAt: IsoDateTimeSchema, lastViewedAt: IsoDateTimeSchema.nullable(), revoked: z.boolean() }).strict()),
});

// ---------------------------------------------------------------- « tout va bien », alertes
export const SafetyOkRequestSchema = z.object({ subject: SafetySubjectSchema });
export const RaiseAlertRequestSchema = z.object({ subject: SafetySubjectSchema, position: AlertPositionSchema.optional() });
export type RaiseAlertRequest = z.infer<typeof RaiseAlertRequestSchema>;
export const RaiseAlertResponseSchema = z.object({ alertId: UuidSchema, emergencyNumbers: EmergencyNumbersSchema });
export const ResolveAlertRequestSchema = z.object({ status: z.literal('SAFE') });

// ---------------------------------------------------------------- page publique du proche
export const GuardianPageViewSchema = z
  .object({
    ownerFirstName: z.string(),
    kind: GuardianSubjectKindSchema,
    startsAt: IsoDateTimeSchema,
    endsAt: IsoDateTimeSchema,
    /** Seulement à partir du verrouillage (avant : « lieu communiqué la veille »). */
    venue: z.object({ name: z.string(), address: z.string() }).strict().optional(),
    timeline: z.array(z.object({ type: GuardianTimelineTypeSchema, at: IsoDateTimeSchema }).strict()),
    alert: z.object({ at: IsoDateTimeSchema, position: AlertPositionSchema.optional() }).strict().optional(),
    /** Fenêtre active : `startsAt − 2 h` → `endsAt + 3 h`. */
    active: z.boolean(),
    emergencyNumbers: EmergencyNumbersSchema,
  })
  .strict();
export type GuardianPageView = z.infer<typeof GuardianPageViewSchema>;

/** `POST /v1/public/guardian/:token/push` : abonnement Web Push optionnel du proche. */
export const GuardianPushSubscriptionRequestSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url().max(2048),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(128) }),
  }),
});

// ---------------------------------------------------------------- événements WS
export const SafetyAlertAckEventSchema = z.object({ alertId: UuidSchema });
/** Extension V5 de `access.revoked` : portée de la révocation. */
export const AccessRevokedV5EventSchema = z.object({ room: z.string().optional(), scope: z.enum(['OUTING', 'DUO', 'BAND']), id: UuidSchema });
