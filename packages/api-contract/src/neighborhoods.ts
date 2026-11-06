/**
 * Contrats /v1/neighborhoods, /v1/me/neighborhood (spec-v5 §2.1–2.3, §7.1). Propriétaire : C.
 * Liste d'attente : vrais nombres du quartier, AUCUNE position individuelle (D-030).
 */
import { z } from 'zod';
import { NEIGHBORHOOD_STATUSES, VENUE_ACCESSIBILITY_TAGS, VENUE_STATUSES } from '@blowy/domain';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const NeighborhoodStatusSchema = z.enum(NEIGHBORHOOD_STATUSES);
export const VenueStatusSchema = z.enum(VENUE_STATUSES);
export const VenueAccessibilityTagSchema = z.enum(VENUE_ACCESSIBILITY_TAGS);
export const NeighborhoodSlugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(64);

export const NEIGHBORHOOD_FAILURE_REASONS = ['NEIGHBORHOOD_CHANGE_TOO_SOON', 'ACTIVE_SEAT_EXISTS', 'NEIGHBORHOOD_CLOSED'] as const;
export const NeighborhoodFailureReasonSchema = z.enum(NEIGHBORHOOD_FAILURE_REASONS);
/** Détail de `412 NEIGHBORHOOD_CHANGE_TOO_SOON`. */
export const NeighborhoodChangeTooSoonDetailsSchema = z.object({ reason: z.literal('NEIGHBORHOOD_CHANGE_TOO_SOON'), availableAt: IsoDateTimeSchema });

/** `GET /v1/neighborhoods` : quartiers LIVE + WAITLIST. */
export const NeighborhoodListItemSchema = z.object({
  id: UuidSchema,
  slug: NeighborhoodSlugSchema,
  name: z.string(),
  status: NeighborhoodStatusSchema,
  city: z.string(),
});
export type NeighborhoodListItem = z.infer<typeof NeighborhoodListItemSchema>;
export const NeighborhoodListSchema = z.object({ items: z.array(NeighborhoodListItemSchema) });
/** V5.1 (B.5) : « Tu sors où ? » — saisie libre avec suggestions (`GET /v1/neighborhoods?q=`), jamais de géolocalisation. */
export const NeighborhoodSearchQuerySchema = z.object({ q: z.string().trim().max(64).optional() });

/** `PUT /v1/me/neighborhood` (`me.set_neighborhood`). */
export const SetNeighborhoodRequestSchema = z.object({ neighborhoodId: UuidSchema });
export type SetNeighborhoodRequest = z.infer<typeof SetNeighborhoodRequestSchema>;

/**
 * Écran d'attente d'un quartier pas encore ouvert : vérifiés de la ville (compté, jamais gonflé) et écart
 * réel « il manque N ». D-035 : plus de seuil de densité exposé (`threshold` retiré, indicateur admin seulement).
 */
export const WaitlistProgressSchema = z.object({
  verifiedCount: z.number().int().nonnegative(),
  /** V5.1 (B.6) : date estimée honnête (absente si non estimable). */
  estimatedLaunchAt: IsoDateTimeSchema.optional(),
  /** V5.1 (B.7) : une team de 3 vérifiés peut déclencher une sortie d'amorçage. */
  seedingAvailable: z.boolean(),
  /**
   * V5.2 (A.2) : « sur tes créneaux, il manque N personnes pour la sortie du <date> » (vrais
   * nombres : demandes vérifiées compatibles avec le créneau). Absent si aucun créneau proposé.
   */
  nextOutingGap: z.object({ missing: z.number().int().nonnegative(), startsAt: IsoDateTimeSchema }).optional(),
});

/** `GET /v1/me/neighborhood` et réponse de `PUT`. */
export const NeighborhoodStatusViewSchema = z
  .object({
    /** null tant que la personne n'a pas choisi de quartier. */
    neighborhood: z.object({ id: UuidSchema, name: z.string(), status: NeighborhoodStatusSchema }).nullable(),
    /** Présent seulement si le quartier n'est pas LIVE. */
    waitlist: WaitlistProgressSchema.optional(),
    isVerified: z.boolean(),
    hasPhoto: z.boolean(),
  })
  .strict();
export type NeighborhoodStatusView = z.infer<typeof NeighborhoodStatusViewSchema>;
