/**
 * Erreur métier unique. Les codes sont ceux du contrat (@blowy/api-contract core/errors).
 * Mappée en réponse HTTP structurée par interface/error.filter.ts.
 */
import { ERROR_HTTP_STATUS, type ApiErrorCode } from '@blowy/api-contract';

/** Code d'erreur générique V5 (V4 + `GONE`), statut par défaut = `ERROR_HTTP_STATUS` (source unique du contrat). */
export type ErrorCode = ApiErrorCode;
const DEFAULT_STATUS = ERROR_HTTP_STATUS;

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
  /** Route V4 retirée en V5 : `410 GONE {reason:"RETIRED_IN_V5"}`. */
  gone: () => new AppError('GONE', 'Fonctionnalité retirée', { detailsSafe: { reason: 'RETIRED_IN_V5' } }),
};
