/**
 * Contrat « compte » : ce que l'app envoie à l'API autour de la connexion.
 * Sign in with Apple : à la connexion sur iPhone, l'app transmet le code d'autorisation d'Apple (valable 5 minutes,
 * une seule fois). L'API l'échange auprès d'Apple contre un jeton de rafraîchissement, gardé côté serveur, pour pouvoir
 * révoquer l'accès quand le compte est supprimé (exigence d'Apple). Ne dépend que de zod.
 */
import { z } from 'zod';

const API = '/v1';

/** `POST /v1/me/apple-authorization` (connecté) : le code d'autorisation de `expo-apple-authentication`. */
export const AppleAuthorizationBody = z.object({ authorizationCode: z.string().trim().min(10).max(2000) });
export type AppleAuthorizationBody = z.infer<typeof AppleAuthorizationBody>;
/** stored : jeton gardé · skipped : pas de révocation configurée côté serveur (rien à faire pour l'app). */
export const AppleAuthorizationZ = z.object({ status: z.enum(['stored', 'skipped']) });
export type AppleAuthorization = z.infer<typeof AppleAuthorizationZ>;

export const compteRoutes = {
  appleAuthorization: () => `${API}/me/apple-authorization`,
} as const;
