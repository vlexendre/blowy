/**
 * Connexion par e-mail et code (compte de revue d'Apple) : l'API vérifie l'adresse et le code configurés sur le
 * serveur et rend une session. Partagé par l'adaptateur Supabase (jetons posés avec `setSession`) et l'adaptateur local
 * (jeton de test). Aucune adresse ni aucun code n'est connu de l'app.
 */
import { ApiErrorZ, type ReviewSession, ReviewSessionZ, reviewRoutes } from '@blowy/contract';

import { config } from '../config';
import { AuthError } from '../ports';
import { common } from '@/locales/common';

export async function reviewSession(email: string, code: string): Promise<ReviewSession> {
  let res: Response;
  try {
    res = await fetch(`${config.apiUrl.replace(/\/$/, '')}${reviewRoutes.session()}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
    });
  } catch {
    throw new AuthError('network', common.errors.network);
  }
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ApiErrorZ.safeParse(json);
    if (res.status === 429) throw new AuthError('rate_limited', parsed.success ? parsed.data.error.message : common.errors.rateLimited);
    if (res.status === 400) throw new AuthError('invalid_email', common.errors.invalidEmail);
    throw new AuthError('invalid_code', parsed.success ? parsed.data.error.message : common.errors.invalidCode);
  }
  const parsed = ReviewSessionZ.safeParse(json);
  if (!parsed.success) throw new AuthError('unknown', common.errors.unknown);
  return parsed.data;
}
