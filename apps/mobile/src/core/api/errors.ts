/**
 * Normalisation des erreurs du client API (BlowyApiError) pour l'UI et la file hors ligne.
 * Route absente côté serveur (Nest « Cannot GET … ») → état « indisponible » honnête.
 */
import { BlowyApiError } from '@blowy/api-client';

export { BlowyApiError };

export const isRouteMissing = (code: string, message: string, details?: Record<string, unknown>): boolean =>
  code === 'NOT_FOUND' && (details?.reason === 'ROUTE_NOT_FOUND' || /^Cannot (GET|POST|PUT|PATCH|DELETE) /.test(message));

/** Erreur réseau : le client renvoie status 0 + PROVIDER_UNAVAILABLE. */
export const isNetworkError = (e: unknown): boolean => e instanceof BlowyApiError && e.status === 0;

export const isUnavailable = (e: unknown): boolean =>
  e instanceof BlowyApiError && (isRouteMissing(e.code, e.message, e.error.detailsSafe) || e.code === 'NOT_CONFIGURED' || e.status === 501);

export const isRetryable = (e: unknown): boolean => (e instanceof BlowyApiError ? e.retryable || e.status === 0 : true);

export const errorCode = (e: unknown): string => (e instanceof BlowyApiError ? e.code : e instanceof Error ? e.name : 'UNKNOWN');
