/**
 * Socle TanStack Query : client configuré (pas de retry sur erreur non réessayable / route
 * absente) et petits utilitaires pour présenter l'état d'une requête de façon honnête.
 */
import { QueryClient } from '@tanstack/react-query';
import { isNetworkError, isRetryable, isUnavailable } from './errors';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 24 * 3_600_000,
        retry: (count, e) => isRetryable(e) && !isUnavailable(e) && count < 2,
        networkMode: 'offlineFirst',
      },
      mutations: { retry: false, networkMode: 'online' },
    },
  });
}

export type ViewState = 'loading' | 'ready' | 'empty' | 'unavailable' | 'offline' | 'error';

/** Réduit l'état d'une requête en état d'écran (sans jamais fabriquer de données). */
export function viewStateOf(q: { isLoading: boolean; error: unknown; data: unknown }, isEmpty?: (d: unknown) => boolean): ViewState {
  if (q.data !== undefined && q.data !== null) return isEmpty?.(q.data) ? 'empty' : 'ready';
  if (q.isLoading) return 'loading';
  if (isUnavailable(q.error)) return 'unavailable';
  if (isNetworkError(q.error)) return 'offline';
  if (q.error) return 'error';
  return 'loading';
}
