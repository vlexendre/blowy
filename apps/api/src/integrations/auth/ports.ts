/** Identité tirée d'un jeton d'accès. */
export interface AuthUser {
  userId: string;
  email: string | null;
}

/** Vérifie un jeton Bearer ; null si invalide ou expiré. */
export interface AuthVerifier {
  verify(token: string): Promise<AuthUser | null>;
}

/** Administration des comptes : suppression (en cascade sur toutes les données). */
export interface AuthAdmin {
  deleteUser(userId: string): Promise<void>;
}

/** Retrouve l'e-mail d'une personne pour lui écrire. */
export interface UserEmails {
  emailOf(userId: string): Promise<string | null>;
}
