import type { IntegrationMode } from '@blowy/api-contract';

export type AuthProviderKind = 'apple' | 'google' | 'local';

/** Preuve d'identité à échanger contre une session Blowy (POST /v1/auth/sessions). */
export interface AuthCredential {
  provider: 'firebase' | 'local';
  credential: string;
  /** Prénom fourni par le fournisseur s'il l'a partagé (jamais exigé). */
  givenName?: string | null;
}

/**
 * AuthPort : obtient un credential fournisseur. L'échange contre une session et le stockage
 * du jeton sont faits par la feature auth (repository), jamais par l'adaptateur.
 */
export interface AuthPort {
  readonly mode: IntegrationMode;
  /** Fournisseurs réellement disponibles sur cet appareil/cette build. */
  available(): Promise<readonly AuthProviderKind[]>;
  signIn(kind: AuthProviderKind): Promise<AuthCredential>;
  signOut(): Promise<void>;
}
