/** Utilisateur authentifié et port de résolution de session (implémenté par le module auth). */
export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}
export interface SessionResolver {
  resolve(token: string): Promise<AuthenticatedUser | null>;
}
export const SESSION_RESOLVER = Symbol('SessionResolver');
