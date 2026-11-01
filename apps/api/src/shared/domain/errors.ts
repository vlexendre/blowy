/**
 * Erreur métier unique. Les codes sont ceux du contrat (@blowy/api-contract core/errors).
 * Mappée en réponse HTTP structurée par interface/error.filter.ts.
 */
import type { ErrorCode } from '@blowy/api-contract';

const DEFAULT_STATUS: Record<ErrorCode, number> = {
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
};

export interface AppErrorOptions {
  detailsSafe?: Record<string, unknown>;
  retryable?: boolean;
  status?: number;
}

export class AppError extends Error {
  readonly status: number;
  readonly detailsSafe: Record<string, unknown> | undefined;
  readonly retryable: boolean;

  constructor(
    readonly code: ErrorCode,
    message: string,
    opts: AppErrorOptions = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.status = opts.status ?? DEFAULT_STATUS[code];
    this.detailsSafe = opts.detailsSafe;
    this.retryable = opts.retryable ?? (code === 'PROVIDER_UNAVAILABLE' || code === 'RATE_LIMITED');
  }
}

/** Fabriques courtes, utilisées par tous les modules (aucune duplication de messages). */
export const Errors = {
  notFound: (what: string) => new AppError('NOT_FOUND', `${what} introuvable`),
  forbidden: (why = 'Accès refusé') => new AppError('FORBIDDEN', why),
  precondition: (reason: string, detailsSafe?: Record<string, unknown>) =>
    new AppError('PRECONDITION_FAILED', reason, { detailsSafe: { reason, ...detailsSafe } }),
  conflict: (reason: string) => new AppError('CONFLICT', reason, { detailsSafe: { reason } }),
  validation: (detailsSafe: Record<string, unknown>) => new AppError('VALIDATION_FAILED', 'Requête invalide', { detailsSafe }),
  unauthenticated: () => new AppError('UNAUTHENTICATED', 'Authentification requise'),
};
