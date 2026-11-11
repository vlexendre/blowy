import { type SupabaseClient, createClient } from '@supabase/supabase-js';

/** Client unique avec la clé service : l'API est le seul écrivain de la base. */
export function createServiceClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

interface PgError {
  code?: string;
  message: string;
}

/** Lève une erreur technique si la requête a échoué (le filtre global la transforme en `internal`). */
export function check(error: PgError | null, what: string): void {
  if (error) throw new Error(`${what} : ${error.message}`);
}

/** Violation d'unicité Postgres. */
export const isUniqueViolation = (error: PgError | null): boolean => error?.code === '23505';

/** Normalise un timestamptz Postgres (« …+00:00 », microsecondes) au format ISO de JavaScript. */
export const iso = (value: string): string => new Date(value).toISOString();
export const isoOrNull = (value: string | null): string | null => (value === null ? null : iso(value));
