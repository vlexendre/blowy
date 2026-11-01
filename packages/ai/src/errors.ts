/**
 * Erreurs IA normalisées. AUCUNE ne vaut approbation : l'appelant applique toujours
 * le chemin « non analysé » (pending / revue / fallback éditorial).
 */
export const AI_ERROR_CODES = [
  'TIMEOUT',
  'REFUSED',
  'INCOMPLETE',
  'INVALID_FORMAT',
  'CONTEXT_TOO_LARGE',
  'PROVIDER_ERROR',
  'RATE_LIMITED',
  'BUDGET_EXCEEDED',
  'CIRCUIT_OPEN',
  'NOT_CONFIGURED',
  'CANCELLED',
] as const;
export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

/** Codes pour lesquels une nouvelle tentative a un sens (bornée, avec backoff). */
const RETRYABLE: ReadonlySet<AiErrorCode> = new Set(['TIMEOUT', 'PROVIDER_ERROR', 'RATE_LIMITED']);

export class AiError extends Error {
  readonly retryable: boolean;
  constructor(
    readonly code: AiErrorCode,
    message: string,
    readonly meta: { status?: number; provider?: string } = {},
  ) {
    super(message);
    this.name = 'AiError';
    this.retryable = RETRYABLE.has(code);
  }
}

export function isAiError(e: unknown): e is AiError {
  return e instanceof AiError;
}

/** Normalise une erreur quelconque (SDK, réseau, Zod) en AiError, sans recopier de contenu. */
export function toAiError(e: unknown, provider: string): AiError {
  if (isAiError(e)) return e;
  const err = e as { name?: string; status?: number; code?: string; message?: string };
  const status = typeof err?.status === 'number' ? err.status : undefined;
  if (err?.name === 'AbortError' || err?.name === 'APIConnectionTimeoutError' || /timed? ?out/i.test(err?.message ?? '')) return new AiError('TIMEOUT', 'délai dépassé', { provider });
  if (status === 429) return new AiError('RATE_LIMITED', 'limite fournisseur', { status, provider });
  if (status === 400 && /context|too long|maximum context/i.test(err?.message ?? '')) return new AiError('CONTEXT_TOO_LARGE', 'contexte trop long', { status, provider });
  if (status !== undefined && status >= 400 && status < 500) return new AiError('PROVIDER_ERROR', `requête refusée (${status})`, { status, provider });
  if (err?.name === 'ZodError') return new AiError('INVALID_FORMAT', 'sortie non conforme au schéma', { provider });
  return new AiError('PROVIDER_ERROR', 'erreur fournisseur', { ...(status !== undefined ? { status } : {}), provider });
}
