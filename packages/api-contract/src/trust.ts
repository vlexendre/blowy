/** Contrats confiance : signalements, blocages, recours, export, suppression (propriétaire : agent E). */
import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const REPORT_CATEGORIES = ['FAKE_PROFILE', 'INAPPROPRIATE', 'HARASSMENT', 'MONEY_REQUEST', 'MINOR', 'SAFETY', 'OTHER'] as const;

/**
 * Motifs V5 (V5.1 G.19, V5.2 H.23) acceptés par `POST /v1/reports` : + « menace d'outing »
 * (`OUTING_THREAT`), « comportement pendant la sortie » (`IRL_BEHAVIOR`), « incident sur place »
 * (`ON_SITE_INCIDENT` : lieu, personnel, autre client — personne visée facultative) et « absences
 * répétées » (`REPEATED_NO_SHOW`). Rétrocompatible : les motifs V4 restent valides.
 */
export const REPORT_CATEGORIES_V52 = [...REPORT_CATEGORIES, 'OUTING_THREAT', 'IRL_BEHAVIOR', 'ON_SITE_INCIDENT', 'REPEATED_NO_SHOW'] as const;
export type ReportCategoryV52 = (typeof REPORT_CATEGORIES_V52)[number];

/**
 * Cible V5 : une sortie que le signaleur partage (ou a partagée) avec la personne visée. `userId`
 * est celui que la vue de sortie lui a montré (`members[].userId`) ; il est revérifié côté serveur
 * (les deux ont une place dans cette sortie), sinon 404 neutre. Sans `userId` : seul le motif
 * `ON_SITE_INCIDENT` est accepté (incident lié au lieu).
 */
export const OutingTargetSchema = z.object({ id: UuidSchema, userId: UuidSchema.optional() }).strict();

/** Cible désignée par un objet que le signaleur connaît (jamais un identifiant utilisateur brut hors contexte). */
export const TrustTargetSchema = z
  .object({ relationshipId: UuidSchema.optional(), petId: UuidSchema.optional(), messageId: UuidSchema.optional(), outing: OutingTargetSchema.optional() })
  .refine((t) => !!(t.relationshipId || t.petId || t.messageId || t.outing), { message: 'cible requise' });

export const CreateReportRequestSchema = z.object({
  target: TrustTargetSchema,
  category: z.enum(REPORT_CATEGORIES_V52),
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
  category: z.enum(REPORT_CATEGORIES_V52),
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
