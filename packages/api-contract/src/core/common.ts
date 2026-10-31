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
