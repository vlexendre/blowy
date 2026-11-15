/**
 * Connexion avec Apple, hors iPhone : indisponible (Apple n'est proposé que sur iOS ; voir `apple-sign-in.ios.ts`).
 * Metro choisit le fichier `.ios.ts` sur iPhone ; ce fichier-ci sert au web et à Android.
 */
export interface AppleCredential {
  identityToken: string;
  /** Code d'autorisation (5 minutes, une fois) : l'API l'échange pour pouvoir révoquer l'accès à la suppression. */
  authorizationCode: string | null;
}

export const appleSignInAvailable = async (): Promise<boolean> => false;

/** Rend null si la personne annule. */
export async function appleSignIn(): Promise<AppleCredential | null> {
  throw new Error('apple_unavailable');
}
