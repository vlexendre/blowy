import { z } from 'zod';

export const API_VERSION = 'v1' as const;

export const UuidSchema = z.string().uuid();
export const IsoDateTimeSchema = z.string().datetime({ offset: true });

/** Pagination par curseur opaque. */
export const PageQuerySchema = z.object({
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PageQuery = z.infer<typeof PageQuerySchema>;

export const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });

/** Mode d'intégration exposé honnêtement au client (jamais « opérationnel » si simulé). */
export const IntegrationModeSchema = z.enum(['LIVE', 'SANDBOX', 'LOCAL_DEMO', 'NOT_CONFIGURED']);
export type IntegrationMode = z.infer<typeof IntegrationModeSchema>;

/** Semaine ISO du quartier, ex. `2026-W46` (spec-v5 §1). */
export const WeekKeySchema = z.string().regex(/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/);
/** Montants en centimes entiers ; le serveur fixe toujours le montant. */
export const AmountCentsSchema = z.number().int().positive();
export const CurrencySchema = z.enum(['EUR']);
