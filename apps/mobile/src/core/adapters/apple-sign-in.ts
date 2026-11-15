/**
 * Connexion avec Apple, hors iPhone : indisponible (Apple n'est proposé que sur iOS ; voir `apple-sign-in.ios.ts`).
 * Metro choisit le fichier `.ios.ts` sur iPhone ; ce fichier-ci sert au web et à Android.
 */
export interface AppleCredential {
  identityToken: string;
}

export const appleSignInAvailable = async (): Promise<boolean> => false;

/** Rend null si la personne annule. */
export async function appleSignIn(): Promise<AppleCredential | null> {
  throw new Error('apple_unavailable');
}
