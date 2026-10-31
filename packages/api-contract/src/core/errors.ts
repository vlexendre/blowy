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
export type ErrorCode = (typeof ERROR_CODES)[number];
