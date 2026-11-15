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
  /**
   * Identifiants du compte chez son fournisseur de connexion (Apple, Google ; l'e-mail en local), pour l'exclusion
   * définitive (seule leur empreinte est gardée). Vide si le compte n'existe plus.
   */
  subjectsOf(userId: string): Promise<{ provider: string; subject: string }[]>;
}

/** Retrouve l'e-mail d'une personne pour lui écrire. */
export interface UserEmails {
  emailOf(userId: string): Promise<string | null>;
}
