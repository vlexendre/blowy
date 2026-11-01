/** Contrats confiance : signalements, blocages, recours, export, suppression (propriétaire : agent E). */
import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const REPORT_CATEGORIES = ['FAKE_PROFILE', 'INAPPROPRIATE', 'HARASSMENT', 'MONEY_REQUEST', 'MINOR', 'SAFETY', 'OTHER'] as const;

/** Cible désignée par un objet que le signaleur connaît (jamais un identifiant utilisateur brut). */
export const TrustTargetSchema = z
  .object({ relationshipId: UuidSchema.optional(), petId: UuidSchema.optional(), messageId: UuidSchema.optional() })
  .refine((t) => !!(t.relationshipId || t.petId || t.messageId), { message: 'cible requise' });

export const CreateReportRequestSchema = z.object({
  target: TrustTargetSchema,
  category: z.enum(REPORT_CATEGORIES),
  /** Précision facultative, privée, jamais montrée à la personne signalée. */
  note: z.string().trim().max(1000).optional(),
  /** Sortie de sécurité : fin immédiate de la relation, sans message ni pénalité. */
  safetyExit: z.boolean().default(false),
  alsoBlock: z.boolean().default(false),
});
export type CreateReportRequest = z.infer<typeof CreateReportRequestSchema>;

/** Vue du signaleur (jamais renvoyée à la personne signalée). */
export const ReportViewSchema = z.object({
  id: UuidSchema,
  category: z.enum(REPORT_CATEGORIES),
  status: z.enum(['OPEN', 'IN_REVIEW', 'ACTIONED', 'DISMISSED']),
  safetyExit: z.boolean(),
  blocked: z.boolean(),
  createdAt: IsoDateTimeSchema,
});

export const CreateBlockRequestSchema = z.object({ target: TrustTargetSchema });
export const BlockViewSchema = z.object({ id: UuidSchema, petName: z.string().nullable(), createdAt: IsoDateTimeSchema });
export const BlockListSchema = z.object({ items: z.array(BlockViewSchema) });

export const CreateAppealRequestSchema = z.object({
  subjectType: z.enum(['MESSAGE', 'MEDIA', 'MISSION_SUBMISSION']),
  subjectId: UuidSchema,
  /** Texte libre facultatif (privé, purgeable). */
  note: z.string().trim().max(1000).optional(),
});
export const AppealViewSchema = z.object({ id: UuidSchema, status: z.enum(['OPEN', 'UPHELD', 'OVERTURNED']), createdAt: IsoDateTimeSchema });

export const ExportViewSchema = z.object({
  id: UuidSchema,
  status: z.enum(['REQUESTED', 'RUNNING', 'READY', 'EXPIRED', 'FAILED']),
  requestedAt: IsoDateTimeSchema,
  readyAt: IsoDateTimeSchema.nullable(),
  expiresAt: IsoDateTimeSchema.nullable(),
  /** Lien privé à durée limitée (révoqué par rotation du nonce). */
  downloadUrl: z.string().nullable(),
});
export type ExportView = z.infer<typeof ExportViewSchema>;

export const CreateDeletionRequestSchema = z.object({
  /** Confirmation explicite tapée par la personne. */
  confirm: z.literal('SUPPRIMER'),
});
export const DeletionViewSchema = z.object({
  id: UuidSchema,
  status: z.enum(['REQUESTED', 'REVOKING', 'PURGING', 'COMPLETED']),
  requestedAt: IsoDateTimeSchema,
  purgeAfter: IsoDateTimeSchema.nullable(),
  backupPurgeAfter: IsoDateTimeSchema.nullable(),
});
