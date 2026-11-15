/**
 * Contrat « revue » : le compte de revue d'Apple (App Review 2.1(a)). Une seule adresse, configurée sur le serveur
 * (`REVIEW_EMAIL`, `REVIEW_CODE`), peut ouvrir une session avec son adresse et un code fixe ; toute autre adresse reçoit
 * la même erreur qu'un mauvais code. Ce compte reçoit un monde d'exemple que lui seul voit. Ne dépend que de zod.
 */
import { z } from 'zod';

const API = '/v1';

/** `POST /v1/review/session` (public, limité par adresse IP). */
export const ReviewSessionBody = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  code: z.string().trim().min(4).max(64),
});
export type ReviewSessionBody = z.infer<typeof ReviewSessionBody>;

/**
 * Session ouverte : jetons Supabase (l'app les pose avec `auth.setSession`) ; en local (adaptateurs mémoire),
 * `accessToken` est le jeton de test `test:<uuid>:<e-mail>` et `refreshToken` est vide.
 */
export const ReviewSessionZ = z.object({
  userId: z.string().uuid(),
  email: z.string(),
  accessToken: z.string().min(1),
  refreshToken: z.string(),
  /** Le compte a déjà son minimoa : son monde d'exemple vient d'être remis à neuf. */
  worldReset: z.boolean(),
});
export type ReviewSession = z.infer<typeof ReviewSessionZ>;

/** `POST /v1/review/reset` (le compte de revue seulement) : remet le monde d'exemple à neuf. */
export const ReviewResetZ = z.object({ ok: z.literal(true), fixtures: z.number().int() });
export type ReviewReset = z.infer<typeof ReviewResetZ>;

export const reviewRoutes = {
  session: () => `${API}/review/session`,
  reset: () => `${API}/review/reset`,
} as const;
