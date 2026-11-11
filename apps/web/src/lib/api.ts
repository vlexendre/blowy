/** Client de l'API pour le navigateur (pages publiques, sans session). */
import { ApiError, createApiClient } from '@blowy/api-client';
import { API_URL } from '../config/site';

export const api = createApiClient({ baseUrl: API_URL });

export type Failure = 'not_found' | 'already_done' | 'network' | 'rate_limited' | 'invalid' | 'other';

/** Ramène toute erreur (API, réseau, réponse hors contrat) à un cas d'affichage. */
export function failureOf(e: unknown): Failure {
  if (e instanceof ApiError) {
    if (e.code === 'not_found' || e.code === 'already_done' || e.code === 'network' || e.code === 'rate_limited' || e.code === 'invalid') return e.code;
  }
  return 'other';
}
