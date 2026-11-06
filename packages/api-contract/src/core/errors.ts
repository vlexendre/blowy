import { z } from 'zod';

/** Erreur structurée unique : {code,message,detailsSafe,requestId,retryable}. */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  detailsSafe: z.record(z.string(), z.unknown()).optional(),
  requestId: z.string(),
  retryable: z.boolean(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Codes V4 (sans `GONE`).
 * @deprecated V5 — utiliser `API_ERROR_CODES` / `ApiErrorCode` (ajout de `GONE`, D-034).
 * Conservé tant que des `Record<ErrorCode, …>` exhaustifs existent chez les consommateurs.
 */
export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'IDEMPOTENCY_CONFLICT',
  'VERSION_CONFLICT',
  'PRECONDITION_FAILED',
  'CAPACITY_EXCEEDED',
  'RATE_LIMITED',
  'BLOCKED',
  'AGE_RESTRICTED',
  'CONSENT_REQUIRED',
  'ENTITLEMENT_REQUIRED',
  'INSUFFICIENT_FUNDS',
  'PROVIDER_UNAVAILABLE',
  'NOT_CONFIGURED',
  'INTERNAL',
] as const;
/** @deprecated V5 — utiliser `ApiErrorCode`. */
export type ErrorCode = (typeof ERROR_CODES)[number];

/** Codes d'erreur génériques V5 : V4 + `GONE` (410, routes V4 retirées, D-034 / spec-v5 §7.7). */
export const API_ERROR_CODES = [...ERROR_CODES, 'GONE'] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
export const ApiErrorCodeSchema = z.enum(API_ERROR_CODES);

/** Statut HTTP par défaut de chaque code (source unique pour le mapper d'erreurs du backend). */
export const ERROR_HTTP_STATUS: Readonly<Record<ApiErrorCode, number>> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  VERSION_CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  CAPACITY_EXCEEDED: 409,
  RATE_LIMITED: 429,
  BLOCKED: 403,
  AGE_RESTRICTED: 403,
  CONSENT_REQUIRED: 403,
  ENTITLEMENT_REQUIRED: 402,
  INSUFFICIENT_FUNDS: 409,
  PROVIDER_UNAVAILABLE: 503,
  NOT_CONFIGURED: 501,
  INTERNAL: 500,
  GONE: 410,
};

/** Motif d'une route V4 retirée : `410 GONE {reason:"RETIRED_IN_V5"}`. */
export const RETIRED_IN_V5 = 'RETIRED_IN_V5' as const;
export const GoneDetailsSchema = z.object({ reason: z.literal(RETIRED_IN_V5) });
export type GoneDetails = z.infer<typeof GoneDetailsSchema>;

/**
 * Motif métier dans `detailsSafe.reason` (ex. `412 PRECONDITION_FAILED {reason:"RELIABILITY_PAUSED"}`).
 * Chaque module V5 publie sa liste de motifs (`OUTING_FAILURE_REASONS`, …) ; ce helper type un détail.
 */
export const reasonDetails = <const R extends readonly [string, ...string[]]>(reasons: R) =>
  z.object({ reason: z.enum(reasons) }).catchall(z.unknown());
