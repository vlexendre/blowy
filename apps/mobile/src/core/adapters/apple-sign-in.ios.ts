/**
 * Connexion avec Apple sur iPhone (`expo-apple-authentication`, feuille système). Seule l'adresse e-mail est demandée :
 * l'API s'en sert pour les e-mails transactionnels ; le prénom, lui, est demandé dans l'inscription (« On t'appelle
 * comment ? »), donc le nom complet n'est pas demandé à Apple (règle : ne demander que ce qui sert).
 * La personne peut masquer son adresse (relais d'Apple) : rien ne change pour Minimoa.
 */
import * as AppleAuthentication from 'expo-apple-authentication';

export interface AppleCredential {
  identityToken: string;
  /** Code d'autorisation (5 minutes, une fois) : l'API l'échange pour pouvoir révoquer l'accès à la suppression. */
  authorizationCode: string | null;
}

export const appleSignInAvailable = (): Promise<boolean> => AppleAuthentication.isAvailableAsync().catch(() => false);

/** Rend null si la personne annule (`ERR_REQUEST_CANCELED`). */
export async function appleSignIn(): Promise<AppleCredential | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL] });
    if (!credential.identityToken) throw new Error('no_identity_token');
    return { identityToken: credential.identityToken, authorizationCode: credential.authorizationCode ?? null };
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}
